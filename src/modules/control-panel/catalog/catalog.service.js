const { Op } = require("sequelize");
const { Product, ProductVariant, ProductImage } = require("../products/product.model");
const { Brand } = require("../brands/brand.model");
const { Service, ServiceImage } = require("../service/service.model");
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
        attributes: ["id", "name", "slug", "description", "created_at"],
        include: [
            { model: Category, as: "category", attributes: ["name"] },
            { model: Brand, as: "brand", attributes: ["name"] },
            {
                model: ProductImage,
                as: "images",
                where: { is_primary: true },
                required: false,
                attributes: ["url"]
            },
            {
                model: ProductVariant,
                as: "variants",
                where: { is_default: true },
                required: false,
                attributes: ["price", "discount_price"]
            }
        ]
    });

    // ---------------- SERVICES ----------------
    const services = await Service.findAll({
        where: { is_active: true, ...searchCondition },
        attributes: ["id", "name", "slug", "description", "base_price", "discount_price", "type", "created_at"],
        include: [
            { model: Category, as: "category", attributes: ["name"] },
            {
                model: ServiceImage,
                as: "images",
                attributes: ["image_url"]
            }
        ]
    });

    // ---------------- FORMAT RESPONSE ----------------
    const formattedProducts = products.map(p => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        description: p.description,
        type: "PRODUCT",
        category: p.category?.name,
        brand: p.brand?.name,
        image: p.images?.[0]?.url || null,
        price: p.variants?.[0]?.price || 0,
        discount_price: p.variants?.[0]?.discount_price || null,
        created_at: p.created_at
    }));

    const formattedServices = services.map(s => ({
        id: s.id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        type: "SERVICE",
        category: s.category?.name,
        image: s.images?.[0]?.url || null,
        price: s.base_price,
        discount_price: s.discount_price,
        service_type: s.type,
        created_at: s.created_at
    }));

    // ---------------- MERGE + SORT ----------------
    let combined = [...formattedProducts, ...formattedServices];

    // sort latest first
    combined.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // pagination (manual since merged)
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