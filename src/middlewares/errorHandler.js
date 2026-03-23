/**
 * @fileoverview Global Express error handling middleware.
 */

const { error: errorResponse } = require("../utils/apiResponse");

/**
 * Central error handler for Express app.
 */
const errorHandler = (err, req, res, next) => {
  const isProd = process.env.NODE_ENV === "production";

  if (!err.isOperational && !isProd) {
    console.error("Non-operational Error:", err);
  }

  if (err.isOperational) {
    return errorResponse(res, err.message, err.statusCode, err.errors);
  }

  const statusCode = 500;
  const message = "Something went wrong";
  
  // Conditionally include stack traces for dev debugging, never in prod
  const errors = isProd ? null : err.stack;

  return errorResponse(res, message, statusCode, errors);
};

module.exports = errorHandler;
