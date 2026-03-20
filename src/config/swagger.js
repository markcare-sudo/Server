/**
 * @fileoverview Auto-generated OpenAPI 3.0 documentation configuration natively wrapping Express endpoints sequentially dynamically safely
 */

const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "MarkCare API",
      version: "1.0.0",
      description: "Services + Products Marketplace Backend",
    },
    servers: [
      {
        url: "/api/v1",
        description: "Development API V1 Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  // Automatically scanning dynamic route endpoints matching native explicitly mapped rules seamlessly
  apis: ["./src/routes/*.js"],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
