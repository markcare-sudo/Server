/**
 * @fileoverview Standardized API response formatters.
 */

/**
 * Send a success response.
 * @param {Object} res - Express response object
 * @param {any} data - Payload data
 * @param {string} [message="Success"] - Success message
 * @param {number} [statusCode=200] - HTTP status code
 * @returns {Object} JSON response
 */
const success = (res, data, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send an error response.
 * @param {Object} res - Express response object
 * @param {string} message - Error message
 * @param {number} [statusCode=400] - HTTP status code
 * @param {any} [errors=null] - Additional validation or detail errors
 * @returns {Object} JSON response
 */
const error = (res, message, statusCode = 400, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
};

/**
 * Send a paginated success response.
 * @param {Object} res - Express response object
 * @param {any} data - Array of paginated data items
 * @param {Object} pagination - Pagination metadata
 * @param {string} [message="Success"] - Success message
 * @returns {Object} JSON response
 */
const paginated = (res, data, pagination, message = "Success") => {
  return res.status(200).json({
    success: true,
    message,
    data,
    pagination,
    timestamp: new Date().toISOString()
  });
};

module.exports = { success, error, paginated };
