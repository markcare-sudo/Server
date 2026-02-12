// src/modules/auth/profile/authProfile.routes.js

const router = require("express").Router();
const controller = require("./authProfile.controller");

const auth = require("../../../middlewares/auth.middleware");

/**
 * AUTH PROFILE
 * Returns logged-in user roles & permissions
 */

router.get("/me", auth, controller.getMyProfile);

module.exports = router;
