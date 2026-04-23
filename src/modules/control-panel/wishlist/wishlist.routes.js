const express = require("express");
const router = express.Router();
const WishlistController = require("./wishlist.controller");
const authMiddleware = require("../../../middlewares/auth.middleware");

// GET
router.get("/", authMiddleware, WishlistController.getWishlist);

// ADD
router.post("/", authMiddleware, WishlistController.addItem);

// REMOVE
router.delete("/:item_id", authMiddleware, WishlistController.removeItem);

// TOGGLE (best for UI)
router.post("/toggle", authMiddleware, WishlistController.toggle);

module.exports = router;