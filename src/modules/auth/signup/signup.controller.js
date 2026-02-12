const {
  requestSignupEmailOtp,
  verifySignupEmailOtp,
  requestSignupPhoneOtp,
  verifySignupPhoneOtpAndCreateTenant,
} = require("./signup.service");

/**
 * STEP 1 — Request EMAIL OTP
 */
async function requestSignupEmailOtpController(req, res, next) {
  try {
    const { name, labName, email, phone } = req.body;

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const ua = req.headers["user-agent"];

    const result = await requestSignupEmailOtp({ name, labName, email, phone, ip, ua });

    return res.status(201).json({
      success: true,
      message: "Email OTP sent",
      data: {
        requestId: result.requestId,
        expiresAt: result.expiresAt,
        otp: result.otp, // ⚠ remove in production
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * STEP 2 — Verify EMAIL OTP → returns signupToken
 */
async function verifySignupEmailOtpController(req, res, next) {
  try {
    const { requestId, otp } = req.body;

    const result = await verifySignupEmailOtp({ requestId, otp });

    return res.json({
      success: true,
      message: "Email verified",
      data: result, // { signupToken }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * STEP 3 — Request PHONE OTP (requires signupToken)
 */
async function requestSignupPhoneOtpController(req, res, next) {
  try {
    const { signupToken } = req.body;

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const ua = req.headers["user-agent"];

    const result = await requestSignupPhoneOtp({ signupToken, ip, ua });

    return res.status(201).json({
      success: true,
      message: "Phone OTP sent",
      data: {
        requestId: result.requestId,
        expiresAt: result.expiresAt,
        otp: result.otp, // ⚠ remove in production
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * STEP 4 — Verify PHONE OTP → create tenant + lab admin
 */
async function verifySignupPhoneOtpController(req, res, next) {
  try {
    const { requestId, otp } = req.body;

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const ua = req.headers["user-agent"];

    const result = await verifySignupPhoneOtpAndCreateTenant({ requestId, otp, ip, ua });

    return res.status(201).json({
      success: true,
      message: "Signup successful",
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  requestSignupEmailOtpController,
  verifySignupEmailOtpController,
  requestSignupPhoneOtpController,
  verifySignupPhoneOtpController,
};
