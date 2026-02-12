/* modules/auth/auth.service.js */
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { User } = require("../control-panel/ima/users/user.model");

function mustEnv(key) {
  if (!process.env[key]) throw new Error(`Missing env: ${key}`);
  return process.env[key];
}

const JWT_SECRET = () => mustEnv("JWT_SECRET");
const JWT_EXPIRES_IN = () => process.env.JWT_EXPIRES_IN || "1d";

async function login({ email, password }) {
  console.log("AuthService.login called with:", { email, password });
  
  if (!email || !password) {
    const err = new Error("Email and password are required");
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ where: { email, isActive: true } });
  if (!user) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    const err = new Error("Invalid credentials");
    err.status = 401;
    throw err;
  }

  // Minimal token payload — add tenantId/branchId for multi-tenant scoping
  const payload = {
    sub: user.id,
    tenantId: user.tenantId,
    branchId: user.branchId || null,
  };

  const token = jwt.sign(payload, JWT_SECRET(), { expiresIn: JWT_EXPIRES_IN() });

  return {
    accessToken: token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      tenantId: user.tenantId,
      branchId: user.branchId || null,
    },
  };
}


module.exports = { login };
