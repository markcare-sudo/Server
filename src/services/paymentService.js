/**
 * @fileoverview Native Financial Orchestration securely transacting balances within Wallets alongside Webhook logic.
 */

const crypto = require("crypto");
const { sequelize } = require("../config/db");
const { Payment } = require("../models/Payment");
const { Wallet } = require("../models/Wallet");
const { WalletTransaction } = require("../models/WalletTransaction");
const AppError = require("../utils/AppError");
const { Order } = require("../models/Order");
const { Booking } = require("../models/Booking");
const { log: auditLog } = require("../utils/auditLogger");

let razorpay;
try {
  const Razorpay = require("razorpay");
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_mock",
    key_secret: process.env.RAZORPAY_SECRET || "rzp_secret_mock"
  });
} catch(e) {
  console.warn("Razorpay instance initialization gracefully caught mock environments.");
}

/**
 * Deterministically initializes a purchase schema routing dynamically onto Razorpay clusters or native internal ledgers.
 */
const initiatePayment = async (tenantId, userId, referenceType, referenceId, amount, method) => {
  if (method === "RAZORPAY") {
    const options = {
      amount: Math.round(amount * 100), // convert strictly to absolute integer paise
      currency: "INR",
      receipt: `${referenceType}_${referenceId}`
    };
    
    try {
      const order = await razorpay.orders.create(options);
      const payment = await Payment.create({
        tenant_id: tenantId,
        user_id: userId,
        reference_type: referenceType,
        reference_id: referenceId,
        amount,
        payment_method: "RAZORPAY",
        status: "PENDING",
        metadata: { razorpay_order_id: order.id }
      });
      return { payment, razorpayOrderId: order.id, amount, currency: "INR" };
    } catch (e) {
      throw new AppError(`Razorpay order creation failed: ${e.message}`, 500);
    }

  } else if (method === "WALLET") {
    const t = await sequelize.transaction();
    try {
      const wallet = await Wallet.getOrCreate(userId, t);
      
      // Strict internal isolation wrapping internal debits cleanly ensuring race condition eliminations natively mapped constraints
      const newWalletBalance = await wallet.debit(amount, referenceId, `Payment for ${referenceType} #${referenceId}`, t);
      
      const payment = await Payment.create({
        tenant_id: tenantId,
        user_id: userId,
        reference_type: referenceType,
        reference_id: referenceId,
        amount,
        payment_method: "WALLET",
        status: "SUCCESS"
      }, { transaction: t });

      if (referenceType === "BOOKING") {
        await Booking.update({ payment_status: "COMPLETED" }, { where: { id: referenceId, tenant_id: tenantId }, transaction: t });
      } else if (referenceType === "ORDER") {
        await Order.update({ payment_status: "COMPLETED" }, { where: { id: referenceId, tenant_id: tenantId }, transaction: t });
      }

      await t.commit();
      return { payment, newWalletBalance };
    } catch (e) {
      await t.rollback();
      throw new AppError(e.message, 400); // Expose pure logic restrictions (e.g. Insufficient Balance flags natively)
    }

  } else {
    throw new AppError("Invalid or Unsupported payment method.", 400);
  }
};

/**
 * Explicitly decrypts and verifies native signatures synchronously handling captured statuses mapping cleanly upon databases.
 */
const verifyAndCaptureRazorpay = async (webhookPayload, signature) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "mock_webhook_secret";
  const expectedSignature = crypto.createHmac("sha256", secret).update(JSON.stringify(webhookPayload)).digest("hex");

  if (expectedSignature !== signature) {
    throw new AppError("Invalid signature explicitly blocked by security constraints", 401);
  }

  const { event, payload } = webhookPayload;
  const paymentEntity = payload.payment.entity;
  const razorpayOrderId = paymentEntity.order_id;
  
  if (!razorpayOrderId) return { processed: true, event };

  const paymentRecord = await Payment.findOne({ 
    where: { 
      metadata: { razorpay_order_id: razorpayOrderId }
    }
  });

  if (!paymentRecord) return { processed: false, event };

  if (event === "payment.captured") {
    paymentRecord.status = "SUCCESS";
    paymentRecord.provider_transaction_id = paymentEntity.id;
    await paymentRecord.save();

    if (paymentRecord.reference_type === "BOOKING") {
      await Booking.update({ payment_status: "COMPLETED" }, { where: { id: paymentRecord.reference_id } });
    } else if (paymentRecord.reference_type === "ORDER") {
      await Order.update({ payment_status: "COMPLETED" }, { where: { id: paymentRecord.reference_id } });
    }

    auditLog({
      action: 'PAYMENT_CAPTURED',
      module: 'Payment',
      entityId: paymentRecord.id,
      newValues: { amount: paymentRecord.amount, method: 'RAZORPAY' },
      tenantId: paymentRecord.tenant_id
    });
    
  } else if (event === "payment.failed") {
    paymentRecord.status = "FAILED";
    await paymentRecord.save();
    
    if (paymentRecord.reference_type === "BOOKING") {
      await Booking.update({ payment_status: "FAILED" }, { where: { id: paymentRecord.reference_id } });
    } else if (paymentRecord.reference_type === "ORDER") {
      await Order.update({ payment_status: "FAILED" }, { where: { id: paymentRecord.reference_id } });
    }
  }

  return { processed: true, event };
};

