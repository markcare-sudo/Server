/* modules/auth/auth.routes.js */
const router = require("express").Router();
const AuthController = require("./auth.controller");

router.post("/login", AuthController.login);

module.exports = router;