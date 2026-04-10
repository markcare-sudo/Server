const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

/**
 * SERVICE: The core Labor-based offering (e.g., "AC Deep Cleaning", "RO Installation")
 */
const Service = sequelize.define("Service", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    category_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    name: { type: DataTypes.STRING(255), allowNull: false },
    slug: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    description: { type: DataTypes.TEXT },

    // Distinguishes between a one-time repair and a subscription
    type: {
        type: DataTypes.ENUM("ONE_TIME", "SUBSCRIPTION", "AMC", "CMC", "OM"),
        defaultValue: "ONE_TIME"
    },

    // Estimated time for the technician to complete the job
    estimated_duration_mins: { type: DataTypes.INTEGER, defaultValue: 60 },

    // Pricing logic
    base_price: { type: DataTypes.DECIMAL(12, 2), allowNull: false, validate: { isDecimal: true, min: 0 } },
    discount_price: { type: DataTypes.DECIMAL(12, 2) },

    // Requirements for the Assignment Engine
    required_skill_level: { type: DataTypes.ENUM("BASIC", "INTERMEDIATE", "EXPERT"), defaultValue: "BASIC" },

    estimated_duration_mins: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 60,
        validate: { min: 1, max: 1440 } // Max 1 day
    },

    // Does this service include spare parts for free? (True for CMC)
    is_spares_included: { type: DataTypes.BOOLEAN, defaultValue: false },

    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },

    // Metadata for SEO or UI display
    meta_data: { type: DataTypes.JSONB, defaultValue: {} }
}, {
    tableName: "services",
    timestamps: true,
    underscored: true,
    paranoid: true, // <--- Soft Delete
    indexes: [
        { unique: true, fields: ['slug'] },
        { fields: ['type'] }
    ]
});

/**
 * SERVICE_BENEFIT: Bullet points of what is covered (for the UI Checklist)
 */
const ServiceBenefit = sequelize.define("ServiceBenefit", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },
    benefit_text: { type: DataTypes.STRING(255), allowNull: false }, // e.g., "Filter Cleaning"
    is_included: { type: DataTypes.BOOLEAN, defaultValue: true } // Can show "Included" vs "Excluded"
}, {
    tableName: "service_benefits",
    timestamps: false,
    underscored: true,
    paranoid: true, // <--- Soft Delete
});

/**
 * MAINTENANCE_SCHEDULE: If type is AMC/CMC/OM, define the visit frequency
 */
const MaintenanceSchedule = sequelize.define("MaintenanceSchedule", {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
    service_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: false },

    total_visits: { type: DataTypes.INTEGER, defaultValue: 1 }, // e.g., 4 visits for 1 year
    frequency_months: { type: DataTypes.INTEGER, defaultValue: 0 }, // e.g., Every 3 months
    contract_duration_months: { type: DataTypes.INTEGER, defaultValue: 12 }
}, {
    tableName: "maintenance_schedules",
    timestamps: true,
    underscored: true,
    paranoid: true, // <--- Soft Delete
});

// --- ASSOCIATIONS ---

// Service <-> Benefits (The UI Checklist)
Service.hasMany(ServiceBenefit, { as: "benefits", foreignKey: "service_id", onDelete: 'CASCADE' });
ServiceBenefit.belongsTo(Service, { foreignKey: "service_id" });

// Service <-> Maintenance (For Subscriptions/AMC)
Service.hasOne(MaintenanceSchedule, { as: "schedule", foreignKey: "service_id", onDelete: 'CASCADE' });
MaintenanceSchedule.belongsTo(Service, { foreignKey: "service_id" });

module.exports = { Service, ServiceBenefit, MaintenanceSchedule };