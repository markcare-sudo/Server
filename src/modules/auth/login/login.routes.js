const router = require("express").Router();
const controller = require("./login.controller");

router.post("/request-otp", controller.requestOtp);
router.post("/verify-otp", controller.verifyOtp);

router.post("/token/refresh", controller.refresh);
router.post("/logout", controller.logoutController);

module.exports = router;