const authService = require("./auth.service");
const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");

/**
 * Sends OTP to Email or Phone
 * POST /api/auth/request-otp
 */
const requestOtp = asyncHandler(async (req, res) => {
  const { identifier, channel } = req.body;
  const ip = req.ip;
  const ua = req.headers["user-agent"];

  const result = await authService.requestLoginSignupOtp({
    identifier,
    channel, // "EMAIL" or "SMS"
    ip,
    ua,
  });

  return ok(res, {
    requestId: result.requestId,
    expiresAt: result.expiresAt,
    destination: identifier,
    otp: result.otp,
  }, "OTP sent successfully");
});

/**
 * Verifies OTP and logs in / signs up the user
 * POST /api/auth/verify-otp
 */
const verifyOtp = asyncHandler(async (req, res) => {
  const { requestId, otp, name } = req.body;
  const ip = req.ip;
  const ua = req.headers["user-agent"];

  const result = await authService.verifyOtpAndAuth({
    requestId,
    otp,
    name, // Optional: only used if it's a new signup
    ip,
    ua,
  });

  // Option: Set refreshToken in an HttpOnly cookie for better security
  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  if (result.isNewUser) {
    return created(res, { user: result.user, accessToken: result.accessToken }, "Account created");
  } else {
    return ok(res, { user: result.user, accessToken: result.accessToken }, "Login successful");
  }
});

module.exports = {
  requestOtp,
  verifyOtp,
};