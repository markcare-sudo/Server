const { Op } = require("sequelize");
const { Product, ProductVariant, ProductImage } = require("../products/product.model");
const { Brand } = require("../brands/brand.model");
const { Service, ServiceImage, ServiceBenefit, MaintenanceSchedule } = require("../service/service.model");
const { Category } = require("../categories/category.model");

/**
 * UNIVERSAL CATALOG (Products + Services)
 */
async function getCatalog(query = {}) {
    const { search, page = 1, limit = 20 } = query;

    const parsedLimit = parseInt(limit) || 20;
    const offset = (Math.max(1, parseInt(page)) - 1) * parsedLimit;

    const searchCondition = search
        ? { name: { [Op.iLike]: `%${search}%` } }
        : {};

    // ---------------- PRODUCTS ----------------
    const products = await Product.findAll({
        where: { is_active: true, ...searchCondition },
        include: [
            { model: Category, as: "category" },
            { model: Brand, as: "brand" },
            {
                model: ProductImage,
                as: "images",
                attributes: ["id", "url", "is_primary", "sort_order"]
            },
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
        order: [["created_at", "DESC"]]
    });

    // ---------------- SERVICES ----------------
    const services = await Service.findAll({
        where: { is_active: true, ...searchCondition },
        include: [
            { model: Category, as: "category" },
            { model: ServiceBenefit, as: "benefits" },
            { model: MaintenanceSchedule, as: "schedule" },
            {
                model: ServiceImage,
                as: "images",
                attributes: ["id", "image_url", "is_primary"]
            }
        ],
        order: [["created_at", "DESC"]]
    });

    // ---------------- FORMAT PRODUCTS ----------------
    const formattedProducts = products.map(p => ({
        id: p.id,
        type: "PRODUCT",

        name: p.name,
        slug: p.slug,
        description: p.description,

        category: p.category,
        brand: p.brand,

        specifications: p.common_specifications,

        images: p.images,
        variants: p.variants,

        // quick access fields
        price: p.variants?.find(v => v.is_default)?.price || 0,
        discount_price: p.variants?.find(v => v.is_default)?.discount_price || null,

        created_at: p.created_at
    }));

    // ---------------- FORMAT SERVICES ----------------
    const formattedServices = services.map(s => ({
        id: s.id,
        type: "SERVICE",

        name: s.name,
        slug: s.slug,
        description: s.description,

        category: s.category,

        service_type: s.type,
        duration: s.estimated_duration_mins,
        skill_level: s.required_skill_level,

        price: s.base_price,
        discount_price: s.discount_price,

        is_spares_included: s.is_spares_included,

        benefits: s.benefits,
        schedule: s.schedule,

        images: s.images,

        meta_data: s.meta_data,

        created_at: s.created_at
    }));

    // ---------------- MERGE ----------------
    let combined = [...formattedProducts, ...formattedServices];

    // ---------------- SORT ----------------
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // ---------------- PAGINATION ----------------
    const paginated = combined.slice(offset, offset + parsedLimit);

    return {
        data: paginated,
        pagination: {
            totalItems: combined.length,
            totalPages: Math.ceil(combined.length / parsedLimit),
            currentPage: page
        }
    };
}

module.exports = { getCatalog };