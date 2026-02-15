const tagService = require("./tag.service");

/**
 * Create Tag
 */
const createTag = async (req, res) => {
  try {
    const tag = await tagService.createTag(req.body);

    res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data: tag,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get All Tags
 */
const getAllTags = async (req, res) => {
  try {
    const tags = await tagService.getAllTags();

    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete Tag
 */
const deleteTag = async (req, res) => {
  try {
    await tagService.deleteTag(req.params.id);

    res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createTag,
  getAllTags,
  deleteTag,
};
