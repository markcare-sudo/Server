const { Op } = require("sequelize");
const { Product, ProductVariant, ProductImage } = require("./product.model");
const { Brand } = require("../brands/brand.model"); // ✅ FIXED
const ApiError = require("../../../core/errors/ApiError");
const { sequelize } = require("../../../config/db");
const { Category } = require("../categories/category.model");
const { deleteFile } = require("../../../middlewares/upload.middleware");

/**
 * CREATE PRODUCT
 */
async function createProduct(data) {
    const { variants, images, name, ...productData } = data;

    if (!name) throw new ApiError(400, "Product name is required.");

    return await sequelize.transaction(async (t) => {
        const slug = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

        const product = await Product.create(
            { ...productData, name, slug },
            { transaction: t }
        );

        // ✅ VARIANTS
        let createdVariants = [];
        if (variants?.length) {
            createdVariants = await ProductVariant.bulkCreate(
                variants.map(v => ({ ...v, product_id: product.id })),
                { transaction: t, returning: true }
            );
        }

        // ✅ IMAGES
        if (images?.length) {
            const imagePayload = images.map((img, index) => {
                let variant_id = null;

                const match = img.fieldName?.match(/variant_(\d+)_images/);
                if (match && createdVariants[match[1]]) {
                    variant_id = createdVariants[match[1]].id;
                }

                return {
                    url: img.url,
                    product_id: product.id,
                    variant_id,
                    is_primary: img.is_primary && !variant_id,
                    alt_text: name,
                    sort_order: index
                };
            });

            await ProductImage.bulkCreate(imagePayload, { transaction: t });
        }

        return product;
    });
}

/**
 * LIST
 */
async function listProducts(query = {}) {
    const { category_id, brand_id, search, page = 1, limit = 20 } = query;

    const where = { is_active: true };

    if (category_id) where.category_id = category_id;
    if (brand_id) where.brand_id = brand_id;
    if (search) where.name = { [Op.iLike]: `%${search}%` };

    const parsedLimit = parseInt(limit) || 20;
    const offset = (Math.max(1, parseInt(page)) - 1) * parsedLimit;

    const { count, rows } = await Product.findAndCountAll({
        where,
        limit: parsedLimit,
        offset,
        distinct: true,
        attributes: ["id", "name", "slug", "description", "category_id", "brand_id", "is_active", "created_at", "updated_at"],
        include: [
            { model: Category, as: "category", attributes: ["id", "name", "slug"] },
            { model: Brand, as: "brand", attributes: ["id", "name", "image_url"] },
            { model: ProductImage, as: "images", where: { is_primary: true }, required: false },
            { model: ProductVariant, as: "variants", required: false }
        ],
        order: [["created_at", "DESC"]]
    });

    return {
        data: rows,
        pagination: {
            totalItems: count,
            totalPages: Math.ceil(count / parsedLimit),
            currentPage: page
        }
    };
}

/**
 * GET DETAILS
 */
async function getBySlug(slug) {
    const product = await Product.findOne({
        where: { slug, is_active: true },
        include: [
            { model: Category, as: "category", attributes: ["id", "name", "slug"] },
            { model: Brand, as: "brand", attributes: ["id", "name", "image_url"] },
            { model: ProductImage, as: "images" },
            {
                model: ProductVariant,
                as: "variants",
                include: [
                    {
                        model: ProductImage,
                        as: "variant_images",
                        attributes: ["id", "url"]
                    }
                ]
            }
        ],
        order: [[{ model: ProductImage, as: "images" }, "sort_order", "ASC"]]
    });

    if (!product) throw new ApiError(404, "Product not found");

    return product;
}

async function getById(id) {
    const product = await Product.findOne({
        where: { id, is_active: true },
        include: [
            { model: Category, as: "category", attributes: ["id", "name", "slug"] },
            { model: Brand, as: "brand", attributes: ["id", "name", "image_url"] },
            { model: ProductImage, as: "images" },
            {
                model: ProductVariant,
                as: "variants",
                include: [
                    {
                        model: ProductImage,
                        as: "variant_images",
                        attributes: ["id", "url"]
                    }
                ]
            }
        ],
        order: [[{ model: ProductImage, as: "images" }, "sort_order", "ASC"]]
    });

    if (!product) throw new ApiError(404, "Product not found");

    return product;
}

/**
 * UPDATE PRODUCT
 */
async function updateProduct(id, data) {
    const { variants, images, ...productData } = data;

    return await sequelize.transaction(async (t) => {
        const product = await Product.findByPk(id, { transaction: t });
        if (!product) throw new ApiError(404, "Product not found");

        // ✅ SLUG UPDATE
        if (productData.name && productData.name !== product.name) {
            productData.slug = `${productData.name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
        }

        await product.update(productData, { transaction: t });

        // =========================
        // ✅ VARIANTS (FULL REPLACE)
        // =========================
        let createdVariants = [];

        if (variants !== undefined) {
            // 1. Delete all old variants (hard delete)
            await ProductVariant.destroy({
                where: { product_id: id },
                force: true,
                transaction: t
            });

            // 2. Recreate all variants fresh
            if (variants.length) {
                createdVariants = await ProductVariant.bulkCreate(
                    variants.map(v => ({
                        ...v,
                        product_id: id
                    })),
                    { transaction: t, returning: true }
                );
            }
        }

        // =========================
        // ✅ IMAGES (FULL REPLACE)
        // =========================
        if (images !== undefined) {
            // 1. Get old images (for file delete)
            const oldImages = await ProductImage.findAll({
                where: { product_id: id },
                transaction: t
            });

            // 2. Hard delete DB records
            await ProductImage.destroy({
                where: { product_id: id },
                force: true,
                transaction: t
            });

            // 3. Delete physical files
            for (const img of oldImages) {
                if (img.url) {
                    await deleteFile(img.url); // implement based on storage
                }
            }

            // 4. Insert new images
            if (images.length) {
                const imagePayload = images.map((img, index) => {
                    let variant_id = null;

                    // match variant index (since IDs are new now)
                    const match = img.fieldName?.match(/variant_(\d+)_images/);
                    if (match && createdVariants[match[1]]) {
                        variant_id = createdVariants[match[1]].id;
                    }

                    return {
                        url: img.url,
                        product_id: id,
                        variant_id,
                        is_primary: variant_id ? false : (img.is_primary ?? index === 0),
                        alt_text: product.name,
                        sort_order: index
                    };
                });

                await ProductImage.bulkCreate(imagePayload, { transaction: t });
            }
        }

        return product;
    });
}

/**
 * DELETE
 */
async function deleteProduct(id) {
    const product = await Product.findByPk(id);
    if (!product) throw new ApiError(404, "Product not found");

    return await product.destroy();
}

module.exports = {
    createProduct,
    listProducts,
    getBySlug,
    getById,
    updateProduct,
    deleteProduct
};