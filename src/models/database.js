import Database from 'better-sqlite3';
import config from '../config.js';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import logger from '../utils/logger.js';

class DatabaseManager {
  constructor() {
    this.db = null;
  }

  async connect() {
    try {
      // Ensure data directory exists
      const dbDir = dirname(config.database.path);
      await mkdir(dbDir, { recursive: true });

      this.db = new Database(config.database.path);
      this.db.pragma('journal_mode = WAL');
      
      await this.createTables();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Error connecting to database:', error);
      throw error;
    }
  }

  async createTables() {
    // Support System Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS support_cases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        case_id TEXT UNIQUE NOT NULL,
        user_id TEXT NOT NULL,
        staff_id TEXT,
        channel_id TEXT,
        status TEXT DEFAULT 'open',
        category TEXT,
        priority INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        closed_at DATETIME,
        rating INTEGER,
        rating_comment TEXT
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS support_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        waiting_room_id TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        position INTEGER
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS staff_status (
        user_id TEXT PRIMARY KEY,
        status TEXT DEFAULT 'available',
        current_cases INTEGER DEFAULT 0,
        total_cases INTEGER DEFAULT 0,
        last_active DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Verification System Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS verification_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        waiting_room_id TEXT NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'waiting'
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS verification_tests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        staff_id TEXT,
        score INTEGER,
        passed BOOLEAN,
        answers TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Streamer System Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS streamers (
        user_id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        channel_url TEXT,
        status TEXT DEFAULT 'pending',
        approved_at DATETIME,
        total_videos INTEGER DEFAULT 0,
        total_hours REAL DEFAULT 0,
        performance_rating REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS streamer_content (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        streamer_id TEXT NOT NULL,
        content_type TEXT,
        url TEXT,
        duration REAL,
        views INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (streamer_id) REFERENCES streamers(user_id)
      )
    `);

    // Credit Wallet System Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS wallets (
        user_id TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        total_earned INTEGER DEFAULT 0,
        total_spent INTEGER DEFAULT 0,
        savings_mode BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES wallets(user_id)
      )
    `);

    // Performance Analytics Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS staff_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        date DATE NOT NULL,
        cases_handled INTEGER DEFAULT 0,
        avg_response_time REAL DEFAULT 0,
        voice_time REAL DEFAULT 0,
        afk_time REAL DEFAULT 0,
        performance_score REAL DEFAULT 0,
        UNIQUE(user_id, date)
      )
    `);

    // Security System Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS security_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        reason TEXT,
        moderator_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS spam_tracking (
        user_id TEXT NOT NULL,
        message_count INTEGER DEFAULT 1,
        last_message DATETIME DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY(user_id)
      )
    `);

    // Configuration Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS bot_config (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Welcome & Utility Tables
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_xp (
        user_id TEXT PRIMARY KEY,
        xp INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        messages INTEGER DEFAULT 0,
        last_xp_gain DATETIME
      )
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS user_reputation (
        user_id TEXT PRIMARY KEY,
        reputation INTEGER DEFAULT 0,
        given_count INTEGER DEFAULT 0,
        received_count INTEGER DEFAULT 0
      )
    `);

    logger.info('✅ Database tables created successfully');
  }

  // Helper methods
  prepare(sql) {
    return this.db.prepare(sql);
  }

  run(sql, params = []) {
    return this.db.prepare(sql).run(params);
  }

  get(sql, params = []) {
    return this.db.prepare(sql).get(params);
  }

  all(sql, params = []) {
    return this.db.prepare(sql).all(params);
  }

  close() {
    if (this.db) {
      this.db.close();
      logger.info('Database connection closed');
    }
  }
}

export default new DatabaseManager();
