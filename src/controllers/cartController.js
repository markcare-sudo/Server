/**
 * @fileoverview Resolves Express mappings directly towards Singleton Cart interactions securely
 */

const cartService = require("../services/cartService");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

exports.getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.getCart(req.user.id);
  return success(res, cart, "Cart dynamically instantiated structurally accessed.");
});

exports.addItem = asyncHandler(async (req, res) => {
  const cart = await cartService.addItem(req.user.id, req.body);
  return success(res, cart, "Item verified securely updating cart mathematically.");
});

exports.updateItemQuantity = asyncHandler(async (req, res) => {
  const cart = await cartService.updateItemQuantity(req.user.id, req.params.index, req.body.quantity);
  return success(res, cart, "Item volumes dynamically synchronized natively.");
});

exports.removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.removeItem(req.user.id, req.params.index);
  return success(res, cart, "Item cleanly extracted linearly from lists gracefully.");
});

exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await cartService.clearCart(req.user.id);
  return success(res, cart, "Array wiped clean synchronously.");
});

exports.applyDiscount = asyncHandler(async (req, res) => {
  const cart = await cartService.applyDiscount(req.user.id, req.body.code);
  return success(res, cart, "Coupons internally bound dynamically tracking metrics securely.");
});
