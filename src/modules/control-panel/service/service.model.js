const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

/**
 * SERVICE: The core Labor-based offering
 */
const Service = sequelize.define("Service", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

    category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },

    type: { type: DataTypes.ENUM("ONE_TIME", "SUBSCRIPTION", "AMC", "CMC", "OM"), defaultValue: "ONE_TIME" },
    estimated_duration_mins: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60, validate: { min: 1, max: 1440 } },
    base_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { isDecimal: true, min: 0 } },
    discount_price: { type: DataTypes.DECIMAL(12, 2), validate: { isDecimal: true, min: 0 } },
    required_skill_level: { type: DataTypes.ENUM("BASIC", "INTERMEDIATE", "EXPERT"), defaultValue: "BASIC" },
    is_spares_included: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    meta_data: { type: DataTypes.JSONB, defaultValue: {} }

}, {
    tableName: "services",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
        { unique: true, fields: ["slug"] },
        { fields: ["type"] }
    ]
});

/**
 * SERVICE BENEFITS
 */
const ServiceBenefit = sequelize.define("ServiceBenefit", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    benefit_text: { type: DataTypes.STRING(255), allowNull: false },
    is_included: { type: DataTypes.BOOLEAN, defaultValue: true }

}, {
    tableName: "service_benefits",
    timestamps: false,
    underscored: true,
    paranoid: true
});

/**
 * MAINTENANCE SCHEDULE
 */
const MaintenanceSchedule = sequelize.define("MaintenanceSchedule", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    total_visits: { type: DataTypes.INTEGER, defaultValue: 1 },
    frequency_months: { type: DataTypes.INTEGER, defaultValue: 0 },
    contract_duration_months: { type: DataTypes.INTEGER, defaultValue: 12 }

}, {
    tableName: "maintenance_schedules",
    timestamps: true,
    underscored: true,
    paranoid: true
});

/**
 * SERVICE IMAGES (NEW)
 */
const ServiceImage = sequelize.define("ServiceImage", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    image_url: { type: DataTypes.STRING(500), allowNull: false },
    is_primary: { type: DataTypes.BOOLEAN, defaultValue: false },
    sort_order: { type: DataTypes.INTEGER, defaultValue: 0 }

}, {
    tableName: "service_images",
    timestamps: true,
    underscored: true,
    paranoid: true
});


// =====================
// 🔗 ASSOCIATIONS
// =====================

// Service ↔ Benefits
Service.hasMany(ServiceBenefit, { as: "benefits", foreignKey: "service_id", onDelete: "CASCADE" });
ServiceBenefit.belongsTo(Service, { foreignKey: "service_id" });

// Service ↔ Maintenance
Service.hasOne(MaintenanceSchedule, { as: "schedule", foreignKey: "service_id", onDelete: "CASCADE" });
MaintenanceSchedule.belongsTo(Service, { foreignKey: "service_id" });

// Service ↔ Images ✅
Service.hasMany(ServiceImage, { as: "images", foreignKey: "service_id", onDelete: "CASCADE" });
ServiceImage.belongsTo(Service, { foreignKey: "service_id" });


// =====================
// 📦 EXPORT
// =====================

module.exports = {
    Service,
    ServiceBenefit,
    MaintenanceSchedule,
    ServiceImage
};