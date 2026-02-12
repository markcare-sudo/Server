const bcrypt = require("bcryptjs");
const ApiError = require("../../../core/errors/ApiError");

const { createOtp, verifyOtp } = require("../otp/otp.service");
const RefreshToken = require("../tokens/refreshToken.model");
const { signAccessToken, makeRefreshTokenValue } = require("../tokens/token.util");

const { User } = require("../../control-panel/ima/users/user.model");
const { Op } = require("sequelize");

const REFRESH_DAYS =
  Number(String(process.env.REFRESH_TOKEN_DAYS || "30").replace(/[^\d]/g, "")) || 30;

function makeExpiryDate(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

/**
 * Normalize identity
 */
function identityWhere(channel, destination) {
  if (channel === "EMAIL") return { email: destination };
  if (channel === "SMS") return { phone: destination };
  throw new ApiError(400, "Invalid channel (EMAIL/SMS only)");
}


async function requestLoginOtp({ tenantId = null, channel, destination, ip, ua }) {
  const baseWhere = {
    is_active: true,
    ...identityWhere(channel, destination),
  };

  const where = tenantId ? { ...baseWhere, tenant_id: tenantId } : baseWhere;

  const user = await User.findOne({ where });

  return createOtp({
    channel,
    destination,
    userId: user?.id || null,
    tenantId: user?.tenant_id || null,
    purpose: "LOGIN",
    ip,
    ua,
  });
}


async function verifyLoginOtpAndIssueTokens({ tenantId = null, requestId, otp, ip = null, ua = null }) {
  if (!requestId || !otp) throw new ApiError(400, "requestId and otp are required");

  const otpResult = await verifyOtp({ requestId, otp, purpose: "LOGIN" });
  if (!otpResult) throw new ApiError(401, "Invalid or expired OTP");

  const { destination, channel } = otpResult;

  const baseWhere = {
    ...identityWhere(channel, destination),
    is_active: true,
  };

  let user;

  /** SUPER ADMIN LOGIN */
  if (!tenantId) {
    user = await User.findOne({ where: { ...baseWhere, is_super_admin: true } });
    if (!user) throw new ApiError(401, "Super admin not found");
  }

  /** TENANT USER LOGIN */
  else {
    user = await User.findOne({ where: { ...baseWhere, tenant_id: tenantId } });
    if (!user) throw new ApiError(401, "User not found for tenant");
  }

  return issueTokensForUser(user, { ip, ua });
}


async function issueTokensForUser(user, { ip, ua, isNewUser = false }) {
  const accessToken = signAccessToken(user);

  const refreshToken = makeRefreshTokenValue();
  const refreshHash = await bcrypt.hash(refreshToken, 10);

  await RefreshToken.create({
    user_id: user.id,
    token_hash: refreshHash,
    expires_at: makeExpiryDate(REFRESH_DAYS),
    ip_address: ip,
    user_agent: ua,
  });

  return {
    user: {
      id: user.id,
      tenantId: user.tenant_id ?? null,
      email: user.email ?? null,
      phone: user.phone ?? null,
      name: user.name,
      isSuperAdmin: Boolean(user.is_super_admin),
    },
    accessToken,
    refreshToken,
    isNewUser,
  };
}


async function refreshAccessToken({ refreshToken, ip, ua }) {
  const rows = await RefreshToken.findAll({
    where: { revoked_at: null },
    order: [["id", "DESC"]],
    limit: 25,
  });

  let matched = null;

  for (const row of rows) {
    const ok = await bcrypt.compare(refreshToken, row.token_hash);
    if (ok) {
      matched = row;
      break;
    }
  }

  if (!matched) throw new ApiError(401, "Invalid refresh token");
  if (new Date(matched.expires_at).getTime() < Date.now()) throw new ApiError(401, "Refresh token expired");

  const user = await User.findByPk(matched.user_id);
  if (!user || !user.is_active) throw new ApiError(401, "Invalid user");

  matched.revoked_at = new Date();
  await matched.save();

  const newRefreshToken = makeRefreshTokenValue();
  const newRefreshHash = await bcrypt.hash(newRefreshToken, 10);

  await RefreshToken.create({
    user_id: user.id,
    token_hash: newRefreshHash,
    expires_at: makeExpiryDate(REFRESH_DAYS),
    ip_address: ip || null,
    user_agent: ua || null,
  });

  const accessToken = signAccessToken(user);

  return { accessToken, refreshToken: newRefreshToken };
}


async function logout({ refreshToken }) {
  const rows = await RefreshToken.findAll({
    where: { revoked_at: null },
    order: [["id", "DESC"]],
    limit: 25,
  });

  for (const row of rows) {
    if (await bcrypt.compare(refreshToken, row.token_hash)) {
      row.revoked_at = new Date();
      await row.save();
      return true;
    }
  }

  return true;
}


module.exports = {
  requestLoginOtp,
  verifyLoginOtpAndIssueTokens,
  refreshAccessToken,
  logout,
};
