const ApiError = require("../../../core/errors/ApiError");

function isEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());
}
function isPhone(v) {
  // simple E.164-ish / indian 10-digit allowed (adjust later)
  const s = String(v || "").trim();
  return /^\+?[1-9]\d{7,14}$/.test(s) || /^\d{10}$/.test(s);
}

function validateRequestOtp(body) {
  const channel = String(body?.channel || "").toUpperCase();
  const destination = String(body?.destination || "").trim();

  if (!["EMAIL", "SMS"].includes(channel)) throw new ApiError(400, "channel must be EMAIL or SMS");
  if (!destination) throw new ApiError(400, "destination required");

  if (channel === "EMAIL" && !isEmail(destination)) throw new ApiError(400, "Invalid email");
  if (channel === "SMS" && !isPhone(destination)) throw new ApiError(400, "Invalid phone number");

  return { channel, destination };
}

function validateVerifyOtp(body) {
  const requestId = body?.requestId;
  const otp = String(body?.otp || "").trim();

  if (!requestId) throw new ApiError(400, "requestId required");
  if (!otp || otp.length < 4 || otp.length > 8) throw new ApiError(400, "Invalid otp");

  return { requestId: Number(requestId), otp };
}

module.exports = { validateRequestOtp, validateVerifyOtp };
