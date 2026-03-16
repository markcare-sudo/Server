/* modules/auth/auth.controller.js */
const authService = require("./auth.service");

/**
 * Sends OTP to Email or Phone
 * POST /api/auth/request-otp
 */
const requestOtp = async (req, res, next) => {
  try {
    const { identifier, channel } = req.body;
    const ip = req.ip;
    const ua = req.headers["user-agent"];

    const result = await authService.requestLoginSignupOtp({
      identifier,
      channel, // "EMAIL" or "SMS"
      ip,
      ua,
    });

    res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      data: { requestId: result.requestId }, // ID from your OTP service
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verifies OTP and logs in / signs up the user
 * POST /api/auth/verify-otp
 */
const verifyOtp = async (req, res, next) => {
  try {
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

    res.status(result.isNewUser ? 201 : 200).json({
      success: true,
      message: result.isNewUser ? "Account created" : "Login successful",
      data: {
        user: result.user,
        accessToken: result.accessToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  requestOtp,
  verifyOtp,
};