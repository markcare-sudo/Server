const router = require("express").Router();

const authMiddleware = require("../../../middlewares/auth.middleware");
const { upload } = require("../../../middlewares/upload.middleware");

const TechnicianDocumentController = require("./technician-document.controller");

// =========================
// CREATE
// =========================
router.post("/", authMiddleware, upload.single("document"), TechnicianDocumentController.create);

// =========================
// GET ALL
// =========================
router.get("/", authMiddleware, TechnicianDocumentController.findAll);

// =========================
// GET ONE
// =========================
router.get("/:id", authMiddleware, TechnicianDocumentController.findOne);

// =========================
// UPDATE
// =========================
router.put("/:id", authMiddleware, upload.single("document"), TechnicianDocumentController.update);

// =========================
// DELETE
// =========================
router.delete("/:id", authMiddleware, TechnicianDocumentController.remove);

module.exports = router;