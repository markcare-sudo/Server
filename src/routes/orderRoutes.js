/**
 * @fileoverview Central endpoint dispatcher mapping internal REST calls securely onto internal native checkout states natively.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/orderController");
const requireAuth = require("../middlewares/requireAuth");
const permit = require("../middlewares/rbac.middleware");

// Creation and internal retrieval (Secure)
/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Place a new product order
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_variant_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *               shipping_address:
 *                 type: object
 *               payment_method:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order successfully generated
 *       400:
 *         description: Bad request (insufficient stock)
 *       401:
 *         description: Unauthorized
 */
router.post("/", requireAuth, controller.createOrder);
router.get("/", requireAuth, controller.listOrders);
router.get("/:id", requireAuth, controller.getOrderById);

// Patch state manipulations
router.patch("/:id/cancel", requireAuth, controller.cancelOrder);

// Admin specific logical bridges
router.patch("/:id/status", requireAuth, permit("ADMIN"), controller.updateStatus);

module.exports = router;
