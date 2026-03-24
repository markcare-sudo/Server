const router = require("express").Router();
const authMiddleware = require("../../../middlewares/auth.middleware");
const CategoryController = require("./category.controller");

// Public or Customer view (Categories listing)
router.get("/", CategoryController.list);

// Admin Protected Routes
router.post(
    "/",
    authMiddleware,
    // requirePermission("CATALOG.MANAGE"), 
    CategoryController.create
);

router.patch(
    "/:id",
    authMiddleware,
    CategoryController.update
);

router.delete(
    "/:id",
    authMiddleware,
    CategoryController.remove
);

module.exports = router;