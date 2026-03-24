const tagService = require("./tag.service");
const asyncHandler = require("../../utils/asyncHandler");
const { ok, created } = require("../../utils/apiResponse");

/**
 * Create Tag
 */
const createTag = asyncHandler(async (req, res) => {
  const tag = await tagService.createTag(req.body);
  return created(res, { tag }, "Tag created successfully");
});

/**
 * Get All Tags
 */
const getAllTags = asyncHandler(async (req, res) => {
  const tags = await tagService.getAllTags();
  return ok(res, tags);
});

/**
 * Delete Tag
 */
const deleteTag = asyncHandler(async (req, res) => {
  await tagService.deleteTag(req.params.id);
  return ok(res, null, "Tag deleted successfully");
});

module.exports = {
  createTag,
  getAllTags,
  deleteTag,
};
