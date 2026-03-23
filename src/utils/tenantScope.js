/**
 * @fileoverview Utilities for scoping queries to a specific tenant.
 */

const { error } = require("./apiResponse");

/**
 * Merges a tenantId into a Sequelize where clause.
 * @param {Object} whereClause - Existing where clause
 * @param {string|number} tenantId - Tenant ID to scope by
 * @returns {Object} Updated where clause
 */
const addTenantScope = (whereClause = {}, tenantId) => {
  return {
    ...whereClause,
    tenant_id: tenantId
  };
};

/**
 * Middleware to ensure the request is scoped to a valid tenant.
 * Expects auth middleware to have populated req.user.
 */
const requireTenantId = (req, res, next) => {
  // Support both tenant_id and tenantId depending on user object shape
  const tenantId = req.user?.tenant_id || req.user?.tenantId;

  if (!tenantId) {
    return error(res, "Missing tenant context. User does not belong to a tenant.", 400);
  }

  req.tenantId = tenantId;
  next();
};

module.exports = { addTenantScope, requireTenantId };
