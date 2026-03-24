const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");
const { Brand } = require("../brands/brand.model");

/**
 * PRODUCT: The "Parent" (The Base Catalog Entry)
 */
const Product = sequelize.define("Product", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    // BRAND LINK: Replaces the 'brand' string for consistency and filtering
    brand_id: {
        type: DataTypes.BIGINT.UNSIGNED,
        allowNull: true,
        references: { model: 'brands', key: 'id' }
    },

    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },
    type: { type: DataTypes.ENUM("PRODUCT", "SERVICE"), defaultValue: "PRODUCT" },

    // Flexible specs (e.g., Material, Country of Origin)
    common_specifications: { type: DataTypes.JSONB, defaultValue: {} },

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: "products", timestamps: true, underscored: true });

/**
 * PRODUCT_VARIANT: The "Child" (Specific Inventory Units)
 */
const ProductVariant = sequelize.define("ProductVariant", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    sku: { type: DataTypes.STRING(100), unique: true },

    price: { type: DataTypes.DECIMAL(12, 2), allowNull: false },
    discount_price: { type: DataTypes.DECIMAL(12, 2) },
    stock_quantity: { type: DataTypes.INTEGER, defaultValue: 0 },

    // Variant specs (e.g., {"color": "Red", "size": "XL", "voltage": "440V"})
    variant_specifications: { type: DataTypes.JSONB, defaultValue: {} },

    is_default: { type: DataTypes.BOOLEAN, defaultValue: false }
    // NOTE: 'images' JSONB removed here. We use the ProductImage table instead.
}, { tableName: "product_variants", timestamps: true, underscored: true });

/**
 * PRODUCT_IMAGE: Separate table for SEO and Variant-specific galleries
 */
const ProductImage = sequelize.define("ProductImage", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    product_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    variant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true }, // Links image to a specific color/model

    url: { type: DataTypes.STRING(255), allowNull: false },
    alt_text: { type: DataTypes.STRING(150), allowNull: true },
    is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { tableName: "product_images", timestamps: true, underscored: true });

// --- ASSOCIATIONS ---

// Product <-> Brand
Brand.hasMany(Product, { foreignKey: "brand_id", as: "products" });
Product.belongsTo(Brand, { foreignKey: "brand_id", as: "brand" });

// Product <-> Variants
Product.hasMany(ProductVariant, { as: "variants", foreignKey: "product_id", onDelete: 'CASCADE' });
ProductVariant.belongsTo(Product, { foreignKey: "product_id" });

// Product/Variant <-> Images
Product.hasMany(ProductImage, { as: "images", foreignKey: "product_id", onDelete: 'CASCADE' });
ProductVariant.hasMany(ProductImage, { as: "variant_images", foreignKey: "variant_id", onDelete: 'CASCADE' });
ProductImage.belongsTo(Product, { foreignKey: "product_id" });

module.exports = { Product, ProductVariant, ProductImage };