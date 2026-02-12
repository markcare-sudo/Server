const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function signAccessToken(user) {
  const payload = {
    sub: String(user.id),
    tenantId: user.tenantId,
    branchId: user.branchId || null,
    isSuperAdmin: Boolean(user.isSuperAdmin),
  };

  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY || "1d",
  });
}

function makeRefreshTokenValue() {
  // random long token (not JWT)
  return crypto.randomBytes(48).toString("hex");
}

module.exports = { signAccessToken, makeRefreshTokenValue };
