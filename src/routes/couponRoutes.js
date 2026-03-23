/**
 * @fileoverview Admin exclusively mapped routing parameters protecting internal sequences seamlessly.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/couponController");
const requireAuth = require("../middlewares/requireAuth");
const permit = require("../middlewares/rbac.middleware");

// Structurally bounds logical paths mapping administrative schemas globally out of the box natively
router.post("/", requireAuth, permit("ADMIN"), controller.createCoupon);
router.get("/", requireAuth, permit("ADMIN"), controller.listCoupons);

module.exports = router;
