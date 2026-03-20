/**
 * @fileoverview Edge mapping intercepting client purchase commands pushing towards Ledger abstractions natively.
 */

const paymentService = require("../services/paymentService");
const asyncHandler = require("../utils/asyncHandler");
const { success } = require("../utils/apiResponse");

exports.initiatePayment = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const userId = req.user.id;
  const { referenceType, referenceId, amount, method } = req.body;
  
  const result = await paymentService.initiatePayment(tenantId, userId, referenceType, referenceId, amount, method);
  return success(res, result, "Payment initiated successfully", 201);
});

exports.razorpayWebhook = asyncHandler(async (req, res) => {
  // express.raw() parses payloads mechanically preventing global JSON sanitizers from mutating exact checksum byte signatures
  const signature = req.headers["x-razorpay-signature"];
  const payloadStr = req.body.toString("utf8");
  const webhookPayload = JSON.parse(payloadStr);

  await paymentService.verifyAndCaptureRazorpay(webhookPayload, signature);
  return res.status(200).send("OK");
});

exports.getWalletBalance = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const data = await paymentService.getWalletBalance(userId);
  return success(res, data, "Wallet retrieved successfully");
});

exports.addWalletCredit = asyncHandler(async (req, res) => {
  const { userId, amount, description } = req.body;
  const newBalance = await paymentService.addWalletCredit(userId, amount, description);
  return success(res, { balance: newBalance }, "Admin wallet credit successfully executed");
});

exports.refundPayment = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;
  const { refundAmount, reason } = req.body;
  const result = await paymentService.processRefund(paymentId, refundAmount, reason);
  return success(res, result, "Payment refund executed formally");
});
