const express = require("express");
const router = express.Router();
const CartController = require("./cart.controller");

// 🔐 assume auth middleware already exists
const authMiddleware = require("../../../middlewares/auth.middleware");

// GET CART
router.get("/", authMiddleware, CartController.getCart);

// ADD ITEM
router.post("/", authMiddleware, CartController.addItem);

// UPDATE ITEM
router.put("/:item_id", authMiddleware, CartController.updateItem);

// REMOVE ITEM
router.delete("/:item_id", authMiddleware, CartController.removeItem);

module.exports = router;