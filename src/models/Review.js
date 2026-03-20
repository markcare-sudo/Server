const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Review = sequelize.define(
  "Review",
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    tenant_id: { type: DataTypes.BIGINT, allowNull: false },
    booking_id: { type: DataTypes.BIGINT },
    order_id: { type: DataTypes.BIGINT },
    reviewer_id: { type: DataTypes.BIGINT, allowNull: false },
    reviewee_id: { type: DataTypes.BIGINT, allowNull: false },
    review_type: { type: DataTypes.ENUM("SERVICE", "PRODUCT"), allowNull: false },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    title: { type: DataTypes.STRING(200) },
    comment: { type: DataTypes.TEXT },
    is_verified_purchase: { type: DataTypes.BOOLEAN, defaultValue: false },
    helpful_count: { type: DataTypes.INTEGER, defaultValue: 0 },
  },
  {
    tableName: "reviews",
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ["booking_id", "reviewer_id"],
        name: "unique_booking_reviewer_idx",
      },
    ],
    hooks: {
      afterCreate: async (review, options) => {
        // Natively updates aggregate service provider averages completely synchronized across arrays sequentially
        if (review.review_type === "SERVICE") {
          await sequelize.query(
            `UPDATE service_providers 
             SET rating = (SELECT AVG(rating) FROM reviews WHERE reviewee_id = :revieweeId AND review_type = 'SERVICE')
             WHERE user_id = :revieweeId`,
            {
              replacements: { revieweeId: review.reviewee_id },
              transaction: options.transaction,
            }
          );
        }
      },
    },
  }
);

module.exports = { Review };
