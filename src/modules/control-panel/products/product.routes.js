const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const { upload } = require("../../../middlewares/upload.middleware");
const ProductController = require("./product.controller");

// PUBLIC
router.get("/", ProductController.list);
router.get("/details/:slug", ProductController.getDetails);
router.get("/:id", ProductController.getDetailsById);

// ADMIN
router.post("/", authMiddleware, upload.any(), ProductController.create);
router.put("/:id", authMiddleware, upload.any(), ProductController.update);
router.delete("/:id", authMiddleware, ProductController.remove);

module.exports = router;