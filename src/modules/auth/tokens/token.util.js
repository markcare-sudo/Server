const jwt = require("jsonwebtoken");
const crypto = require("crypto");

function signAccessToken(user) {
  const payload = {
    id: user.id,
    sub: user.sub,
    roleIds: user.roleIds,
    is_super_admin: Boolean(user.is_super_admin),
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
