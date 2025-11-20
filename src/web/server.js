import express from 'express';
import session from 'express-session';
import passport from 'passport';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from '../config.js';
import logger from '../utils/logger.js';
import database from '../models/database.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(join(__dirname, 'public')));

// View engine
app.set('view engine', 'ejs');
app.set('views', join(__dirname, 'views'));

// Session
app.use(session({
  secret: config.web.sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 86400000, // 24 hours
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

passport.use(new DiscordStrategy({
  clientID: config.discord.clientId,
  clientSecret: config.discord.clientSecret,
  callbackURL: `${config.web.url}/auth/callback`,
  scope: ['identify', 'guilds'],
}, (accessToken, refreshToken, profile, done) => {
  return done(null, profile);
}));

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

app.get('/auth/discord', passport.authenticate('discord'));

app.get('/auth/callback',
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
app.get('/dashboard', checkAuth, (req, res) => {
  res.render('dashboard/index', { user: req.user });
});

app.get('/dashboard/support', checkAuth, (req, res) => {
  const cases = database.all('SELECT * FROM support_cases ORDER BY created_at DESC LIMIT 50');
  res.render('dashboard/support', { user: req.user, cases });
});

app.get('/dashboard/verification', checkAuth, (req, res) => {
  const queue = database.all('SELECT * FROM verification_queue WHERE status = "waiting"');
  res.render('dashboard/verification', { user: req.user, queue });
});

app.get('/dashboard/streamers', checkAuth, (req, res) => {
  const streamers = database.all('SELECT * FROM streamers ORDER BY performance_rating DESC');
  res.render('dashboard/streamers', { user: req.user, streamers });
});

app.get('/dashboard/analytics', checkAuth, (req, res) => {
  const stats = {
    totalCases: database.get('SELECT COUNT(*) as count FROM support_cases')?.count || 0,
    activeCases: database.get('SELECT COUNT(*) as count FROM support_cases WHERE status = "open"')?.count || 0,
    totalStreamers: database.get('SELECT COUNT(*) as count FROM streamers WHERE status = "approved"')?.count || 0,
    totalUsers: database.get('SELECT COUNT(*) as count FROM wallets')?.count || 0,
  };
  res.render('dashboard/analytics', { user: req.user, stats });
});

app.get('/dashboard/security', checkAuth, (req, res) => {
  const logs = database.all('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 100');
  res.render('dashboard/security', { user: req.user, logs });
});

app.get('/dashboard/settings', checkAuth, (req, res) => {
  res.render('dashboard/settings', { user: req.user });
});

// API Routes
app.get('/api/stats', checkAuth, (req, res) => {
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
  };
  res.json(stats);
});

// Error handler
app.use((err, req, res, next) => {
  logger.error('Web server error:', err);
  res.status(500).send('حدث خطأ في الخادم');
});

// Start server
async function start() {
  try {
    // Connect to database first
    await database.connect();
    
    app.listen(config.web.port, () => {
      logger.info(`🌐 Web dashboard running on ${config.web.url}`);
    });
  } catch (error) {
    logger.error('Failed to start web server:', error);
    process.exit(1);
  }
}

start();

export default app;
