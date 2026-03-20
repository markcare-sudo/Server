/**
 * @fileoverview Wrapper to catch errors in async Express route handlers.
 */

/**
 * Wraps an async route handler to pass any caught errors to Next function.
 * @param {Function} fn - Async route handler function
 * @returns {Function} Express middleware function
 */
const asyncHandler = (fn) => (req, res, next) => {
  return Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
