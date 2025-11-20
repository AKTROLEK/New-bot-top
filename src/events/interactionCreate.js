import logger from '../utils/logger.js';
import i18n from '../utils/i18n.js';

export default {
  name: 'interactionCreate',
  async execute(interaction, client) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      await handleCommand(interaction, client);
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
      await handleButton(interaction, client);
    }
    
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      await handleSelectMenu(interaction, client);
    }
    
    // Handle modal submissions
    else if (interaction.isModalSubmit()) {
      await handleModal(interaction, client);
    }
  },
};

async function handleCommand(interaction, client) {
  const command = client.commands.get(interaction.commandName);

  if (!command) {
    logger.warn(`Command not found: ${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
    logger.info(`Command executed: ${interaction.commandName} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    
    const errorMessage = i18n.t('general.error');
    
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({ content: errorMessage, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMessage, ephemeral: true });
    }
  }
}

async function handleButton(interaction, client) {
  const [action, ...params] = interaction.customId.split(':');
  
  try {
    // Import button handler dynamically
    const handler = await import(`../handlers/buttons/${action}.js`);
    await handler.default(interaction, params);
    logger.info(`Button handled: ${action} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error(`Error handling button ${action}:`, error);
    
    const errorMessage = i18n.t('general.error');
    await interaction.reply({ content: errorMessage, ephemeral: true });
  }
}

async function handleSelectMenu(interaction, client) {
  const [action, ...params] = interaction.customId.split(':');
  
  try {
    // Import select menu handler dynamically
    const handler = await import(`../handlers/selectMenus/${action}.js`);
    await handler.default(interaction, params);
    logger.info(`Select menu handled: ${action} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error(`Error handling select menu ${action}:`, error);
    
    const errorMessage = i18n.t('general.error');
    await interaction.reply({ content: errorMessage, ephemeral: true });
  }
}

async function handleModal(interaction, client) {
  const [action, ...params] = interaction.customId.split(':');
  
  try {
    // Import modal handler dynamically
    const handler = await import(`../handlers/modals/${action}.js`);
    await handler.default(interaction, params);
    logger.info(`Modal handled: ${action} by ${interaction.user.tag}`);
  } catch (error) {
    logger.error(`Error handling modal ${action}:`, error);
    
    const errorMessage = i18n.t('general.error');
    await interaction.reply({ content: errorMessage, ephemeral: true });
  }
}
