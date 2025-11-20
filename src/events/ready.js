import { ActivityType, REST, Routes } from 'discord.js';
import config from '../config.js';
import logger from '../utils/logger.js';
import i18n from '../utils/i18n.js';

export default {
  name: 'ready',
  once: true,
  async execute(client) {
    logger.info(`✅ Bot is ready! Logged in as ${client.user.tag}`);
    
    // Set bot presence
    client.user.setPresence({
      activities: [{ 
        name: 'نظام الدعم التلقائي | Auto Support System',
        type: ActivityType.Playing 
      }],
      status: 'online',
    });

    // Register slash commands
    await registerCommands(client);

    logger.info(`📊 Serving ${client.guilds.cache.size} guilds`);
    logger.info(`👥 Total users: ${client.users.cache.size}`);
  },
};

async function registerCommands(client) {
  try {
    const commands = [];
    
    // Convert client commands to JSON format
    for (const [name, command] of client.commands) {
      commands.push(command.data.toJSON());
    }

    const rest = new REST({ version: '10' }).setToken(config.discord.token);

    logger.info(`🔄 Started refreshing ${commands.length} application (/) commands.`);

    // Register commands globally or per guild
    if (config.discord.guildId) {
      // Guild-specific (faster for testing)
      await rest.put(
        Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId),
        { body: commands },
      );
      logger.info(`✅ Successfully reloaded ${commands.length} guild application (/) commands.`);
    } else {
      // Global commands (takes up to 1 hour to propagate)
      await rest.put(
        Routes.applicationCommands(config.discord.clientId),
        { body: commands },
      );
      logger.info(`✅ Successfully reloaded ${commands.length} global application (/) commands.`);
    }
  } catch (error) {
    logger.error('❌ Error registering commands:', error);
  }
}
