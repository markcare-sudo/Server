const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");
const { Brand } = require("../brands/brand.model");

/**
 * PRODUCT: The "Parent" (The Base Catalog Entry)
 */
const Product = sequelize.define("Product", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    category_id: { type: DataTypes.BIGINT, allowNull: false },

    // BRAND LINK: Replaces the 'brand' string for consistency and filtering
    brand_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        references: { model: 'brands', key: 'id' }
    },

    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },

    // Flexible specs (e.g., Material, Country of Origin)
    common_specifications: { type: DataTypes.JSONB, defaultValue: {} },

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    tableName: "products",
    timestamps: true,
    underscored: true,
    indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['category_id'] },
        { fields: ['brand_id'] },
        { fields: ['is_active'] }
    ]
});

/**
 * PRODUCT_VARIANT: The "Child" (Specific Inventory Units)
 */
const ProductVariant = sequelize.define("ProductVariant", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    sku: { type: DataTypes.STRING(100), unique: true },

    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { min: 0.0 } },
    discount_price: { type: DataTypes.DECIMAL(12, 2), validate: { min: 0.0 } },
    stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },

    // Variant specs (e.g., {"color": "Red", "size": "XL", "voltage": "440V"})
    variant_specifications: { type: DataTypes.JSONB, defaultValue: {} },

    is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
    // NOTE: 'images' JSONB removed here. We use the ProductImage table instead.
}, {
    tableName: "product_variants",
    timestamps: true,
    underscored: true,
    paranoid: true, // <--- Soft Delete
});

/**
 * PRODUCT_IMAGE: Separate table for SEO and Variant-specific galleries
 */
const ProductImage = sequelize.define("ProductImage", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT, allowNull: false },
    variant_id: { type: DataTypes.BIGINT, allowNull: true }, // Links image to a specific color/model

    url: { type: DataTypes.STRING(255), allowNull: false },
    alt_text: { type: DataTypes.STRING(150), allowNull: true },
    is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, {
    tableName: "product_images",
    timestamps: true,
    underscored: true,
    paranoid: true, // <--- Soft Delete
});

module.exports = { Product, ProductVariant, ProductImage };