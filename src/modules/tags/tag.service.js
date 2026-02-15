const { Tag } = require("./tag.model");
const { Op } = require("sequelize");

/**
 * Create Tag
 */
const createTag = async (data) => {
  const { name } = data;

  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const existing = await Tag.findOne({
    where: {
      [Op.or]: [{ name }, { slug }],
    },
  });

  if (existing) {
    throw new Error("Tag already exists");
  }

  return await Tag.create({ name, slug });
};

/**
 * Get All Tags
 */
const getAllTags = async () => {
  return await Tag.findAll({
    where: { is_active: true },
    order: [["created_at", "DESC"]],
  });
};

/**
 * Delete Tag (Soft Delete)
 */
const deleteTag = async (id) => {
  const tag = await Tag.findByPk(id);
  if (!tag) throw new Error("Tag not found");

  return await tag.destroy();
};

module.exports = {
  createTag,
  getAllTags,
  deleteTag,
};
