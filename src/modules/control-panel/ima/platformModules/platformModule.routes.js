const router = require("express").Router();
const { PERMISSIONS } = require("../../../../constants/permissions");
const authMiddleware = require("../../../../middlewares/auth.middleware");
const requirePermission = require("../../../../middlewares/rbac.middleware");
const { list, getOne, create, update, remove, listModulesFeaturesPermissions } = require("./platformModule.controller");

/* Base path: /api/v1/control-panel/platform-modules */

// router.get("/", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.READ), list);
// router.get("/:roleId/my-config", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.READ), listModulesFeaturesPermissions);
// router.get("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.READ), getOne);
// router.post("/", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.WRITE), create);
// router.put("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.UPDATE), update);
// router.delete("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.DELETE), remove);


router.get("/", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.READ), list);
router.get("/:roleId/my-config", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.READ), listModulesFeaturesPermissions);
router.get("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.READ), getOne);
router.post("/", create);
router.put("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.UPDATE), update);
router.delete("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.DELETE), remove);



module.exports = router;