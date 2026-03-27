// modules/menu/menu.routes.js

const router = require("express").Router();
const MenuController = require("./menu.controller");
const authMiddleware = require("../../middlewares/auth.middleware");

router.get("/me/menu", authMiddleware, MenuController.getMenu);

module.exports = router;