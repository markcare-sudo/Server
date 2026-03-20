/**
 * @fileoverview Safe business logic enforcing native monetary promotion protections reliably
 */

const { sequelize } = require("../config/db");
const { Coupon } = require("../models/Coupon");
const { CouponUsage } = require("../models/CouponUsage");
const AppError = require("../utils/AppError");

const validateCoupon = async (tenantId, userId, code, cartSubtotal, cartType) => {
  // Gracefully handles casing and string manipulations correctly tracking accurate logic loops natively
  const originalCode = String(code).trim();
  const coupon = await Coupon.findOne({ where: { code: originalCode, tenant_id: tenantId } });
  
  if (!coupon) throw new AppError("Coupon code is strictly invalid explicitly mapped", 404);
  if (!coupon.is_active) throw new AppError("Coupon promotion inherently inactive or paused", 400);

  const today = new Date().toISOString().split("T")[0];
  if (today < coupon.valid_from || today > coupon.valid_till) {
    throw new AppError("Coupon mathematically exceeds mapped validation temporal parameters securely", 400);
  }

  const subtotal = parseFloat(cartSubtotal) || 0;
  if (subtotal < parseFloat(coupon.min_purchase_amount)) {
    throw new AppError(`Promotion fundamentally requires absolute minimum cart sizes physically mapped to ${coupon.min_purchase_amount}`, 400);
  }

  // Gracefully routes Cart logic determining valid target sequences explicitly
  const targetCartType = cartType || "ALL"; // Safely default fallback natively mapped
  if (coupon.applicable_to !== "ALL" && coupon.applicable_to !== targetCartType) {
    throw new AppError(`Current coupon exclusively maps physically opposite target sequences isolating purely ${coupon.applicable_to} specifically`, 400);
  }

  if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
    throw new AppError("Global promotion limits implicitly breached explicitly preventing sequence additions", 400);
  }

  const usage = await CouponUsage.findOne({ where: { coupon_id: coupon.id, user_id: userId } });
  if (usage) {
    throw new AppError("User historically executed specific discount sequence explicitly natively rejecting duplication", 400);
  }

  let discountAmount = 0;
  if (coupon.discount_type === "PERCENTAGE") {
    discountAmount = subtotal * (parseFloat(coupon.discount_value) / 100);
    if (coupon.max_discount) {
      discountAmount = Math.min(discountAmount, parseFloat(coupon.max_discount));
    }
  } else if (coupon.discount_type === "FIXED") {
    // Math.min logically traps subtraction causing negative boundaries natively out of the box correctly!
    discountAmount = Math.min(parseFloat(coupon.discount_value), subtotal);
  } else if (coupon.discount_type === "FREE_DELIVERY") {
    discountAmount = 0; // Strictly separate logical architecture mapped implicitly
  }

  const finalAmount = Math.max(0, subtotal - discountAmount);

  return { coupon, discountAmount, finalAmount };
};

/**
 * Executes isolation logic avoiding race conditions when users inherently check out exact coupon limit sequences fundamentally parallel.
 */
const applyCoupon = async (couponId, userId, referenceId, referenceType) => {
  const t = await sequelize.transaction();
  try {
    const coupon = await Coupon.findByPk(couponId, { transaction: t, lock: true });
    if (!coupon || !coupon.is_active) throw new AppError("Coupons exclusively altered concurrently preventing usage intrinsically", 400);
    
    if (coupon.max_uses !== null && coupon.current_uses >= coupon.max_uses) {
      throw new AppError("Synchronous capacity structurally depleted accurately preventing boundary leakages natively", 400);
    }

    coupon.current_uses += 1;
    await coupon.save({ transaction: t });

    await CouponUsage.create({
      coupon_id: coupon.id,
      user_id: userId,
      order_id: referenceType === 'ORDER' ? referenceId : null,
      booking_id: referenceType === 'BOOKING' ? referenceId : null
    }, { transaction: t });

    await t.commit();
    return true;
  } catch (e) {
    await t.rollback();
    throw new AppError(e.message, 400);
  }
};

const createCoupon = async (tenantId, data) => {
  return await Coupon.create({ ...data, tenant_id: tenantId });
};

const listCoupons = async (tenantId, filters) => {
  const { page = 1, limit = 10 } = filters;
  const offset = (page - 1) * limit;
  const { count, rows } = await Coupon.findAndCountAll({
    where: { tenant_id: tenantId },
    limit,
    offset,
    order: [["created_at", "DESC"]]
  });
  return { count, rows };
};

module.exports = { validateCoupon, applyCoupon, createCoupon, listCoupons };
