/* src/modules/core/modules/module.routes.js */

const router = require("express").Router();

const { PERMISSIONS } = require("../../../../constants/permissions");
const authMiddleware = require("../../../../middlewares/auth.middleware");
// const requirePermission = require("../../../../middlewares/rbac.middleware");

const ModuleController = require("./module.controller");

// 🔥 VIEW ALL MODULES
router.get("/", authMiddleware, ModuleController.getAll);

// 🔥 TREE (SIDEBAR STRUCTURE)
router.get("/my-config", authMiddleware, ModuleController.getTree);

// 🔥 GET SINGLE MODULE
router.get("/:id", authMiddleware, ModuleController.getById);

// 🔥 CREATE MODULE
router.post("/", authMiddleware, ModuleController.create);

// 🔥 UPDATE MODULE
router.put("/:id", authMiddleware, ModuleController.update);

// 🔥 PERMANENT DELETE ALL MODULES (USE WITH CAUTION)
router.delete(
    "/force-all",
    authMiddleware,
    ModuleController.forceDeleteAll
);

// 🔥 DELETE MODULE
router.delete(
    "/:id",
    authMiddleware,
    ModuleController.remove
);



module.exports = router;