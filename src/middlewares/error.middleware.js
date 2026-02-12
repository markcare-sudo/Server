// src/middlewares/error.middleware.js
const ApiError = require("../core/errors/ApiError");

module.exports = function errorMiddleware(err, req, res, next) {
  const status = err instanceof ApiError ? err.statusCode : 500;
  const message = err.message || "Internal server error";
  const details = err instanceof ApiError ? err.details : null;

  if (status >= 500) console.error(err);

  res.status(status).json({
    success: false,
    message,
    details,
  });
};
