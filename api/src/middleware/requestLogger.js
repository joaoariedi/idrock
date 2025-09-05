/**
 * Request Logger Middleware
 * Logs incoming requests for monitoring and debugging
 * 
 * @author Grupo idRock
 */

const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

/**
 * Request logging middleware
 * Adds request ID and logs request details
 */
function requestLogger(req, res, next) {
  // Generate unique request ID
  req.id = uuidv4();
  
  // Add request ID to response headers
  res.set('X-Request-ID', req.id);

  // Log request details
  const requestInfo = {
    requestId: req.id,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  };

  // Don't log sensitive data in production
  if (process.env.NODE_ENV === 'development') {
    requestInfo.headers = req.headers;
    requestInfo.query = req.query;
    
    // Log body for POST/PUT requests (excluding sensitive fields)
    if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
      const sanitizedBody = { ...req.body };
      // Remove potentially sensitive fields
      delete sanitizedBody.password;
      delete sanitizedBody.apiKey;
      delete sanitizedBody.token;
      requestInfo.body = sanitizedBody;
    }
  }

  logger.info('Incoming request', requestInfo);

  // Track response time
  const startTime = Date.now();

  // Override res.json to log response
  const originalJson = res.json;
  res.json = function(body) {
    const responseTime = Date.now() - startTime;
    
    logger.info('Request completed', {
      requestId: req.id,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      timestamp: new Date().toISOString()
    });

    // Call original json method
    return originalJson.call(this, body);
  };

  next();
}

module.exports = requestLogger;