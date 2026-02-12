/* modules/blogs/blog.routes.js */

const express = require("express");
const router = express.Router();
const blogController = require("./blog.controller");

// You can add auth middleware here
// const { authenticate } = require("../../middlewares/auth.middleware");

router.post("/", blogController.create);
router.get("/", blogController.getAll);
router.get("/:id", blogController.getOne);
router.put("/:id", blogController.update);
router.delete("/:id", blogController.remove);

module.exports = router;