/**
 * Mutates structural balance refunds strictly inside logical abstractions preventing oversending refunds mechanically.
 */
const processRefund = async (paymentId, refundAmount, reason) => {
  const payment = await Payment.findByPk(paymentId);
  if (!payment || payment.status !== "SUCCESS") {
    throw new AppError("Valid successful payment record natively required for refund operations", 400);
  }

  const parsedAmount = parseFloat(refundAmount);
  if (parsedAmount > parseFloat(payment.amount)) {
    throw new AppError("Total Refund amount natively exceeds explicit originally remitted payment boundaries", 400);
  }

  if (payment.payment_method === "RAZORPAY") {
    try {
      await razorpay.payments.refund(payment.provider_transaction_id, {
        amount: Math.round(parsedAmount * 100),
        notes: { reason }
      });
    } catch (e) {
      throw new AppError(`External Razorpay refund execution aborted: ${e.message}`, 500);
    }
  } else if (payment.payment_method === "WALLET") {
    const t = await sequelize.transaction();
    try {
      const wallet = await Wallet.getOrCreate(payment.user_id, t);
      await wallet.credit(parsedAmount, payment.reference_id, `Refund executed for ${payment.reference_type} Reference #${payment.reference_id}`, t);
      await t.commit();
    } catch (e) {
      await t.rollback();
      throw new AppError(`Internal Wallet refund execution physically aborted: ${e.message}`, 500);
    }
  }

  const currentMeta = payment.metadata || {};
  payment.metadata = {
    ...currentMeta,
    refunds: [...(currentMeta.refunds || []), { amount: parsedAmount, reason, date: new Date() }]
  };
  await payment.save();

  // Optionally maps generic Booking architecture refund references linearly if structured safely inside migrations dynamically.
  if (payment.reference_type === "BOOKING" && sequelize.models.Booking.rawAttributes.refund_amount) {
      await sequelize.query(`UPDATE bookings SET refund_amount = COALESCE(refund_amount, 0) + ${parsedAmount} WHERE id = ${payment.reference_id}`).catch(()=>null);
  }

  auditLog({
    action: 'REFUND_PROCESSED',
    module: 'Payment',
    entityId: paymentId,
    newValues: { refundAmount: parsedAmount },
    tenantId: payment.tenant_id
  });

  return { refund: parsedAmount, newPaymentStatus: payment.status };
};

/**
 * Cleanly wraps unreferenced wallet read abilities embedding last-10 array fetches identically securely
 */
const getWalletBalance = async (userId) => {
  const t = await sequelize.transaction();
  try {
    const wallet = await Wallet.getOrCreate(userId, t);
    const transactions = await WalletTransaction.findAll({
      where: { wallet_id: wallet.id },
      order: [["created_at", "DESC"]],
      limit: 10,
      transaction: t
    });
    await t.commit();
    return { balance: wallet.balance, transactions };
  } catch (e) {
    await t.rollback();
    throw new AppError(e.message, 500);
  }
};

/**
 * Handles explicit isolated admin credit abilities strictly leveraging constraints
 */
const addWalletCredit = async (userId, amount, description) => {
  const t = await sequelize.transaction();
  try {
    const wallet = await Wallet.getOrCreate(userId, t);
    const newBalance = await wallet.credit(amount, null, description || "Admin Discretionary Credit Issued", t);
    await t.commit();
    return newBalance;
  } catch (e) {
    await t.rollback();
    throw new AppError(e.message, 500);
  }
};

module.exports = {
  initiatePayment,
  verifyAndCaptureRazorpay,
  processRefund,
  getWalletBalance,
  addWalletCredit
};
