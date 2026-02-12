// src/middlewares/auth.middleware.js
const jwt = require("jsonwebtoken");
const ApiError = require("../core/errors/ApiError");
const { User } = require("../modules/control-panel/ima/users/user.model");

module.exports = async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7).trim()
      : null;

    if (!token) {
      return next(new ApiError(401, "Missing auth token"));
    }

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return next(new ApiError(401, "Invalid or expired token"));
    }

    // payload.sub = userId
    const user = await User.findByPk(payload.sub);

    if (!user || !user.is_active) {
      return next(new ApiError(401, "Invalid or inactive user"));
    }

    // Attach authenticated user context
    req.user = {
      id: user.id,
      tenantId: user.tenantId,
      branchId: user.branchId || null,
    };

    // Optional: keep token claims if needed
    req.auth = payload;

    next();
  } catch (error) {
    next(error);
  }
};
