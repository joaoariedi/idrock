/**
 * Health Check Routes
 * System health and status endpoints
 * 
 * @author Grupo idRock
 */

const express = require('express');
const DatabaseService = require('../services/DatabaseService');
const ProxyCheckService = require('../services/ProxyCheckService');

const router = express.Router();

/**
 * GET /api/health
 * Basic health check
 */
router.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'idRock Fraud Detection API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

/**
 * GET /api/health/detailed
 * Detailed health check including dependencies
 */
router.get('/detailed', async (req, res) => {
  const health = {
    status: 'healthy',
    service: 'idRock Fraud Detection API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    components: {}
  };

  try {
    // Check database
    health.components.database = {
      status: DatabaseService.isReady() ? 'healthy' : 'unhealthy',
      details: DatabaseService.isReady() ? 'Connected' : 'Not connected'
    };

    // Check ProxyCheck service
    try {
      const proxyCheckStatus = ProxyCheckService.getStatus();
      health.components.proxycheck = {
        status: proxyCheckStatus.apiKey ? 'healthy' : 'degraded',
        details: proxyCheckStatus.apiKey ? 'API key configured' : 'No API key configured',
        cacheSize: proxyCheckStatus.cacheSize
      };
    } catch (error) {
      health.components.proxycheck = {
        status: 'unhealthy',
        details: error.message
      };
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    health.components.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      details: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(memUsage.external / 1024 / 1024) + ' MB'
      }
    };

    // Overall status
    const componentStatuses = Object.values(health.components).map(c => c.status);
    if (componentStatuses.includes('unhealthy')) {
      health.status = 'unhealthy';
    } else if (componentStatuses.includes('degraded') || componentStatuses.includes('warning')) {
      health.status = 'degraded';
    }

    res.json(health);

  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      service: 'idRock Fraud Detection API',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;