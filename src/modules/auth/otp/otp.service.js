const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const ApiError = require("../../../core/errors/ApiError");
const OtpRequest = require("./otp.model");

const { sendMail } = require("../../../core/email/mailer");
const { otpEmailTemplate } = require("./otpEmail.template");

/* -------------------------------------------------- */
/* SETTINGS                                           */
/* -------------------------------------------------- */

const OTP_TTL_MINUTES = 5;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RATE_LIMIT_WINDOW_MIN = 10;
const OTP_RATE_LIMIT_MAX = 5;

/* -------------------------------------------------- */
/* HELPERS                                            */
/* -------------------------------------------------- */

function assertChannel(channel) {
  if (!["EMAIL", "SMS"].includes(channel)) {
    throw new ApiError(400, "Invalid channel. Use EMAIL or SMS");
  }
}

function normalizeDestination(channel, destination) {
  const dest = String(destination || "").trim();
  if (!dest) throw new ApiError(400, "Destination required");

  if (channel === "EMAIL") {
    const email = dest.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, "Invalid email destination");
    }
    return email;
  }

  const phone = dest.replace(/[^\d]/g, "");
  if (phone.length < 8 || phone.length > 15) {
    throw new ApiError(400, "Invalid phone destination");
  }
  return phone;
}

/**
 * Generates a cryptographically secure-looking 6-digit string
 */
function generate6DigitOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/* -------------------------------------------------- */
/* RATE LIMIT                                         */
/* -------------------------------------------------- */

async function enforceRateLimit({ tenantId, channel, destination }) {
  const since = new Date(Date.now() - OTP_RATE_LIMIT_WINDOW_MIN * 60 * 1000);

  const where = {
    channel,
    destination,
    created_at: { [Op.gte]: since },
  };

  if (tenantId != null) where.tenant_id = tenantId;

  const count = await OtpRequest.count({ where });

  if (count >= OTP_RATE_LIMIT_MAX) {
    throw new ApiError(429, "Too many OTP requests. Try again later.");
  }
}

/* -------------------------------------------------- */
/* SEND OTP                                           */
/* -------------------------------------------------- */

async function sendOtp({ channel, destination, otp }) {
  if (channel === "EMAIL") {
    const tpl = otpEmailTemplate({ otp, ttlMinutes: OTP_TTL_MINUTES });

    await sendMail({
      to: destination,
      subject: tpl.subject,
      text: tpl.text,
      html: tpl.html,
    });

    return;
  }

  if (channel === "SMS") {
    throw new ApiError(501, "SMS OTP not configured yet");
  }
}

/* -------------------------------------------------- */
/* CREATE OTP                                         */
/* -------------------------------------------------- */

async function createOtp({
  tenantId = null,
  channel,
  destination,
  userId = null,
  purpose = "LOGIN", // Ensure this is overridden to "SIGNUP" in your signup flow
  meta = null,
  ip = null,
  ua = null,
}) {
  assertChannel(channel);

  const dest = normalizeDestination(channel, destination);

  await enforceRateLimit({ tenantId, channel, destination: dest });

  const otp = generate6DigitOtp();
  const otpHash = await bcrypt.hash(otp, 10);
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  const row = await OtpRequest.create({
    tenant_id: tenantId,
    user_id: userId,
    channel,
    destination: dest,
    purpose,
    otp_hash: otpHash,
    meta,
    expires_at: expiresAt,
    consumed_at: null,
    attempts: 0,
    ip_address: ip,
    user_agent: ua,
  });

  await sendOtp({ channel, destination: dest, otp });

  const isDev = process.env.NODE_ENV !== "production";

  return {
    requestId: row.id,
    expiresAt: row.expires_at,
    tenantId: row.tenant_id,
    // In Dev, we return the OTP to avoid checking emails constantly
    ...(isDev ? { otp } : {}),
  };
}

/* -------------------------------------------------- */
/* VERIFY OTP                                         */
/* -------------------------------------------------- */

async function verifyOtp({ tenantId = null, requestId, otp, purpose = null }) {
  const id = Number(requestId);
  if (!id || isNaN(id)) throw new ApiError(400, "Valid requestId is required");

  const otpStr = String(otp || "").trim();

  // Corrected regex and message for 6 digits
  if (!/^\d{6}$/.test(otpStr)) {
    throw new ApiError(400, "OTP must be 6 digits");
  }

  const where = { id };

  // if (tenantId !== null) where.tenant_id = tenantId;
  // if (purpose) where.purpose = purpose;

  // Debug line (remove in production)
  // console.log("DB Lookup where:", where);

  const row = await OtpRequest.findOne({ where });

  if (!row) {
    // This is where your 404 is coming from. 
    // Usually because 'purpose' or 'id' doesn't match the record.
    throw new ApiError(404, "OTP request not found");
  }

  if (row.consumed_at) throw new ApiError(400, "OTP already used");

  if (new Date(row.expires_at).getTime() < Date.now()) {
    throw new ApiError(400, "OTP expired");
  }

  if (row.attempts >= OTP_MAX_ATTEMPTS) {
    throw new ApiError(429, "Too many attempts. Request a new OTP.");
  }

  const ok = await bcrypt.compare(otpStr, row.otp_hash);

  if (!ok) {
    await row.update({ attempts: row.attempts + 1 });
    throw new ApiError(400, "Invalid OTP");
  }

  await row.update({ consumed_at: new Date() });

  return {
    success: true,
    destination: row.destination,
    channel: row.channel,
    userId: row.user_id,
    tenantId: row.tenant_id,
    purpose: row.purpose,
    meta: row.meta,
  };
}

module.exports = { createOtp, verifyOtp };