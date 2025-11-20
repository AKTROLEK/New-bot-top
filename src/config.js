import dotenv from 'dotenv';
dotenv.config();

export default {
  // Discord Configuration
  discord: {
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    clientSecret: process.env.DISCORD_CLIENT_SECRET,
    guildId: process.env.DISCORD_GUILD_ID,
  },

  // Web Dashboard Configuration
  web: {
    port: process.env.WEB_PORT || 3000,
    url: process.env.WEB_URL || 'http://localhost:3000',
    sessionSecret: process.env.SESSION_SECRET || 'change-this-secret',
  },

  // Database Configuration
  database: {
    path: process.env.DATABASE_PATH || './data/bot.db',
  },

  // Bot Configuration
  bot: {
    prefix: process.env.BOT_PREFIX || '!',
    language: process.env.BOT_LANGUAGE || 'ar',
    timezone: process.env.BOT_TIMEZONE || 'Asia/Riyadh',
  },

  // Security Configuration
  security: {
    enableAntiSpam: process.env.ENABLE_ANTI_SPAM === 'true',
    enableAntiRaid: process.env.ENABLE_ANTI_RAID === 'true',
    enableAntiLink: process.env.ENABLE_ANTI_LINK === 'true',
    spamThreshold: 5, // messages per 5 seconds
    mentionThreshold: 5, // max mentions per message
    linkWhitelist: [], // whitelisted domains
  },

  // AI Configuration
  ai: {
    enabled: process.env.AI_ENABLED === 'true',
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/bot.log',
  },

  // Support System Configuration
  support: {
    waitingRooms: [], // To be configured from dashboard
    supportRooms: [], // To be configured from dashboard
    staffRoles: [], // To be configured from dashboard
    autoCloseTimeout: 30, // minutes
    cooldownBetweenPulls: 5, // seconds
    maxCasesPerStaff: 3,
  },

  // Verification System Configuration
  verification: {
    waitingRooms: [], // To be configured from dashboard
    verificationRooms: [], // To be configured from dashboard
    staffRoles: [], // To be configured from dashboard
    testQuestions: [], // To be configured from dashboard
    passingScore: 70, // percentage
    verifiedRole: null, // To be configured from dashboard
  },

  // Streamer System Configuration
  streamer: {
    platforms: ['YouTube', 'TikTok', 'Twitch', 'Kick', 'Instagram', 'Facebook'],
    weeklyVideoRequirement: 3,
    weeklyStreamingHours: 10,
    streamerRole: null, // To be configured from dashboard
    creditRewardPerVideo: 100,
    creditRewardPerHour: 50,
  },

  // Credit Wallet Configuration
  wallet: {
    initialBalance: 0,
    maxBalance: 1000000,
    weeklyMissions: [],
    seasonalChallenges: [],
  },

  // Performance Analytics Configuration
  analytics: {
    trackResponseTime: true,
    trackVoiceActivity: true,
    trackAFKTime: true,
    dailyReportTime: '09:00', // 24-hour format
    monthlyReportDay: 1, // day of month
  },
};
