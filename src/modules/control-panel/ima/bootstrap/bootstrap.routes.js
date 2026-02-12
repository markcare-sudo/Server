// src/modules/control-plane/iam/bootstrap/bootstrap.routes.js
const router = require("express").Router();
const BootstrapController = require("./bootstrap.controller");

router.post("/super-admin", BootstrapController.createSuperAdmin);

// 1️⃣ Create ALL permissions
router.post("/permissions", BootstrapController.createPermissions);

// 2️⃣ Create SUPER_ADMIN role
router.post("/roles", BootstrapController.createRole);

// 3️⃣ Assign role → permissions
router.post("/assign-role-permissions", BootstrapController.assignRolePermissions);

// 4️⃣ Assign role → super admin user
router.post("/assign-user-role", BootstrapController.assignUserRole);

module.exports = router;
