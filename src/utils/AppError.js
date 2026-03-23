/**
 * @fileoverview Custom error class for operational application errors.
 */

/**
 * Represents an operational error in the application.
 * @extends Error
 */
class AppError extends Error {
  /**
   * @param {string} message - Error description
   * @param {number} [statusCode=400] - HTTP status code
   * @param {any} [errors=null] - Optional detailed validation errors
   */
  constructor(message, statusCode = 400, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.isOperational = true;

    // Capture the stack trace indicating where the error was instantiated
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
