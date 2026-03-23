/**
 * @fileoverview External mapping paths dynamically invoking Ledger states properly guarded.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/paymentController");
const requireAuth = require("../middlewares/requireAuth");
const permit = require("../middlewares/rbac.middleware");

// VERY IMPORTANT: Intercepting webhooks must strictly map 'application/json' against express.raw structurally 
// BEFORE global JSON parsing handlers inevitably chew and distort original buffer signatures.
router.post(
  "/webhook/razorpay",
  express.raw({ type: "application/json" }),
  controller.razorpayWebhook
);

// Standard Customer APIs
/**
 * @swagger
 * /payments/initiate:
 *   post:
 *     summary: Initiate a payment sequence via Razorpay or Wallet
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               referenceType:
 *                 type: string
 *               referenceId:
 *                 type: integer
 *               amount:
 *                 type: number
 *               method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment successfully initiated
 *       400:
 *         description: Invalid payload or low wallet balance
 *       401:
 *         description: Unauthorized
 */
router.post("/initiate", requireAuth, controller.initiatePayment);
router.get("/wallet", requireAuth, controller.getWalletBalance);

// Administrator Interventions
router.post("/wallet/credit", requireAuth, permit("ADMIN"), controller.addWalletCredit);
router.post("/:paymentId/refund", requireAuth, permit("ADMIN"), controller.refundPayment);

module.exports = router;
