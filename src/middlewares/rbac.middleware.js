// src/middlewares/rbac.middleware.js
const ApiError = require("../core/errors/ApiError");
const { getUserPermissions } = require("../modules/control-panel/ima/permissions/permission.service");

function requirePermission(permissionKey) {
  return async (req, res, next) => {
    try {
      if (!req.user?.id) {
        return next(new ApiError(401, "Unauthenticated"));
      }

      const userId = req.user.id;

      // Load permissions from DB
      const permissions = await getUserPermissions(userId);

      // ✅ TEMP DEBUG (remove in production)
      // console.log("RBAC:", { userId, permissionKey, permissions });

      if (!permissions.includes(permissionKey)) {
        return next(new ApiError(403, "Access denied", {
          required: permissionKey,
          userId,
          grantedCount: permissions.length
        }));
      }

      // Optional: attach to req for later usage
      req.user.permissions = permissions;

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requirePermission;
