import logger from '../utils/logger.js';
import database from '../models/database.js';

export default {
  name: 'messageCreate',
  async execute(message, client) {
    // Ignore bot messages
    if (message.author.bot) return;

    // Check for security threats
    await checkSecurity(message);

    // Track XP and leveling
    await trackXP(message);

    // AI Auto-responder (if enabled and in support channels)
    await handleAutoResponse(message);
  },
};

async function checkSecurity(message) {
  try {
    // Anti-spam check
    const spamCheck = database.get(
      'SELECT * FROM spam_tracking WHERE user_id = ?',
      [message.author.id]
    );

    if (spamCheck) {
      const timeDiff = Date.now() - new Date(spamCheck.last_message).getTime();
      
      if (timeDiff < 5000 && spamCheck.message_count >= 5) {
        // Spam detected
        await message.delete();
        logger.warn(`Spam detected from ${message.author.tag}`);
        return;
      }

      if (timeDiff < 5000) {
        database.run(
          'UPDATE spam_tracking SET message_count = message_count + 1, last_message = CURRENT_TIMESTAMP WHERE user_id = ?',
          [message.author.id]
        );
      } else {
        database.run(
          'UPDATE spam_tracking SET message_count = 1, last_message = CURRENT_TIMESTAMP WHERE user_id = ?',
          [message.author.id]
        );
      }
    } else {
      database.run(
        'INSERT INTO spam_tracking (user_id, message_count) VALUES (?, 1)',
        [message.author.id]
      );
    }

    // Anti-link check (simplified)
    if (message.content.includes('http://') || message.content.includes('https://')) {
      const hasPermission = message.member.permissions.has('Administrator');
      if (!hasPermission) {
        await message.delete();
        logger.warn(`Unauthorized link from ${message.author.tag}`);
      }
    }

    // Anti-mass mention check
    if (message.mentions.users.size > 5) {
      await message.delete();
      logger.warn(`Mass mention from ${message.author.tag}`);
    }

  } catch (error) {
    logger.error('Error in security check:', error);
  }
}

async function trackXP(message) {
  try {
    const userXP = database.get(
      'SELECT * FROM user_xp WHERE user_id = ?',
      [message.author.id]
    );

    const now = Date.now();
    const cooldown = 60000; // 1 minute cooldown between XP gains

    if (userXP) {
      const lastGain = userXP.last_xp_gain ? new Date(userXP.last_xp_gain).getTime() : 0;
      
      if (now - lastGain > cooldown) {
        const xpGain = Math.floor(Math.random() * 10) + 15; // 15-25 XP
        const newXP = userXP.xp + xpGain;
        const newLevel = Math.floor(Math.sqrt(newXP / 100));

        database.run(
          'UPDATE user_xp SET xp = ?, level = ?, messages = messages + 1, last_xp_gain = CURRENT_TIMESTAMP WHERE user_id = ?',
          [newXP, newLevel, message.author.id]
        );

        // Level up notification
        if (newLevel > userXP.level) {
          await message.channel.send(`🎉 تهانينا ${message.author}! وصلت إلى المستوى **${newLevel}**!`);
        }
      }
    } else {
      database.run(
        'INSERT INTO user_xp (user_id, xp, level, messages, last_xp_gain) VALUES (?, 15, 1, 1, CURRENT_TIMESTAMP)',
        [message.author.id]
      );
    }
  } catch (error) {
    logger.error('Error tracking XP:', error);
  }
}

async function handleAutoResponse(message) {
  // Placeholder for AI auto-responder
  // This would integrate with OpenAI or other AI services
  // For now, just log the message for future implementation
  logger.debug(`Message in ${message.channel.name}: ${message.content.substring(0, 50)}`);
}
