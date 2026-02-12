// src/middlewares/tenant.middleware.js
const ApiError = require("../core/errors/ApiError");

/**
 * Multi-tenant resolution
 * - Prefer subdomain: lab1.iqlims.com
 * - Or header: x-tenant-id
 * - Or JWT claims: req.user.tenantId
 */
module.exports = function tenantMiddleware(req, res, next) {
  const headerTenant = req.headers["x-tenant-id"];
  const headerBranch = req.headers["x-branch-id"];

  const tenantId = headerTenant || req.user?.tenantId || null;
  const branchId = headerBranch || req.user?.branchId || null;

  if (!tenantId) return next(new ApiError(400, "Tenant context missing (x-tenant-id)"));

  req.tenant = { tenantId: Number(tenantId), branchId: branchId ? Number(branchId) : null };
  return next();
};
