import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Request Service API',
      version: '1.0.0',
      description: 'Disaster relief request management service for ReliefLink platform',
      contact: {
        name: 'ReliefLink Team',
        url: 'https://relieflink.example.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Request Service API',
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
        Request: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            category: {
              type: 'string',
              enum: ['water', 'food', 'medicine', 'shelter', 'rescue', 'transport', 'other'],
            },
            description: {
              type: 'string',
            },
            urgency: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
            },
            district: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            peopleCount: {
              type: 'integer',
            },
            status: {
              type: 'string',
              enum: ['pending', 'matched', 'assigned', 'in_progress', 'completed', 'cancelled'],
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
        CreateRequestDto: {
          type: 'object',
          required: ['category', 'description', 'urgency', 'district', 'city', 'peopleCount'],
          properties: {
            category: {
              type: 'string',
              enum: ['water', 'food', 'medicine', 'shelter', 'rescue', 'transport', 'other'],
            },
            description: {
              type: 'string',
            },
            urgency: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
            },
            district: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            peopleCount: {
              type: 'integer',
              minimum: 1,
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
