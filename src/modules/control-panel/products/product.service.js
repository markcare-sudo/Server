const { Op } = require("sequelize");
const { Product, ProductVariant, ProductImage } = require("./product.model");
const { Category } = require("../../keywords/keyword.model");
const ApiError = require("../../../core/errors/ApiError");
const { sequelize } = require("../../../config/db");

/**
 * Create Product with optional initial variants (Atomic Transaction)
 */
async function createProduct(data) {
    const { variants, images, name, ...productData } = data;

    if (!name) throw new ApiError(400, "Product name is required.");

    return await sequelize.transaction(async (t) => {
        const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
        const product = await Product.create({ ...productData, name, slug }, { transaction: t });

        // 1. Create Variants
        let createdVariants = [];
        if (variants?.length) {
            createdVariants = await ProductVariant.bulkCreate(
                variants.map(v => ({ ...v, product_id: product.id })),
                { transaction: t, returning: true } // returning: true gives us the new IDs
            );
        }

        // 2. Link Images (Global vs Variant Specific)
        if (images?.length) {
            const imagePayload = images.map(img => {
                let variant_id = null;

                // If fieldName is 'variant_0_images', match it to createdVariants[0].id
                const match = img.fieldName?.match(/variant_(\d+)_images/);
                if (match && createdVariants[match[1]]) {
                    variant_id = createdVariants[match[1]].id;
                }

                return {
                    url: img.url,
                    product_id: product.id,
                    variant_id: variant_id,
                    is_primary: img.is_primary || false,
                    alt_text: img.alt_text || name
                };
            });

            await ProductImage.bulkCreate(imagePayload, { transaction: t });
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

    return { data: rows, pagination: { totalItems: count, totalPages: Math.ceil(count / parsedLimit), currentPage: page } };
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

        // Sync Slug
        if (productData.name && productData.name !== product.name) {
            productData.slug = `${productData.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
        }
        await product.update(productData, { transaction: t });

        // Sync Variants
        if (variants) {
            const incomingIds = variants.map(v => v.id).filter(Boolean);
            await ProductVariant.destroy({
                where: { product_id: id, id: { [Op.notIn]: incomingIds } },
                transaction: t
            });

            for (const v of variants) {
                if (v.id) {
                    await ProductVariant.update(v, { where: { id: v.id, product_id: id }, transaction: t });
                } else {
                    await ProductVariant.create({ ...v, product_id: id }, { transaction: t });
                }
            }
        }

        // Handle New Images
        if (images?.length) {
            // Note: Update logic for variant-specific images follows same pattern as create
            await ProductImage.bulkCreate(
                images.map(img => ({ ...img, product_id: id })),
                { transaction: t }
            );
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