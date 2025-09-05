/**
 * idRock API Server
 * Main entry point for the fraud detection API
 * 
 * @author Grupo idRock
 * @version 1.0.0
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Import routes and middleware
const riskAssessmentRoutes = require('./routes/riskAssessment');
const sessionRoutes = require('./routes/session');
const eventRoutes = require('./routes/event');
const healthRoutes = require('./routes/health');
const docsRoutes = require('./routes/docs');

const errorHandler = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const authMiddleware = require('./middleware/auth');

// Import services
const DatabaseService = require('./services/DatabaseService');
const logger = require('./utils/logger');

// Create Express application
const app = express();

// Configuration
const config = {
  port: process.env.API_PORT || 3001,
  host: process.env.API_HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000 // requests per window
  }
};

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigin,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Request logging
if (config.nodeEnv !== 'test') {
  app.use(morgan('combined', {
    stream: {
      write: message => logger.info(message.trim())
    }
  }));
}

app.use(requestLogger);

// Health check endpoint (no auth required)
app.use('/api/health', healthRoutes);

// API documentation (no auth required in development)
if (config.nodeEnv === 'development') {
  app.use('/api/docs', docsRoutes);
}

// Authentication middleware for protected routes
app.use('/api', authMiddleware);

// API routes
app.use('/api/assess-risk', riskAssessmentRoutes);
app.use('/api/session', sessionRoutes);
app.use('/api/events', eventRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'idRock Fraud Detection API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Initialize database and start server
async function startServer() {
  try {
    // Initialize database
    await DatabaseService.initialize();
    logger.info('Database initialized successfully');

    // Start server
    const server = app.listen(config.port, config.host, () => {
      logger.info(`idRock API server running on http://${config.host}:${config.port}`);
      logger.info(`Environment: ${config.nodeEnv}`);
      logger.info(`CORS origin: ${config.corsOrigin}`);
      
      if (config.nodeEnv === 'development') {
        logger.info(`API documentation available at http://${config.host}:${config.port}/api/docs`);
      }
    });

    // Graceful shutdown handling
    const gracefulShutdown = (signal) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async (err) => {
        if (err) {
          logger.error('Error during server shutdown:', err);
          process.exit(1);
        }

        try {
          await DatabaseService.close();
          logger.info('Database connection closed');
          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (dbError) {
          logger.error('Error closing database connection:', dbError);
          process.exit(1);
        }
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start server if not in test environment
if (require.main === module) {
  startServer();
}

module.exports = app;