const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const TechnicianDocument = sequelize.define("TechnicianDocument",
    {
        id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true, },
        technician_id: { type: DataTypes.BIGINT, allowNull: false, },
        document_type: { type: DataTypes.ENUM("aadhaar", "pan", "driving_license", "certificate", "police_verification", "profile_photo", "other"), allowNull: false, },
        document_number: { type: DataTypes.STRING, allowNull: true, },
        document_url: { type: DataTypes.TEXT, allowNull: false, },
        verification_status: { type: DataTypes.ENUM("pending", "approved", "rejected"), allowNull: false, defaultValue: "pending", },
        verified_by: { type: DataTypes.BIGINT, allowNull: true, },
        verified_at: { type: DataTypes.DATE, allowNull: true, },
        expiry_date: { type: DataTypes.DATEONLY, allowNull: true, },
        remarks: { type: DataTypes.TEXT, allowNull: true, },
        is_active: { type: DataTypes.BOOLEAN, defaultValue: true, },
    },
    {
        tableName: "technician_documents",
        timestamps: true,
        underscored: true,
    }
);

module.exports = TechnicianDocument;