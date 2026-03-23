/**
 * @fileoverview Main authentication pipeline for protected routes.
 * Composes JWT validation and tenant context extraction.
 */

const verifyToken = require("./auth.middleware");
const { requireTenantId } = require("../utils/tenantScope");

/**
 * Array of middlewares for Express routes requiring authentication and tenant scope.
 * First validates the user/token, then checks for tenant.
 */
module.exports = [verifyToken, requireTenantId];
