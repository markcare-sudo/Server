// src/middlewares/rbac.middleware.js

const ApiError = require("../core/errors/ApiError");
const { getUserPermissions } = require("../modules/control-panel/ima/permissions/permission.service");

function requirePermission(permissionKey) {
  return async (req, res, next) => {
    try {
      const user = req.user;

      if (!user?.id) {
        return next(new ApiError(401, "Unauthenticated"));
      }

      // ✅ 1️⃣ Super Admin Bypass (NO DB HIT)
      if (user.is_super_admin) {
        return next();
      }

      const userId = user.id;

      // ✅ 2️⃣ Load permissions only if not already loaded
      let permissions = user.permissions;

      if (!permissions) {
        permissions = await getUserPermissions(userId);
        req.user.permissions = permissions; // cache in request
      }

      // ✅ 3️⃣ Permission check
      if (!permissions.includes(permissionKey)) {
        return next(
          new ApiError(403, "Access denied", {
            required: permissionKey,
          })
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}

module.exports = requirePermission;