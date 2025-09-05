/**
 * Session Management Routes
 * Handles session initialization and tracking
 * 
 * @author Grupo idRock
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/DatabaseService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/session/initialize
 * Initialize a new session
 */
router.post('/initialize', [
  body('sessionId').notEmpty().withMessage('Session ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     '127.0.0.1';

    const sessionData = {
      sessionId: req.body.sessionId,
      userAgent: req.headers['user-agent'] || 'Unknown',
      ipAddress: ipAddress.replace('::ffff:', ''),
      referrer: req.body.referrer || req.headers.referer || null,
      initialUrl: req.body.url || null
    };

    await DatabaseService.createSession(sessionData);

    logger.info(`Session initialized: ${sessionData.sessionId}`);

    res.json({
      success: true,
      data: {
        sessionId: sessionData.sessionId,
        timestamp: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Session initialization failed:', error);
    res.status(500).json({
      error: 'Session initialization failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;