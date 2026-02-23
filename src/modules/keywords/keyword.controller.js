const keywordService = require("./keyword.service");

/**
 * Create a new keyword
 */
const createKeyword = async (req, res) => {
  try {
    const data = req.body;
    const keyword = await keywordService.createKeyword(data);
    res.status(201).json(keyword);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Get all keywords
 */
const getAllKeywords = async (req, res) => {
  try {
    const keywords = await keywordService.getAllKeywords();
    res.json(keywords);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get a single keyword by ID
 */
const getKeywordById = async (req, res) => {
  try {
    const keyword = await keywordService.getKeywordById(req.params.id);
    if (!keyword) return res.status(404).json({ message: "Keyword not found" });
    res.json(keyword);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a keyword
 */
const updateKeyword = async (req, res) => {
  try {
    const keyword = await keywordService.updateKeyword(req.params.id, req.body);
    res.json(keyword);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete a keyword
 */
const deleteKeyword = async (req, res) => {
  try {
    await keywordService.deleteKeyword(req.params.id);
    res.json({ message: "Keyword deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createKeyword,
  getAllKeywords,
  getKeywordById,
  updateKeyword,
  deleteKeyword,
};