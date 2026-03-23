/**
 * @fileoverview Exposed REST routes wrapping user instances correctly
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/cartController");
const requireAuth = require("../middlewares/requireAuth");

// Globally attach unified Authentication logic across Cartesian domains efficiently
router.use(requireAuth);

router.get("/", controller.getCart);
router.post("/items", controller.addItem);
router.patch("/items/:index", controller.updateItemQuantity);
router.delete("/items/:index", controller.removeItem);
router.delete("/", controller.clearCart);
router.post("/apply-coupon", controller.applyDiscount);

module.exports = router;
