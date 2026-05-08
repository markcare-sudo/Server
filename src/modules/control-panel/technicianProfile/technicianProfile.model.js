const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const TechnicianProfile = sequelize.define("TechnicianProfile", {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false, unique: true },

    bio: { type: DataTypes.TEXT, allowNull: true, },
    skills: { type: DataTypes.JSONB, defaultValue: [] },
    experience_years: { type: DataTypes.INTEGER, defaultValue: 0 },
    service_area: { type: DataTypes.JSONB, defaultValue: [] },
    rating: { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
    total_jobs: { type: DataTypes.INTEGER, defaultValue: 0 },
    is_verified: { type: DataTypes.BOOLEAN, defaultValue: false },
    is_available: { type: DataTypes.BOOLEAN, defaultValue: true },
    current_lat: { type: DataTypes.DECIMAL(10, 8) },
    current_lng: { type: DataTypes.DECIMAL(11, 8) },
    status: { type: DataTypes.ENUM("PENDING", "ACTIVE", "INACTIVE", "BLOCKED"), defaultValue: "PENDING" }

}, {
    tableName: "technician_profiles",
    timestamps: true,
    underscored: true,
    paranoid: true
});

module.exports = TechnicianProfile;