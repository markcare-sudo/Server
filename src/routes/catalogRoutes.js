/**
 * @fileoverview Routes for Service Catalog.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/catalogController");
const requireAuth = require("../middlewares/requireAuth");
const permit = require("../middlewares/rbac.middleware");

// Public routes querying purely via category/slug
/**
 * @swagger
 * /services:
 *   get:
 *     summary: List all services
 *     responses:
 *       200:
 *         description: List of services retrieved securely
 *       400:
 *         description: Invalid query parameters
 *       401:
 *         description: Unauthorized
 */
router.get("/", controller.listServices);
router.get("/:slug", controller.getServiceBySlug);

// Admin modification routes
/**
 * @swagger
 * /services:
 *   post:
 *     summary: Create a new service (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service created
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post("/", requireAuth, permit("ADMIN"), controller.createService);
router.put("/:id", requireAuth, permit("ADMIN"), controller.updateService);
router.delete("/:id", requireAuth, permit("ADMIN"), controller.deleteService);

module.exports = router;
