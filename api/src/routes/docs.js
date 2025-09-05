/**
 * API Documentation Routes
 * Swagger/OpenAPI documentation
 * 
 * @author Grupo idRock
 */

const express = require('express');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const router = express.Router();

// Swagger configuration
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'idRock Fraud Detection API',
      version: '1.0.0',
      description: 'API for fraud detection and risk assessment',
      contact: {
        name: 'Grupo idRock',
        email: 'support@idrock.example.com'
      }
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:3001',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js'], // Path to the API files
};

const specs = swaggerJsdoc(options);

// Serve swagger documentation
router.use('/', swaggerUi.serve);
router.get('/', swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'idRock API Documentation'
}));

module.exports = router;