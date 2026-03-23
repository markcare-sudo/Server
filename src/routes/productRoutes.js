/**
 * @fileoverview Product endpoint router mimicking structural behaviors mapped over Services.
 */

const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const requireAuth = require("../middlewares/requireAuth");
const permit = require("../middlewares/rbac.middleware");

// Public
router.get("/", controller.listProducts);
router.get("/:slug", controller.getProductBySlug);

// Admin Modifications strictly protected by permission scopes mapped towards JWT
router.post("/", requireAuth, permit("ADMIN"), controller.createProduct);
router.put("/:id", requireAuth, permit("ADMIN"), controller.updateProduct);
router.delete("/:id", requireAuth, permit("ADMIN"), controller.deleteProduct);

module.exports = router;
