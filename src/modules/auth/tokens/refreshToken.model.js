const { DataTypes } = require("sequelize");
const { sequelize } = require("../../../config/db");

const RefreshToken = sequelize.define(
  "refresh_tokens",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },

    user_id: { type: DataTypes.BIGINT, allowNull: false },

    token_hash: { type: DataTypes.STRING(255), allowNull: false },

    expires_at: { type: DataTypes.DATE, allowNull: false },
    revoked_at: { type: DataTypes.DATE, allowNull: true },

    ip_address: { type: DataTypes.STRING(45), allowNull: true },
    user_agent: { type: DataTypes.STRING(255), allowNull: true },
  },
  {
    tableName: "refresh_tokens",
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["expires_at"] },
      { fields: ["revoked_at"] },
    ],
  }
);

module.exports = RefreshToken;
