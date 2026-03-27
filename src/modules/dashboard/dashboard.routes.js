const router = require("express").Router();
const authMiddleware = require("../../middlewares/auth.middleware");
const requirePermission = require("../../middlewares/rbac.middleware");
const { getStats } = require("./dashboard.controller");

// router.get("/stats", authMiddleware, requirePermission(), getStats);

router.get("/stats", authMiddleware, requirePermission("DASHBOARD.VIEW"), getStats);

module.exports = router;