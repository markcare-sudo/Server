const express = require("express");
const router = express.Router();
const blogController = require("./blog.controller");
const { upload } = require("../../middlewares/upload.middleware");

// CREATE blog with media
router.post("/", upload.single("featured_media"), blogController.create);

// UPDATE blog with media
router.put("/:id", upload.single("featured_media"), blogController.update);

router.get("/trending/keywords", blogController.getTrending);
router.get("/:id/related", blogController.getRelated);

router.get("/", blogController.getAll);
router.get("/:identifier", blogController.getSingle);

// router.get("/:id", blogController.getOne);
router.delete("/:id", blogController.remove);

module.exports = router;
