// src/routes/v1/v1.routes.js
const router = require("express").Router();

// BOOTSTRAP ROUTES
router.use("/bootstrap", require("../../modules/control-panel/ima/bootstrap/bootstrap.routes"));

// AUTH MODULE ROUTES
router.use("/auth/signup", require("../../modules/auth/signup/signup.routes"));
router.use("/auth/login", require("../../modules/auth/login/login.routes"));
router.use("/auth/otp", require("../../modules/auth/otp/otp.routes"));
router.use("/auth", require("../../modules/auth/auth.routes"));
router.use("/auth/profile", require("../../modules/auth/profile/authProfile.routes"));

// IAM MODULE ROUTES
router.use("/iam/permissions", require("../../modules/control-panel/ima/permissions/permission.routes"));
router.use("/iam/roles", require("../../modules/control-panel/ima/roles/role.routes"));
router.use("/iam/users", require("../../modules/control-panel/ima/users/user.routes"));
router.use("/iam/tenant-roles", require("../../modules/control-panel/ima/tenant_roles/tenantRole.routes"));
router.use("/iam/tenant-users", require("../../modules/control-panel/ima/tenant_users/tenantUser.routes"));
router.use("/iam/assignments", require("../../modules/control-panel/ima/assignments/assignment.routes"));

// BLOGS MODULE ROUTES
router.use("/blogs", require("../../modules/blogs/blog.routes"));


module.exports = router;
