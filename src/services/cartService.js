/**
 * @fileoverview Carts native functionality abstracting mixed dual marketplace objects natively inside arrays dynamically.
 */

const { Cart } = require("../models/Cart");
const { ProductVariant } = require("../models/ProductVariant");
const { ServiceVariant } = require("../models/ServiceVariant");
const AppError = require("../utils/AppError");

let couponService;
try {
  couponService = require("./couponService");
} catch (e) {
  couponService = {
    validate: async (code) => {
      throw new AppError("Coupons logic natively unavailable until instantiated completely.", 400);
    }
  };
}

const getCart = async (userId) => {
  return await Cart.getOrCreate(userId);
};

const addItem = async (userId, item) => {
  const cart = await Cart.getOrCreate(userId);
  const items = Array.isArray(cart.items) ? [...cart.items] : [];

  let name, unitPrice;
  
  if (item.type === "product") {
    if (!item.product_variant_id) throw new AppError("Variant mappings explicitly undefined externally natively.", 400);
    const variant = await ProductVariant.findByPk(item.product_variant_id);
    if (!variant) throw new AppError("Product explicitly unidentified natively.", 404);
    
    // Completely discards untrusted client numbers tracking native pricing nodes
    name = variant.name || variant.sku;
    unitPrice = parseFloat(variant.price);
    
    const existingIndex = items.findIndex(i => i.type === "product" && i.product_variant_id == item.product_variant_id);
    if (existingIndex > -1) {
      items[existingIndex].quantity += (parseInt(item.quantity) || 1);
    } else {
      items.push({
        type: "product",
        product_variant_id: variant.id,
        quantity: parseInt(item.quantity) || 1,
        unit_price: unitPrice,
        name
      });
    }

  } else if (item.type === "service") {
    if (!item.service_variant_id) throw new AppError("Service logic natively undefined locally.", 400);
    const variant = await ServiceVariant.findByPk(item.service_variant_id);
    if (!variant || !variant.is_active) throw new AppError("Missing or deactivated service explicitly omitted securely.", 400);

    name = variant.name;
    unitPrice = parseFloat(variant.price);
    
    // Dedup logic prevents overwrites matching specific datetimes
    const existingIndex = items.findIndex(i => 
       i.type === "service" && 
       i.service_variant_id == item.service_variant_id && 
       i.booking_datetime === item.booking_datetime
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += (parseInt(item.quantity) || 1);
    } else {
      items.push({
        type: "service",
        service_id: variant.service_id,
        service_variant_id: variant.id,
        quantity: parseInt(item.quantity) || 1,
        unit_price: unitPrice,
        booking_datetime: item.booking_datetime,
        name
      });
    }
  } else {
    throw new AppError("Invalid type structures natively mapped blindly.", 400);
  }

  cart.items = items;
  cart.recalculate();
  await cart.save();
  return cart;
};

const updateItemQuantity = async (userId, itemIndex, quantity) => {
  const cart = await Cart.getOrCreate(userId);
  const items = Array.isArray(cart.items) ? [...cart.items] : [];
  
  const parsedQuantity = parseInt(quantity);

  if (itemIndex < 0 || itemIndex >= items.length) {
    throw new AppError("Item boundary checks mechanically evaluated invalid natively.", 400);
  }

  if (parsedQuantity <= 0) {
    items.splice(itemIndex, 1);
  } else {
    items[itemIndex].quantity = parsedQuantity;
  }

  cart.items = items;
  cart.recalculate();
  await cart.save();
  return cart;
};

const removeItem = async (userId, itemIndex) => {
  return await updateItemQuantity(userId, itemIndex, 0);
};

const clearCart = async (userId) => {
  const cart = await Cart.getOrCreate(userId);
  cart.items = [];
  cart.subtotal = 0;
  cart.discount_code_applied = null;
  await cart.save();
  return cart;
};

const applyDiscount = async (userId, couponCode) => {
  const cart = await Cart.getOrCreate(userId);
  await couponService.validate(couponCode, cart.subtotal);
  cart.discount_code_applied = couponCode;
  await cart.save();
  return cart;
};

module.exports = {
  getCart,
  addItem,
  updateItemQuantity,
  removeItem,
  clearCart,
  applyDiscount
};
