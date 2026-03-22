import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Volunteer Service API',
      version: '1.0.0',
      description: 'Volunteer and resource assignment management service for ReliefLink platform',
      contact: {
        name: 'ReliefLink Team',
        url: 'https://relieflink.example.com',
      },
    },
    servers: [
      {
        url: '/api/v1',
        description: 'Volunteer Service API',
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
        Volunteer: {
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
            skills: {
              type: 'array',
              items: {
                type: 'string',
              },
            },
            availability: {
              type: 'string',
              enum: ['available', 'unavailable', 'on_duty'],
            },
            district: {
              type: 'string',
            },
            city: {
              type: 'string',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Resource: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
            },
            category: {
              type: 'string',
            },
            quantity: {
              type: 'integer',
            },
            location: {
              type: 'string',
            },
            status: {
              type: 'string',
              enum: ['available', 'allocated', 'in_use'],
            },
          },
        },
        Assignment: {
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
            volunteerId: {
              type: 'string',
              format: 'uuid',
            },
            resourceId: {
              type: 'string',
              format: 'uuid',
            },
            status: {
              type: 'string',
              enum: ['pending', 'active', 'completed', 'failed'],
            },
            assignedAt: {
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
