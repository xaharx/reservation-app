const swaggerJsdoc = require('swagger-jsdoc');
const { env } = require('../config/env');

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'ORA DE NUIT API',
    version: '1.0.0',
    description: 'Backend API for the ORA DE NUIT luxury restaurant mobile application.',
  },
  servers: [
    {
      url: `http://localhost:${env.PORT}${env.API_PREFIX}`,
      description: 'Local development server',
    },
  ],
  components: {
    schemas: {
      HealthResponse: {
        type: 'object',
        required: ['success', 'message'],
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string', example: 'API is running' },
        },
      },
    },
  },
};

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: ['./src/routes/**/*.js'],
});

module.exports = { swaggerSpec };
