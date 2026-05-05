// modules/menu/menu.routes.js

const router = require("express").Router();
const MenuController = require("./menu.controller");
const authMiddleware = require("../../middlewares/auth.middleware");
const requirePermission = require("../../middlewares/rbac.middleware");
const { PERMISSIONS } = require("../../constants/permissions");

router.get("/me/sidebar", authMiddleware, requirePermission(PERMISSIONS.RBAC.MODULES.READ), MenuController.getSidebar);

module.exports = router;