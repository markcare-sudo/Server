const router = require("express").Router();
const { requestOtp, verifyOtpController } = require("./otp.controller");

// Public endpoints
router.post("/request", requestOtp);
router.post("/verify", verifyOtpController);

module.exports = router;
