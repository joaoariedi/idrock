/**
 * Event Tracking Routes
 * Handles user behavior event tracking
 * 
 * @author Grupo idRock
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const DatabaseService = require('../services/DatabaseService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/events/track
 * Track user behavior event
 */
router.post('/track', [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('type').notEmpty().withMessage('Event type is required'),
  body('data').optional().isObject()
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

    const eventData = {
      sessionId: req.body.sessionId,
      type: req.body.type,
      data: req.body.data || {},
      url: req.body.url || req.headers.referer || null
    };

    await DatabaseService.trackEvent(eventData);

    res.json({
      success: true,
      message: 'Event tracked successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Event tracking failed:', error);
    res.status(500).json({
      error: 'Event tracking failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;