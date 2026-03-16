/* modules/auth/auth.routes.js */
const express = require("express");
const router = express.Router();
const authController = require("./auth.controller");

/**
 * @route   POST /api/auth/request-otp
 * @desc    Request an OTP via Email or SMS
 */
router.post("/request-otp", authController.requestOtp);

/**
 * @route   POST /api/auth/verify-otp
 * @desc    Verify OTP and return JWT (Login/Signup)
 */
router.post("/verify-otp", authController.verifyOtp);

module.exports = router;