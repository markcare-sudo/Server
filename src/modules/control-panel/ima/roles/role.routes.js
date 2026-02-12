/* modules/iam/roles/role.routes.js */
const routerR = require("express").Router();

const authMiddleware = require("../../../../middlewares/auth.middleware");
const requirePermission = require("../../../../middlewares/rbac.middleware");

const RoleController = require("./role.controller");

routerR.get("/", authMiddleware, requirePermission("ADMIN.ROLES.VIEW"), RoleController.list);
routerR.post("/", authMiddleware, requirePermission("ADMIN.ROLES.CREATE"), RoleController.create);

module.exports = routerR;