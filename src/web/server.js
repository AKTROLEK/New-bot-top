import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import rateLimit from 'express-rate-limit';
import config from '../config.js';
import logger from '../utils/logger.js';
import database from '../models/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Store bot client reference
let botClient = null;

const app = express();

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'تم تجاوز عدد الطلبات المسموح بها، يرجى المحاولة لاحقاً',
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Limit auth endpoints more strictly
  message: 'تم تجاوز عدد محاولات تسجيل الدخول، يرجى المحاولة بعد 15 دقيقة',
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));
app.use(limiter); // Apply rate limiting globally

// View engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Session
const isProduction = process.env.NODE_ENV === 'production';
app.use(session({
  secret: config.web.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000, // 24 hours
    secure: isProduction, // Require HTTPS in production
    httpOnly: true, // Prevent XSS attacks
    sameSite: 'lax', // CSRF protection
  },
}));

// Passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // In a real implementation, fetch user from database
  done(null, { id });
});

// Only setup Discord OAuth if credentials are provided
if (config.discord.clientId && config.discord.clientSecret) {
  passport.use(new DiscordStrategy({
    clientID: config.discord.clientId,
    clientSecret: config.discord.clientSecret,
    callbackURL: `${config.web.url}/auth/callback`,
    scope: ['identify', 'guilds'],
  }, (accessToken, refreshToken, profile, done) => {
    return done(null, profile);
  }));
} else {
  logger.warn('⚠️ Discord OAuth not configured - authentication will not work');
}

app.use(passport.initialize());
app.use(passport.session());

// Auth middleware
function checkAuth(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
}

// Routes
app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});

app.get('/auth/discord', authLimiter, passport.authenticate('discord'));

app.get('/auth/callback', authLimiter,
  passport.authenticate('discord', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);

app.get('/auth/logout', (req, res) => {
  req.logout(() => {
    res.redirect('/');
  });
});

// Dashboard routes
app.get('/dashboard', checkAuth, limiter, (req, res) => {
  res.render('dashboard/index', { user: req.user });
});

app.get('/dashboard/support', checkAuth, limiter, (req, res) => {
  const cases = database.all('SELECT * FROM support_cases ORDER BY created_at DESC LIMIT 50') || [];
  res.render('dashboard/support', { user: req.user, cases });
});

app.get('/dashboard/verification', checkAuth, limiter, (req, res) => {
  const queue = database.all('SELECT * FROM verification_queue WHERE status = "waiting"') || [];
  res.render('dashboard/verification', { user: req.user, queue });
});

app.get('/dashboard/streamers', checkAuth, limiter, (req, res) => {
  const streamers = database.all('SELECT * FROM streamers ORDER BY performance_rating DESC') || [];
  res.render('dashboard/streamers', { user: req.user, streamers });
});

app.get('/dashboard/analytics', checkAuth, limiter, (req, res) => {
  const stats = {
    totalCases: database.get('SELECT COUNT(*) as count FROM support_cases')?.count || 0,
    activeCases: database.get('SELECT COUNT(*) as count FROM support_cases WHERE status = "open"')?.count || 0,
    totalStreamers: database.get('SELECT COUNT(*) as count FROM streamers WHERE status = "approved"')?.count || 0,
    totalUsers: database.get('SELECT COUNT(*) as count FROM wallets')?.count || 0,
  };
  res.render('dashboard/analytics', { user: req.user, stats });
});

app.get('/dashboard/security', checkAuth, limiter, (req, res) => {
  const logs = database.all('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 100') || [];
  res.render('dashboard/security', { user: req.user, logs });
});

app.get('/dashboard/settings', checkAuth, limiter, (req, res) => {
  res.render('dashboard/settings', { user: req.user });
});

// API Routes
app.get('/api/stats', checkAuth, limiter, (req, res) => {
  try {
    const stats = {
      support: {
        total: database.get('SELECT COUNT(*) as count FROM support_cases')?.count || 0,
        open: database.get('SELECT COUNT(*) as count FROM support_cases WHERE status = "open"')?.count || 0,
        closed: database.get('SELECT COUNT(*) as count FROM support_cases WHERE status = "closed"')?.count || 0,
      },
      streamers: {
        total: database.get('SELECT COUNT(*) as count FROM streamers')?.count || 0,
        approved: database.get('SELECT COUNT(*) as count FROM streamers WHERE status = "approved"')?.count || 0,
        pending: database.get('SELECT COUNT(*) as count FROM streamers WHERE status = "pending"')?.count || 0,
      },
      wallet: {
        totalUsers: database.get('SELECT COUNT(*) as count FROM wallets')?.count || 0,
        totalBalance: database.get('SELECT SUM(balance) as total FROM wallets')?.total || 0,
      },
      bot: botClient ? {
        status: botClient.ws.status === 0 ? 'online' : 'offline',
        uptime: botClient.uptime ? Math.floor(botClient.uptime / 1000) : 0,
        guilds: botClient.guilds.cache.size,
        users: botClient.users.cache.size,
        ping: botClient.ws.ping,
      } : null,
    };
    res.json(stats);
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// New API endpoint for bot information
app.get('/api/bot/info', checkAuth, limiter, (req, res) => {
  try {
    if (!botClient) {
      return res.status(503).json({ error: 'Bot is not connected' });
    }

    const guild = botClient.guilds.cache.get(config.discord.guildId);
    
    res.json({
      status: botClient.ws.status === 0 ? 'online' : 'offline',
      uptime: botClient.uptime ? Math.floor(botClient.uptime / 1000) : 0,
      guilds: botClient.guilds.cache.size,
      users: botClient.users.cache.size,
      ping: botClient.ws.ping,
      username: botClient.user?.username,
      avatar: botClient.user?.displayAvatarURL(),
      guild: guild ? {
        name: guild.name,
        memberCount: guild.memberCount,
        icon: guild.iconURL(),
      } : null,
    });
  } catch (error) {
    logger.error('Error fetching bot info:', error);
    res.status(500).json({ error: 'Failed to fetch bot information' });
  }
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Web server error:', err);
  res.status(500).send('حدث خطأ في الخادم');
});

// Start server
async function start(client = null) {
  try {
    // Store bot client reference
    botClient = client;
    
    // If running standalone, connect to database
    if (!client) {
      logger.warn('⚠️ Starting web server in standalone mode (without bot connection)');
      await database.connect();
    }
    
    app.listen(config.web.port, () => {
      logger.info(`🌐 Web dashboard running on ${config.web.url}`);
    });
    
    return app;
  } catch (error) {
    logger.error('Failed to start web server:', error);
    throw error;
  }
}

// If running directly (not imported), start the server
if (import.meta.url === `file://${process.argv[1]}`) {
  start().catch(error => {
    logger.error('Failed to start standalone web server:', error);
    process.exit(1);
  });
}

// Export the start function and app
export { start, botClient };
export default app;
