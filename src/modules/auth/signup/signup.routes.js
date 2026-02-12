const router = require("express").Router();

const {
  requestSignupEmailOtpController,
  verifySignupEmailOtpController,
  requestSignupPhoneOtpController,
  verifySignupPhoneOtpController,
} = require("./signup.controller");

router.post("/email/request-otp", requestSignupEmailOtpController);
router.post("/email/verify-otp", verifySignupEmailOtpController);

router.post("/phone/request-otp", requestSignupPhoneOtpController);
router.post("/phone/verify-otp", verifySignupPhoneOtpController);

module.exports = router;
