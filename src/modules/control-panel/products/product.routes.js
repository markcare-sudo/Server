const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const upload = require("../../../utils/multerConfig");
const ProductController = require("./product.controller");
// const upload = require("../../../core/utils/multerConfig"); // Ensure you have a multer config

// Customer Routes
router.get("/", ProductController.list);
router.get("/:slug", ProductController.getDetails);

// Admin Routes
router.post(
    "/",
    authMiddleware,
    upload.any(), // <--- CRITICAL: Parses the FormData and files
    ProductController.create
);

router.patch(
    "/:id",
    authMiddleware,
    upload.any(), // <--- CRITICAL: For updates with new images
    ProductController.update
);

router.delete("/:id", authMiddleware, ProductController.remove);

module.exports = router;