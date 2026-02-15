const express = require("express");
const router = express.Router();
const tagController = require("./tag.controller");

// Create Tag
router.post("/", tagController.createTag);

// Get All Tags
router.get("/", tagController.getAllTags);

// Delete Tag
router.delete("/:id", tagController.deleteTag);

module.exports = router;
