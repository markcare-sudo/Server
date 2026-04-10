const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const OtpRequest = sequelize.define(
  "otp_requests",
  {
    id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },

    // Nullable before user/tenant creation
    tenant_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },
    user_id: { type: DataTypes.BIGINT.UNSIGNED, allowNull: true },

    // EMAIL | SMS
    channel: { type: DataTypes.ENUM("EMAIL", "SMS"), allowNull: false },

    // where OTP sent
    destination: { type: DataTypes.STRING(150), allowNull: false },

    // LOGIN | SIGNUP_EMAIL | SIGNUP_PHONE | RESET_PASSWORD
    purpose: { type: DataTypes.STRING(50), allowNull: false },

    // bcrypt hash of OTP
    otp_hash: { type: DataTypes.STRING(255), allowNull: false },

    expires_at: { type: DataTypes.DATE, allowNull: false },
    consumed_at: { type: DataTypes.DATE, allowNull: true },

    attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },

    // ⭐ Temporary signup data
    meta: { type: DataTypes.JSON, allowNull: true },
  },
  {
    tableName: "otp_requests",
    timestamps: true,
    underscored: true,

    indexes: [
      { fields: ["destination"] },
      { fields: ["user_id"] },
      { fields: ["tenant_id"] },
      { fields: ["purpose"] },
      { fields: ["expires_at"] },
      { fields: ["consumed_at"] },

      // rate-limit index
      {
        fields: ["destination", "channel", "created_at"],
        name: "idx_otp_rate_limit",
      },
    ],
  }
);

module.exports = OtpRequest;
