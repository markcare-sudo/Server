/* modules/iam/users/user.routes.js */
const routerU = require("express").Router();
const UserController = require("./user.controller");

const authMiddleware = require("../../../../middlewares/auth.middleware");
const requirePermission = require("../../../../middlewares/rbac.middleware");

// ADMIN.USERS.VIEW / ADMIN.USERS.CREATE
routerU.get("/", authMiddleware, requirePermission("ADMIN.USERS.VIEW"), UserController.list);
routerU.post("/", authMiddleware, requirePermission("ADMIN.USERS.CREATE"), UserController.create);

module.exports = routerU;