const router = require("express").Router();
const { PERMISSIONS } = require("../../../../constants/permissions");
const authMiddleware = require("../../../../middlewares/auth.middleware");
const requirePermission = require("../../../../middlewares/rbac.middleware");

const { list, getOne, create, update, remove, createBulk } = require("./platformFeature.controller");

/*
Base path:
 /api/v1/control-panel/platform-features
*/

router.get("/", authMiddleware, requirePermission(PERMISSIONS.RBAC.FEATURES.READ), list);
router.get("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.FEATURES.READ), getOne);
router.get("/bulk-create", authMiddleware, requirePermission(PERMISSIONS.RBAC.FEATURES.WRITE), createBulk)
router.post("/", authMiddleware, requirePermission(PERMISSIONS.RBAC.FEATURES.WRITE), create);
router.put("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.FEATURES.UPDATE), update);
router.delete("/:id", authMiddleware, requirePermission(PERMISSIONS.RBAC.FEATURES.DELETE), remove);

module.exports = router;
