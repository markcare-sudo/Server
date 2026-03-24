const keywordService = require("./keyword.service");
const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");

/**
 * Create a new keyword
 */
const createKeyword = asyncHandler(async (req, res) => {
  const data = req.body;
  const keyword = await keywordService.createKeyword(data);
  return created(res, keyword);
});

/**
 * Get all keywords
 */
const getAllKeywords = asyncHandler(async (req, res) => {
  const keywords = await keywordService.getAllKeywords();
  return ok(res, keywords);
});

/**
 * Get a single keyword by ID
 */
const getKeywordById = asyncHandler(async (req, res) => {
  const keyword = await keywordService.getKeywordById(req.params.id);
  if (!keyword) {
    // We can just throw ApiError here ideally, but since keywordService might not, let's keep it simple.
    // If not found, apiResponse throws 404 cleanly.
    return res.status(404).json({ success: false, message: "Keyword not found" });
  }
  return ok(res, keyword);
});

/**
 * Update a keyword
 */
const updateKeyword = asyncHandler(async (req, res) => {
  const keyword = await keywordService.updateKeyword(req.params.id, req.body);
  return ok(res, keyword);
});

/**
 * Delete a keyword
 */
const deleteKeyword = asyncHandler(async (req, res) => {
  await keywordService.deleteKeyword(req.params.id);
  return ok(res, null, "Keyword deleted successfully");
});

module.exports = {
  createKeyword,
  getAllKeywords,
  getKeywordById,
  updateKeyword,
  deleteKeyword,
};