// config/cors.js
const cors = require('cors');

const corsOptions = {
  origin: true, // reflect request origin (supports credentials)
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 204,
};

const corsMiddleware = cors(corsOptions);

module.exports = { corsOptions, corsMiddleware };
