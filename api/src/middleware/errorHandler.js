/**
 * Global Error Handler Middleware
 * Centralized error handling for the API
 * 
 * @author Grupo idRock
 */

const logger = require('../utils/logger');

/**
 * Global error handling middleware
 * Must be the last middleware in the chain
 */
function errorHandler(err, req, res, next) {
  logger.error('API Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Default error response
  let statusCode = 500;
  let errorResponse = {
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorResponse.error = 'Validation Error';
    errorResponse.message = err.message;
  } else if (err.name === 'UnauthorizedError') {
    statusCode = 401;
    errorResponse.error = 'Unauthorized';
    errorResponse.message = 'Authentication required';
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
    errorResponse.error = 'Forbidden';
    errorResponse.message = 'Access denied';
  } else if (err.status) {
    statusCode = err.status;
    errorResponse.error = err.name || 'Error';
    errorResponse.message = err.message;
  }

  // Don't expose internal errors in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    errorResponse.message = 'Internal server error';
  } else if (process.env.NODE_ENV === 'development') {
    // Include stack trace in development
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;