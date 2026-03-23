/**
 * @fileoverview Routes for Service Providers.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/serviceProviderController");
const requireAuth = require("../middlewares/requireAuth");
const permit = require("../middlewares/rbac.middleware");

// Routes
router.post("/register", requireAuth, controller.register);
router.get("/me", requireAuth, controller.getMyProfile);
router.put("/me", requireAuth, controller.updateProfile);
router.put("/me/availability", requireAuth, controller.setAvailability);
router.get("/search", requireAuth, controller.searchNearby);

// Admin / Verification
router.patch("/:providerId/verify", requireAuth, permit("ADMIN"), controller.verifyProvider);

module.exports = router;
