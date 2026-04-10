const { Op } = require("sequelize");
const { Brand } = require("./brand.model");
const { Product } = require("../products/product.model");
const ApiError = require("../../../core/errors/ApiError");

/**
 * Create a new Brand
 */
async function createBrand(data) {
    const { name } = data;

    const existing = await Brand.findOne({ where: { name } });
    if (existing) throw new ApiError(400, "Brand name already exists");

    const slug = name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    return Brand.create({ ...data, slug });
}

/**
 * List Brands with search and pagination
 */
async function listBrands(query = {}) {
    const { search, is_active, page = 1, limit = 20 } = query;
    const where = {};

    if (is_active !== undefined) where.is_active = is_active === "true";

    if (search?.trim()) {
        where[Op.or] = [
            { name: { [Op.iLike]: `%${search.trim()}%` } },
            { description: { [Op.iLike]: `%${search.trim()}%` } },
        ];
    }

    const parsedLimit = parseInt(limit, 10) || 20;
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parsedLimit;

    const { count, rows } = await Brand.findAndCountAll({
        where,
        attributes: ["id", "name", "slug", "image_url", "description", "is_active", "created_at", "updated_at"],
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
 * Update Brand
 */
async function updateBrand(id, data) {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new ApiError(404, "Brand not found");

    if (data.name) {
        data.slug = data.name.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    }

    return brand.update(data);
}

/**
 * Delete Brand (Safety Check included)
 */
async function deleteBrand(id) {
    const brand = await Brand.findByPk(id);
    if (!brand) throw new ApiError(404, "Brand not found");

    // Prevent deletion if products are linked to this brand
    const productCount = await Product.count({ where: { brand_id: id } });
    if (productCount > 0) {
        throw new ApiError(400, `Cannot delete brand: ${productCount} products are currently linked to it.`);
    }

    return brand.destroy();
}

module.exports = { createBrand, listBrands, updateBrand, deleteBrand };