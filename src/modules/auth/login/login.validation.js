const ApiError = require("../../../core/errors/ApiError");

function validateRequestLoginOtp(body) {
  const channel = String(body?.channel || "").toUpperCase();
  const destination = String(body?.destination || "").trim();
  const tenantId = body?.tenantId ? Number(body.tenantId) : null;

  // if (!tenantId) throw new ApiError(400, "tenantId required");
  if (!["EMAIL", "SMS"].includes(channel)) throw new ApiError(400, "channel must be EMAIL or SMS");
  if (!destination) throw new ApiError(400, "destination required");

  return { tenantId, channel, destination };
}

function validateVerifyLoginOtp(body) {
  const tenantId = body?.tenantId ? Number(body.tenantId) : null;
  const requestId = body?.requestId ? Number(body.requestId) : null;
  const otp = String(body?.otp || "").trim();

  // if (!tenantId) throw new ApiError(400, "tenantId required");
  if (!requestId) throw new ApiError(400, "requestId required");
  if (!otp) throw new ApiError(400, "otp required");

  return { tenantId, requestId, otp };
}

function validateRefresh(body) {
  const refreshToken = String(body?.refreshToken || "").trim();
  if (!refreshToken) throw new ApiError(400, "refreshToken required");
  return { refreshToken };
}

module.exports = { validateRequestLoginOtp, validateVerifyLoginOtp, validateRefresh };
