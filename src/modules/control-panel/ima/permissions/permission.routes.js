/* modules/iam/permissions/permission.routes.js */
const routerP = require("express").Router();

const authMiddleware = require("../../../../middlewares/auth.middleware");
const requirePermission = require("../../../../middlewares/rbac.middleware");

const PermissionController = require("./permission.controller");

// Typically only platform admin creates permissions
routerP.get("/", authMiddleware, requirePermission("ADMIN.PERMISSIONS.VIEW"), PermissionController.list);
routerP.post("/", authMiddleware, requirePermission("ADMIN.PERMISSIONS.CREATE"), PermissionController.create);
module.exports = routerP;