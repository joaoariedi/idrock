/**
 * Authentication Middleware
 * Handles API key validation and basic security
 * 
 * @author Grupo idRock
 */

const logger = require('../utils/logger');

/**
 * API Key Authentication Middleware
 * For production, this would be more robust with proper JWT tokens
 */
function authenticateAPIKey(req, res, next) {
  // Skip authentication for development/demo purposes
  if (process.env.NODE_ENV === 'development') {
    return next();
  }

  const authHeader = req.headers.authorization;
  const apiKey = authHeader && authHeader.startsWith('Bearer ') 
    ? authHeader.substring(7) 
    : null;

  // For demo purposes, accept any non-empty API key
  // In production, this would validate against a database or service
  if (!apiKey) {
    logger.warn(`Unauthorized API request from ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'API key required',
      timestamp: new Date().toISOString()
    });
  }

  // Simple validation for demo - in production use proper validation
  if (apiKey.length < 10) {
    logger.warn(`Invalid API key attempt from ${req.ip}`);
    return res.status(401).json({
      error: 'Unauthorized', 
      message: 'Invalid API key',
      timestamp: new Date().toISOString()
    });
  }

  // Add API key info to request for logging
  req.apiKey = apiKey;
  req.authenticated = true;

  next();
}

module.exports = authenticateAPIKey;