// src/routes/v1/v1.routes.js
const router = require("express").Router();

// BOOTSTRAP ROUTES
router.use("/bootstrap", require("../../modules/control-panel/ima/bootstrap/bootstrap.routes"));

// AUTH MODULE ROUTES
router.use("/auth", require("../../modules/auth/auth.routes"));
router.use("/auth/profile", require("../../modules/auth/profile/authProfile.routes"));

// IAM MODULE ROUTES
router.use("/iam/permissions", require("../../modules/control-panel/ima/permissions/permission.routes"));
router.use("/iam/roles", require("../../modules/control-panel/ima/roles/role.routes"));
router.use("/iam/users", require("../../modules/control-panel/ima/users/user.routes"));
router.use("/iam/tenant-roles", require("../../modules/control-panel/ima/tenant_roles/tenantRole.routes"));
router.use("/iam/tenant-users", require("../../modules/control-panel/ima/tenant_users/tenantUser.routes"));
router.use("/iam/assignments", require("../../modules/control-panel/ima/assignments/assignment.routes"));

// CONTROL PANEL
router.use("/brands", require("../../modules/control-panel/brands/brand.routes"));
router.use("/categories", require("../../modules/control-panel/categories/category.routes"));
router.use("/products", require("../../modules/control-panel/products/product.routes"));

// BLOGS MODULE ROUTES
router.use("/blogs", require("../../modules/blogs/blog.routes"));
router.use("/tags", require("../../modules/tags/tag.routes"));
router.use("/keywords", require("../../modules/keywords/keyword.routes"));

router.use("/callback-requests", require("../../modules/callbackRequest/callbackRequest.routes"));

module.exports = router;
