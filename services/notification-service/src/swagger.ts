import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Notification Service API',
      version: '1.0.0',
      description: 'Notification and event tracking service for ReliefLink disaster management platform',
      contact: {
        name: 'ReliefLink Team',
        url: 'https://relieflink.example.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Notification Service API',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Notification: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            userId: {
              type: 'string',
              format: 'uuid',
            },
            message: {
              type: 'string',
            },
            type: {
              type: 'string',
              enum: ['info', 'warning', 'error', 'success'],
            },
            read: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        StatusEvent: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            requestId: {
              type: 'string',
              format: 'uuid',
            },
            oldStatus: {
              type: 'string',
            },
            newStatus: {
              type: 'string',
            },
            changedBy: {
              type: 'string',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false,
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                },
                message: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
