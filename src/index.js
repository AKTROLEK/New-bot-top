import { Client, GatewayIntentBits, Collection, Partials } from 'discord.js';
import config from './config.js';
import logger from './utils/logger.js';
import i18n from './utils/i18n.js';
import database from './models/database.js';
import { readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
  partials: [
    Partials.Channel,
    Partials.Message,
    Partials.User,
    Partials.GuildMember,
  ],
});

// Initialize collections
client.commands = new Collection();
client.events = new Collection();

// Store web server reference
let webServer = null;

// Constants
const PLACEHOLDER_TOKEN = 'test_token_placeholder';

// Startup function
async function startup() {
  try {
    logger.info('🚀 Starting Discord Bot...');

    // Load language files
    await i18n.load();
    logger.info('✅ Language files loaded');

    // Connect to database
    await database.connect();
    logger.info('✅ Database connected');

    // Start web dashboard first (so it's available even if bot fails)
    await startWebDashboard();

    // Try to start the bot (but don't fail if it can't connect)
    try {
      // Load event handlers
      await loadEvents();
      logger.info('✅ Events loaded');

      // Load command handlers
      await loadCommands();
      logger.info('✅ Commands loaded');

      // Login to Discord
      if (config.discord.token && config.discord.token !== PLACEHOLDER_TOKEN) {
        await client.login(config.discord.token);
        logger.info('✅ Bot logged in successfully');
        
        // Update web dashboard with bot client after successful login
        await updateWebDashboardClient();
      } else {
        logger.warn('⚠️ No valid Discord token provided - bot will not connect');
        logger.info('💡 Web dashboard is still available');
      }
    } catch (botError) {
      logger.error('❌ Bot failed to start:', botError);
      logger.info('💡 Web dashboard is still running without bot connection');
    }

  } catch (error) {
    logger.error('❌ Critical error during startup:', error);
    process.exit(1);
  }
}

// Start web dashboard
async function startWebDashboard() {
  try {
    const { start } = await import('./web/server.js');
    // Start without client initially - will be updated after bot login
    webServer = await start(null);
    logger.info('✅ Web dashboard started successfully');
  } catch (error) {
    logger.error('❌ Error starting web dashboard:', error);
    throw error; // Web dashboard is critical, so throw error
  }
}

// Update web dashboard with bot client
async function updateWebDashboardClient() {
  try {
    const { updateClient } = await import('./web/server.js');
    if (updateClient) {
      updateClient(client);
      logger.info('✅ Bot connected to web dashboard');
    }
  } catch (error) {
    logger.warn('⚠️ Could not update web dashboard with bot client:', error);
  }
}

// Load event handlers
async function loadEvents() {
  const eventsPath = join(__dirname, 'events');
  const eventFiles = readdirSync(eventsPath).filter(file => file.endsWith('.js'));

  for (const file of eventFiles) {
    const filePath = join(eventsPath, file);
    const event = await import(`file://${filePath}`);
    
    if (event.default?.once) {
      client.once(event.default.name, (...args) => event.default.execute(...args, client));
    } else if (event.default?.name) {
      client.on(event.default.name, (...args) => event.default.execute(...args, client));
    }
  }
}

// Load command handlers
async function loadCommands() {
  const commandsPath = join(__dirname, 'commands');
  const commandFolders = readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const commandFiles = readdirSync(join(commandsPath, folder)).filter(file => file.endsWith('.js'));
    
    for (const file of commandFiles) {
      const filePath = join(commandsPath, folder, file);
      const command = await import(`file://${filePath}`);
      
      if (command.default?.data && command.default?.execute) {
        client.commands.set(command.default.data.name, command.default);
      }
    }
  }
}

// Handle uncaught errors
process.on('unhandledRejection', error => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', error => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down...');
  if (webServer) {
    webServer.close();
  }
  client.destroy();
  database.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.info('Shutting down...');
  if (webServer) {
    webServer.close();
  }
  client.destroy();
  database.close();
  process.exit(0);
});

// Start the bot
startup();

export default client;
