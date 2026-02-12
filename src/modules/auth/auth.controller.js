/* modules/auth/auth.controller.js */
const AuthService = require("./auth.service");

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const data = await AuthService.login({ email, password });
    res.json({ success: true, ...data });
  } catch (e) {
    next(e);
  }
}

module.exports = { login };
