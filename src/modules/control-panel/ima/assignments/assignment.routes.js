/* modules/iam/assignments/assignment.routes.js */
const router = require("express").Router();
const authMiddleware = require("../../../../middlewares/auth.middleware");
const requirePermission = require("../../../../middlewares/rbac.middleware");
const AssignmentController = require("./assignment.controller");

router.post("/assign-role", authMiddleware, requirePermission("ADMIN.USERS.ASSIGN_ROLE"), AssignmentController.assignRole);
router.post("/attach-permission", authMiddleware, requirePermission("ADMIN.ROLES.ATTACH_PERMISSION"), AssignmentController.attachPermission);
router.get("/me/permissions", authMiddleware, AssignmentController.myPermissions);

module.exports = router;