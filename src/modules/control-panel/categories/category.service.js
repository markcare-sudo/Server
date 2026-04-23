const { Op } = require("sequelize");
// const { Category } = require("./keyword.model");
const ApiError = require("../../../core/errors/ApiError");
const { Category } = require("./category.model");

/**
 * Create a new category
 */
async function createCategory(data) {
    const { name, parent_id } = data;

    // Check if category name already exists
    const existing = await Category.findOne({ where: { name } });
    if (existing) throw new ApiError(400, "Category name already exists");

    // Basic slugification (can be improved with a library like 'slugify')
    const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    return Category.create({ ...data, slug });
}

/**
 * List categories with nesting and filters
 */
async function listCategories(query = {}) {
    const { search, is_active, parent_id, page = 1, limit = 20 } = query;
    const where = {};

    if (is_active !== undefined) where.is_active = is_active === "true";
    if (parent_id) where.parent_id = parent_id === "null" ? null : parent_id;

    if (search?.trim()) {
        where[Op.or] = [
            { name: { [Op.iLike]: `%${search.trim()}%` } },
            { description: { [Op.iLike]: `%${search.trim()}%` } },
        ];
    }

    const parsedLimit = parseInt(limit, 10) || 20;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parsedLimit;

    const { count, rows } = await Category.findAndCountAll({
        where,
        attributes: ["id", "name", "slug", "parent_id", "description", "is_active", "created_at", "updated_at"],
        order: [["name", "ASC"]],
        limit: parsedLimit,
        offset,
    });

    return {
        data: rows,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / parsedLimit),
            currentPage: parseInt(page, 10),
            limit: parsedLimit,
        },
    };
}

/**
 * Get category by ID
 */
async function getCategoryById(id) {
    const category = await Category.findByPk(id);
    if (!category) throw new ApiError(404, "Category not found");
    return category;
}

/**
 * Update Category
 */
async function updateCategory(id, data) {
    const category = await Category.findByPk(id);
    if (!category) throw new ApiError(404, "Category not found");

    if (data.name) {
        data.slug = data.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    }

    return category.update(data);
}

/**
 * Delete Category
 */
async function deleteCategory(id) {
    const category = await Category.findByPk(id);
    if (!category) throw new ApiError(404, "Category not found");

    // Check if it has children before deleting
    const hasChildren = await Category.findOne({ where: { parent_id: id } });
    if (hasChildren) throw new ApiError(400, "Cannot delete category with sub-categories");

    return category.destroy();
}

module.exports = { createCategory, listCategories, getCategoryById, updateCategory, deleteCategory };