/**
 * Database Service
 * SQLite database management for idRock fraud detection system
 * 
 * @author Grupo idRock
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'data', 'idrock.db');
    this.isInitialized = false;
  }

  /**
   * Initialize database connection and create tables
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        logger.info(`Created data directory: ${dataDir}`);
      }

      // Create database connection
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          logger.error('Database connection failed:', err.message);
          throw err;
        }
        logger.info(`Connected to SQLite database: ${this.dbPath}`);
      });

      // Enable foreign keys
      await this.run('PRAGMA foreign_keys = ON');
      
      // Create tables
      await this.createTables();
      
      this.isInitialized = true;
      logger.info('Database initialization completed');

    } catch (error) {
      logger.error('Database initialization failed:', error);
      throw error;
    }
  }

  /**
   * Create all required database tables
   * @private
   * @returns {Promise<void>}
   */
  async createTables() {
    const tables = [
      // Sessions table
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        user_agent TEXT,
        ip_address TEXT,
        referrer TEXT,
        initial_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Risk assessments table
      `CREATE TABLE IF NOT EXISTS risk_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        risk_score INTEGER NOT NULL,
        risk_level TEXT NOT NULL,
        recommended_action TEXT,
        ip_reputation_score INTEGER,
        device_fingerprint_score INTEGER,
        behavioral_score INTEGER,
        geolocation_score INTEGER,
        temporal_score INTEGER,
        reasons TEXT, -- JSON array of reasons
        metadata TEXT, -- JSON metadata
        processing_time INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )`,

      // Device fingerprints table
      `CREATE TABLE IF NOT EXISTS device_fingerprints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fingerprint_id TEXT UNIQUE NOT NULL,
        session_id TEXT NOT NULL,
        confidence REAL,
        components TEXT, -- JSON fingerprint components
        user_agent TEXT,
        screen_resolution TEXT,
        timezone TEXT,
        language TEXT,
        platform TEXT,
        first_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_seen DATETIME DEFAULT CURRENT_TIMESTAMP,
        seen_count INTEGER DEFAULT 1,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )`,

      // IP addresses table
      `CREATE TABLE IF NOT EXISTS ip_addresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ip_address TEXT UNIQUE NOT NULL,
        country TEXT,
        region TEXT,
        city TEXT,
        latitude REAL,
        longitude REAL,
        timezone TEXT,
        isp TEXT,
        organization TEXT,
        asn TEXT,
        proxy_type TEXT,
        is_vpn BOOLEAN DEFAULT 0,
        is_proxy BOOLEAN DEFAULT 0,
        risk_level TEXT,
        reputation_score INTEGER,
        last_checked DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,

      // Events table for behavioral tracking
      `CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_data TEXT, -- JSON event data
        url TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )`,

      // Location history table
      `CREATE TABLE IF NOT EXISTS location_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        country TEXT,
        region TEXT,
        city TEXT,
        latitude REAL,
        longitude REAL,
        timezone TEXT,
        recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions(session_id)
      )`,

      // System settings table
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        description TEXT,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_sessions_session_id ON sessions(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_risk_assessments_session_id ON risk_assessments(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_risk_assessments_created_at ON risk_assessments(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_device_fingerprints_fingerprint_id ON device_fingerprints(fingerprint_id)',
      'CREATE INDEX IF NOT EXISTS idx_ip_addresses_ip ON ip_addresses(ip_address)',
      'CREATE INDEX IF NOT EXISTS idx_events_session_id ON events(session_id)',
      'CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)',
      'CREATE INDEX IF NOT EXISTS idx_location_history_session_id ON location_history(session_id)'
    ];

    // Execute table creation
    for (const tableSQL of tables) {
      await this.run(tableSQL);
    }

    // Execute index creation
    for (const indexSQL of indexes) {
      await this.run(indexSQL);
    }

    // Insert default settings
    await this.insertDefaultSettings();
  }

  /**
   * Insert default system settings
   * @private
   * @returns {Promise<void>}
   */
  async insertDefaultSettings() {
    const defaultSettings = [
      {
        key: 'risk_threshold_low',
        value: '30',
        description: 'Maximum score for LOW risk level'
      },
      {
        key: 'risk_threshold_high',
        value: '70',
        description: 'Minimum score for HIGH risk level'
      },
      {
        key: 'cache_duration_hours',
        value: '24',
        description: 'Hours to cache IP reputation results'
      },
      {
        key: 'max_session_duration_hours',
        value: '24',
        description: 'Maximum session duration in hours'
      }
    ];

    for (const setting of defaultSettings) {
      await this.run(
        `INSERT OR IGNORE INTO settings (key, value, description) VALUES (?, ?, ?)`,
        [setting.key, setting.value, setting.description]
      );
    }
  }

  /**
   * Create or update session
   * @param {Object} sessionData - Session data
   * @returns {Promise<string>} Session ID
   */
  async createSession(sessionData) {
    try {
      await this.run(
        `INSERT OR REPLACE INTO sessions 
         (session_id, user_agent, ip_address, referrer, initial_url, updated_at) 
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          sessionData.sessionId,
          sessionData.userAgent,
          sessionData.ipAddress,
          sessionData.referrer,
          sessionData.initialUrl
        ]
      );

      logger.debug(`Session created: ${sessionData.sessionId}`);
      return sessionData.sessionId;
    } catch (error) {
      logger.error('Failed to create session:', error);
      throw error;
    }
  }

  /**
   * Store risk assessment result
   * @param {Object} assessment - Risk assessment data
   * @returns {Promise<number>} Assessment ID
   */
  async storeRiskAssessment(assessment) {
    try {
      const result = await this.run(
        `INSERT INTO risk_assessments 
         (session_id, event_type, risk_score, risk_level, recommended_action,
          ip_reputation_score, device_fingerprint_score, behavioral_score,
          geolocation_score, temporal_score, reasons, metadata, processing_time)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          assessment.sessionId,
          assessment.event,
          assessment.riskScore,
          assessment.riskLevel,
          assessment.recommendedAction,
          assessment.riskFactors?.ipReputation?.score || 0,
          assessment.riskFactors?.deviceFingerprint?.score || 0,
          assessment.riskFactors?.behavioral?.score || 0,
          assessment.riskFactors?.geolocation?.score || 0,
          assessment.riskFactors?.temporal?.score || 0,
          JSON.stringify(assessment.reasons || []),
          JSON.stringify(assessment.metadata || {}),
          assessment.metadata?.processingTime || 0
        ]
      );

      logger.debug(`Risk assessment stored: ${assessment.sessionId}`);
      return result.lastID;
    } catch (error) {
      logger.error('Failed to store risk assessment:', error);
      throw error;
    }
  }

  /**
   * Store or update device fingerprint
   * @param {Object} fingerprintData - Device fingerprint data
   * @returns {Promise<void>}
   */
  async storeDeviceFingerprint(fingerprintData) {
    try {
      // Check if fingerprint already exists
      const existing = await this.get(
        'SELECT * FROM device_fingerprints WHERE fingerprint_id = ?',
        [fingerprintData.fingerprintId]
      );

      if (existing) {
        // Update existing fingerprint
        await this.run(
          `UPDATE device_fingerprints 
           SET last_seen = CURRENT_TIMESTAMP, seen_count = seen_count + 1
           WHERE fingerprint_id = ?`,
          [fingerprintData.fingerprintId]
        );
      } else {
        // Insert new fingerprint
        await this.run(
          `INSERT INTO device_fingerprints 
           (fingerprint_id, session_id, confidence, components, user_agent,
            screen_resolution, timezone, language, platform)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            fingerprintData.fingerprintId,
            fingerprintData.sessionId,
            fingerprintData.confidence,
            JSON.stringify(fingerprintData.components || {}),
            fingerprintData.userAgent,
            fingerprintData.screenResolution,
            fingerprintData.timezone,
            fingerprintData.language,
            fingerprintData.platform
          ]
        );
      }

      logger.debug(`Device fingerprint stored: ${fingerprintData.fingerprintId}`);
    } catch (error) {
      logger.error('Failed to store device fingerprint:', error);
      throw error;
    }
  }

  /**
   * Store IP address information
   * @param {Object} ipData - IP address data
   * @returns {Promise<void>}
   */
  async storeIPAddress(ipData) {
    try {
      await this.run(
        `INSERT OR REPLACE INTO ip_addresses 
         (ip_address, country, region, city, latitude, longitude, timezone,
          isp, organization, asn, proxy_type, is_vpn, is_proxy, risk_level,
          reputation_score, last_checked)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [
          ipData.ip,
          ipData.country,
          ipData.region,
          ipData.city,
          ipData.latitude,
          ipData.longitude,
          ipData.timezone,
          ipData.provider,
          ipData.organisation,
          ipData.asn,
          ipData.type,
          ipData.vpn === 'yes' ? 1 : 0,
          ipData.proxy === 'yes' ? 1 : 0,
          ipData.risk,
          this.calculateReputationScore(ipData),
        ]
      );

      logger.debug(`IP address stored: ${ipData.ip}`);
    } catch (error) {
      logger.error('Failed to store IP address:', error);
      throw error;
    }
  }

  /**
   * Track user event
   * @param {Object} eventData - Event data
   * @returns {Promise<void>}
   */
  async trackEvent(eventData) {
    try {
      await this.run(
        'INSERT INTO events (session_id, event_type, event_data, url) VALUES (?, ?, ?, ?)',
        [
          eventData.sessionId,
          eventData.type,
          JSON.stringify(eventData.data || {}),
          eventData.url
        ]
      );

      logger.debug(`Event tracked: ${eventData.type} for ${eventData.sessionId}`);
    } catch (error) {
      logger.error('Failed to track event:', error);
      throw error;
    }
  }

  /**
   * Find device by fingerprint
   * @param {string} fingerprintId - Device fingerprint ID
   * @returns {Promise<Object|null>} Device data or null
   */
  async findDeviceByFingerprint(fingerprintId) {
    try {
      return await this.get(
        'SELECT * FROM device_fingerprints WHERE fingerprint_id = ?',
        [fingerprintId]
      );
    } catch (error) {
      logger.error('Failed to find device by fingerprint:', error);
      return null;
    }
  }

  /**
   * Get behavior history for session
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of records
   * @returns {Promise<Array>} Behavior history
   */
  async getBehaviorHistory(sessionId, limit = 100) {
    try {
      return await this.all(
        `SELECT * FROM events 
         WHERE session_id = ? 
         ORDER BY timestamp DESC 
         LIMIT ?`,
        [sessionId, limit]
      );
    } catch (error) {
      logger.error('Failed to get behavior history:', error);
      return [];
    }
  }

  /**
   * Get location history for session
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of records
   * @returns {Promise<Array>} Location history
   */
  async getLocationHistory(sessionId, limit = 10) {
    try {
      return await this.all(
        `SELECT * FROM location_history 
         WHERE session_id = ? 
         ORDER BY recorded_at DESC 
         LIMIT ?`,
        [sessionId, limit]
      );
    } catch (error) {
      logger.error('Failed to get location history:', error);
      return [];
    }
  }

  /**
   * Get access history for session
   * @param {string} sessionId - Session ID
   * @param {number} limit - Maximum number of records
   * @returns {Promise<Array>} Access history
   */
  async getAccessHistory(sessionId, limit = 50) {
    try {
      return await this.all(
        `SELECT ra.created_at, ra.event_type, ra.risk_score, ra.risk_level
         FROM risk_assessments ra
         WHERE ra.session_id = ?
         ORDER BY ra.created_at DESC
         LIMIT ?`,
        [sessionId, limit]
      );
    } catch (error) {
      logger.error('Failed to get access history:', error);
      return [];
    }
  }

  /**
   * Calculate reputation score from IP data
   * @private
   * @param {Object} ipData - IP data
   * @returns {number} Reputation score
   */
  calculateReputationScore(ipData) {
    let score = 50; // Base score

    if (ipData.risk === 'low') score = 20;
    else if (ipData.risk === 'medium') score = 50;
    else if (ipData.risk === 'high') score = 80;

    if (ipData.proxy === 'yes') score += 20;
    if (ipData.vpn === 'yes') score += 15;

    return Math.min(score, 100);
  }

  /**
   * Execute SQL query with parameters
   * @private
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object>} Query result
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ lastID: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * Get single row from query
   * @private
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Object|null>} Single row or null
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * Get all rows from query
   * @private
   * @param {string} sql - SQL query
   * @param {Array} params - Query parameters
   * @returns {Promise<Array>} Array of rows
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Get database statistics
   * @returns {Promise<Object>} Database statistics
   */
  async getStatistics() {
    try {
      const stats = {};
      
      // Count records in each table
      const tables = ['sessions', 'risk_assessments', 'device_fingerprints', 'ip_addresses', 'events'];
      
      for (const table of tables) {
        const result = await this.get(`SELECT COUNT(*) as count FROM ${table}`);
        stats[table] = result.count;
      }

      // Database size
      const dbStats = fs.statSync(this.dbPath);
      stats.database_size_bytes = dbStats.size;
      stats.database_path = this.dbPath;
      stats.last_modified = dbStats.mtime;

      return stats;
    } catch (error) {
      logger.error('Failed to get database statistics:', error);
      return { error: error.message };
    }
  }

  /**
   * Close database connection
   * @returns {Promise<void>}
   */
  async close() {
    if (this.db) {
      return new Promise((resolve, reject) => {
        this.db.close((err) => {
          if (err) {
            logger.error('Database close error:', err);
            reject(err);
          } else {
            logger.info('Database connection closed');
            this.isInitialized = false;
            resolve();
          }
        });
      });
    }
  }

  /**
   * Check if database is initialized
   * @returns {boolean} Initialization status
   */
  isReady() {
    return this.isInitialized && this.db !== null;
  }
}

module.exports = new DatabaseService();