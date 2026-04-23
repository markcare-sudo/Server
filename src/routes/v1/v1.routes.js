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
router.use("/iam/modules", require("../../modules/control-panel/ima/platformModules/platformModule.routes"));
router.use("/iam/features", require("../../modules/control-panel/ima/platformFeatures/platformFeature.routes"));
router.use("/iam/assignments", require("../../modules/control-panel/ima/assignments/assignment.routes"));

// PLATFORM CONFIGURATIONS

router.use("/sidebar", require("../../modules/menu/menu.routes"));

router.use("/dashboard", require("../../modules/dashboard/dashboard.routes"));
router.use("/audit-logs", require("../../modules/control-panel/ima/audit-logs/audit-log.routes"));

// CONTROL PANEL
router.use("/catalog/brands", require("../../modules/control-panel/brands/brand.routes"));
router.use("/catalog/categories", require("../../modules/control-panel/categories/category.routes"));
router.use("/catalog/products", require("../../modules/control-panel/products/product.routes"));
router.use("/catalog/services", require("../../modules/control-panel/service/service.routes"));
router.use("/catalog", require("../../modules/control-panel/catalog/catalog.routes"));
router.use("/cart", require("../../modules/control-panel/cart/cart.routes"));
router.use("/wishlist", require("../../modules/control-panel/wishlist/wishlist.routes"));

// BLOGS MODULE ROUTES
router.use("/blogs", require("../../modules/blogs/blog.routes"));
router.use("/tags", require("../../modules/tags/tag.routes"));
router.use("/keywords", require("../../modules/keywords/keyword.routes"));

router.use("/callback-requests", require("../../modules/callbackRequest/callbackRequest.routes"));

module.exports = router;
