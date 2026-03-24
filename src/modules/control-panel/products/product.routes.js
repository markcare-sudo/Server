const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const ProductController = require("./product.controller");

// Customer Routes
router.get("/", ProductController.list);
router.get("/:slug", ProductController.getDetails);

// Admin Routes (Control Panel)
router.post(
    "/",
    authMiddleware,
    // requirePermission("CATALOG.MANAGE"), 
    ProductController.create
);

router.patch("/:id", authMiddleware, ProductController.update);

router.delete("/:id", authMiddleware, ProductController.remove);

module.exports = router;