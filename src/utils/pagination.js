/**
 * @fileoverview Utilities for handling pagination data.
 */

/**
 * Extract and sanitize pagination parameters from query string.
 * @param {Object} query - Express request query object
 * @returns {Object} { page, limit, offset }
 */
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  let limit = parseInt(query.limit, 10) || 20;
  
  if (limit > 100) limit = 100;
  if (limit < 1) limit = 20;

  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Generate pagination metadata for response.
 * @param {number} count - Total number of items
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
const getPaginationMeta = (count, page, limit) => {
  const totalPages = Math.ceil(count / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    total: count,
    page,
    limit,
    totalPages,
    hasNext,
    hasPrev
  };
};

module.exports = { getPagination, getPaginationMeta };
