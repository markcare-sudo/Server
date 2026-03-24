const { Op } = require("sequelize");
const { Product, ProductVariant, ProductImage } = require("./product.model");
const { Category } = require("../../keywords/keyword.model");
const ApiError = require("../../../core/errors/ApiError");
const { sequelize } = require("../../../config/db");

/**
 * Create Product with optional initial variants (Atomic Transaction)
 */
async function createProduct(data) {
    const { variants, images, ...productData } = data;
    return await sequelize.transaction(async (t) => {
        const slug = `${productData.name.toLowerCase().replace(/ /g, "-")}-${Date.now()}`;
        const product = await Product.create({ ...productData, slug }, { transaction: t });

        if (variants?.length) {
            await ProductVariant.bulkCreate(variants.map(v => ({ ...v, product_id: product.id })), { transaction: t });
        }
        if (images?.length) {
            await ProductImage.bulkCreate(images.map(i => ({ ...i, product_id: product.id })), { transaction: t });
        }
        return product;
    });
}

/**
 * List Products with their default variants and category info
 */
async function listProducts(query = {}) {
    const { category_id, brand_id, type, search, page = 1, limit = 20 } = query;
    const where = { is_active: true };

    if (category_id) where.category_id = category_id;
    if (brand_id) where.brand_id = brand_id;
    if (type) where.type = type;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const parsedLimit = parseInt(limit) || 20;
    const offset = (Math.max(1, parseInt(page)) - 1) * parsedLimit;

    const { count, rows } = await Product.findAndCountAll({
        where, limit: parsedLimit, offset, distinct: true,
        include: [
            { model: ProductImage, as: "images", where: { is_primary: true }, required: false },
            { model: ProductVariant, as: "variants", where: { is_default: true }, required: false }
        ],
        order: [["created_at", "DESC"]]
    });

    return { rows, pagination: { totalItems: count, totalPages: Math.ceil(count / parsedLimit), currentPage: page } };
}

/**
 * Get single product by slug (The Product Detail Page)
 */
/**
 * Get single product by slug (The Product Detail Page)
 * Fetches everything: Category, Brand, Global Images, and Variants with their own Images.
 */
async function getBySlug(slug) {
    const product = await Product.findOne({
        where: {
            slug,
            is_active: true
        },
        include: [
            // 1. Fetch the Category (for breadcrumbs)
            {
                model: Category,
                as: "category",
                attributes: ["id", "name", "slug"]
            },
            // 2. Fetch the Brand (for logo and brand name)
            {
                model: Brand,
                as: "brand",
                attributes: ["id", "name", "logo_url", "slug"]
            },
            // 3. Fetch General Product Images (Overall gallery)
            {
                model: ProductImage,
                as: "images",
                attributes: ["id", "url", "alt_text", "is_primary", "sort_order"]
            },
            // 4. Fetch Variants AND their specific images
            {
                model: ProductVariant,
                as: "variants",
                include: [
                    {
                        model: ProductImage,
                        as: "variant_images", // This was defined in your associations
                        attributes: ["id", "url", "alt_text"]
                    }
                ]
            }
        ],
        // Sort general images so the primary one is first
        order: [
            [{ model: ProductImage, as: 'images' }, 'sort_order', 'ASC']
        ]
    });

    if (!product) {
        throw new ApiError(404, "Product not found");
    }

    return product;
}

/**
 * Update Product and Sync Variants
 */
async function updateProduct(id, data) {
    const { variants, images, ...productData } = data;
    return await sequelize.transaction(async (t) => {
        const product = await Product.findByPk(id, { transaction: t });
        if (!product) throw new ApiError(404, "Product not found");

        await product.update(productData, { transaction: t });

        if (variants) {
            const variantIds = variants.map(v => v.id).filter(Boolean);
            await ProductVariant.destroy({ where: { product_id: id, id: { [Op.notIn]: variantIds } }, transaction: t });
            for (const v of variants) {
                if (v.id) await ProductVariant.update(v, { where: { id: v.id }, transaction: t });
                else await ProductVariant.create({ ...v, product_id: id }, { transaction: t });
            }
        }
        return product;
    });
}

async function deleteProduct(id) {
    const product = await Product.findByPk(id);
    if (!product) throw new ApiError(404, "Product not found");
    return await product.destroy(); // Soft delete due to 'paranoid: true'
}

module.exports = { createProduct, listProducts, getBySlug, updateProduct, deleteProduct };