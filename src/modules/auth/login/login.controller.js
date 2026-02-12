const {
  requestLoginOtp,
  verifyLoginOtpAndIssueTokens,
  refreshAccessToken,
  logout,
} = require("./login.service");

const { validateRequestLoginOtp, validateVerifyLoginOtp, validateRefresh } = require("./login.validation");


async function requestOtp(req, res, next) {
  try {
    // const { tenantId, channel, destination } = validateRequestLoginOtp(req.body);
    const { tenantId, channel, destination } = req.body;

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const ua = req.headers["user-agent"];

    const result = await requestLoginOtp({ tenantId, channel, destination, ip, ua });

    return res.status(201).json({
      success: true,
      message: "OTP sent",
      data: {
        requestId: result.requestId,
        expiresAt: result.expiresAt,
        otp: result.otp, // ✅ remove in production after SMS/Email is wired
      },
    });
  } catch (e) {
    next(e);
  }
}

async function verifyOtp(req, res, next) {
  try {
    // ✅ include rememberMe (default false)
    // const { tenantId, requestId, otp, rememberMe = false } = validateVerifyLoginOtp(req.body);

     const { tenantId, requestId, otp, rememberMe = false } = req.body;

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const ua = req.headers["user-agent"];

    const result = await verifyLoginOtpAndIssueTokens({
      tenantId,
      requestId,
      otp,
      rememberMe: !!rememberMe,
      ip,
      ua,
    });

    return res.json({
      success: true,
      message: "Login successful",
      data: result,
    });
  } catch (e) {
    next(e);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = validateRefresh(req.body);

    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const ua = req.headers["user-agent"];

    const result = await refreshAccessToken({ refreshToken, ip, ua });

    return res.json({
      success: true,
      message: "Token refreshed",
      data: result,
    });
  } catch (e) {
    next(e);
  }
}

async function logoutController(req, res, next) {
  try {
    const { refreshToken } = validateRefresh(req.body);
    await logout({ refreshToken });

    return res.json({ success: true, message: "Logged out" });
  } catch (e) {
    next(e);
  }
}

module.exports = { requestOtp, verifyOtp, refresh, logoutController };









