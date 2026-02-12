const { createOtp, verifyOtp } = require("./otp.service");
const { validateRequestOtp, validateVerifyOtp } = require("./otp.validation");

/* -------------------------------------------------- */
/* REQUEST OTP                                        */
/* -------------------------------------------------- */

async function requestOtp(req, res, next) {
  try {
    const { channel, destination, purpose, meta, tenantId } = validateRequestOtp(req.body);

    const userId = req.user?.id || null; // optional (MFA / logged-in flows)
    const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.ip;
    const ua = req.headers["user-agent"];

    const result = await createOtp({
      tenantId,
      channel,
      destination,
      userId,
      purpose,
      meta,
      ip,
      ua,
    });

    return res.status(201).json({
      success: true,
      message: "OTP sent successfully",
      data: {
        requestId: result.requestId,
        expiresAt: result.expiresAt,

        // ⚠️ DEV ONLY — NEVER expose in production
        ...(process.env.NODE_ENV !== "production" ? { otp: result.otp } : {}),
      },
    });
  } catch (e) {
    next(e);
  }
}

/* -------------------------------------------------- */
/* VERIFY OTP                                         */
/* -------------------------------------------------- */

async function verifyOtpController(req, res, next) {
  try {
    const { requestId, otp, purpose, tenantId } = validateVerifyOtp(req.body);

    const result = await verifyOtp({
      tenantId,
      requestId,
      otp,
      purpose,
    });

    return res.json({
      success: true,
      message: "OTP verified successfully",
      data: result,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = { requestOtp, verifyOtpController };
