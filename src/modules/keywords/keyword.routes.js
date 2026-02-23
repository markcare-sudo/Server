const express = require("express");
const router = express.Router();
const keywordController = require("./keyword.controller");

// Create a new keyword
router.post("/", keywordController.createKeyword);

// Get all keywords
router.get("/", keywordController.getAllKeywords);

// Get a single keyword by ID
router.get("/:id", keywordController.getKeywordById);

// Update a keyword
router.put("/:id", keywordController.updateKeyword);

// Delete a keyword
router.delete("/:id", keywordController.deleteKeyword);

module.exports = router;