const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const BrandController = require("./brand.controller");

// Public: Get all brands (for the Shop by Brand section)
router.get("/", BrandController.list);

// Admin: Manage brands in Control Panel
router.post("/", authMiddleware, BrandController.create);
router.patch("/:id", authMiddleware, BrandController.update);
router.delete("/:id", authMiddleware, BrandController.remove);

module.exports = router;