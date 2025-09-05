/**
 * Risk Assessment API Routes
 * Handles fraud detection and risk scoring requests
 * 
 * @author Grupo idRock
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const RiskAssessmentService = require('../services/RiskAssessmentService');
const DatabaseService = require('../services/DatabaseService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/assess-risk
 * Perform risk assessment for user activity
 */
router.post('/', [
  body('sessionId').notEmpty().withMessage('Session ID is required'),
  body('event').notEmpty().withMessage('Event type is required'),
  body('deviceInfo').optional().isObject(),
  body('behavioralInfo').optional().isObject(),
  body('fingerprint').optional().isObject(),
  body('metadata').optional().isObject()
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors.array(),
        timestamp: new Date().toISOString()
      });
    }

    // Extract client IP address
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || 
                     req.headers['x-real-ip'] || 
                     req.connection.remoteAddress || 
                     req.socket.remoteAddress ||
                     '127.0.0.1';

    // Prepare assessment data
    const assessmentData = {
      ...req.body,
      ipAddress: ipAddress.replace('::ffff:', ''), // Remove IPv6 prefix
      userAgent: req.headers['user-agent'] || 'Unknown',
      headers: req.headers
    };

    logger.info(`Risk assessment request: ${assessmentData.event} for session ${assessmentData.sessionId}`);

    // Perform risk assessment
    const assessment = await RiskAssessmentService.assessRisk(assessmentData);

    // Store session data if new
    await DatabaseService.createSession({
      sessionId: assessmentData.sessionId,
      userAgent: assessmentData.userAgent,
      ipAddress: assessmentData.ipAddress,
      referrer: req.headers.referer || null,
      initialUrl: assessmentData.behavioralInfo?.currentUrl || null
    });

    // Store device fingerprint if provided
    if (assessmentData.fingerprint?.visitorId) {
      await DatabaseService.storeDeviceFingerprint({
        fingerprintId: assessmentData.fingerprint.visitorId,
        sessionId: assessmentData.sessionId,
        confidence: assessmentData.fingerprint.confidence,
        components: assessmentData.fingerprint.components,
        userAgent: assessmentData.userAgent,
        screenResolution: assessmentData.deviceInfo?.screenResolution,
        timezone: assessmentData.deviceInfo?.timezone,
        language: assessmentData.deviceInfo?.language,
        platform: assessmentData.deviceInfo?.platform
      });
    }

    res.json({
      success: true,
      data: assessment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Risk assessment error:', error);
    res.status(500).json({
      error: 'Risk assessment failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/assess-risk/history/:sessionId
 * Get risk assessment history for a session
 */
router.get('/history/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const history = await DatabaseService.getAccessHistory(sessionId, limit);

    res.json({
      success: true,
      data: {
        sessionId,
        history,
        count: history.length
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get risk assessment history:', error);
    res.status(500).json({
      error: 'Failed to retrieve history',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/assess-risk/stats
 * Get risk assessment statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await DatabaseService.getStatistics();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error('Failed to get statistics:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;