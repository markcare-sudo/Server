/* modules/iam/roles/role.routes.js */
const router = require("express").Router();

const authMiddleware = require("../../../../middlewares/auth.middleware");
const requirePermission = require("../../../../middlewares/rbac.middleware");

const RoleController = require("./role.controller");

router.get("/", authMiddleware, requirePermission('RBAC.ROLES.READ'), RoleController.list);
router.get("/:id", authMiddleware, requirePermission('RBAC.ROLES.READ'), RoleController.getOne);
router.put("/:id", authMiddleware, requirePermission('RBAC.ROLES.UPDATE'), RoleController.update);
router.post("/", authMiddleware, RoleController.create);
router.delete("/:id", authMiddleware, requirePermission('RBAC.ROLES.DELETE'), RoleController.remove);           // soft delete
router.delete("/:id/permanent", authMiddleware, requirePermission('RBAC.ROLES.DELETE'), RoleController.permanentRemove);

module.exports = router;