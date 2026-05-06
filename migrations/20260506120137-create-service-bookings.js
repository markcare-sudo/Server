module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("service_bookings", {
      id: {
        type: Sequelize.BIGINT,
        autoIncrement: true,
        primaryKey: true
      },

      service_id: { type: Sequelize.BIGINT, allowNull: false },
      user_id: { type: Sequelize.BIGINT, allowNull: false },
      address_id: { type: Sequelize.BIGINT, allowNull: false },

      booking_code: { type: Sequelize.STRING(50), unique: true },

      payment_method: {
        type: Sequelize.ENUM("ONLINE", "COD")
      },

      payment_status: {
        type: Sequelize.ENUM("PENDING", "PAID", "FAILED", "UNPAID"),
        defaultValue: "UNPAID"
      },

      transaction_id: { type: Sequelize.STRING },

      status: {
        type: Sequelize.ENUM(
          "PENDING",
          "CONFIRMED",
          "ASSIGNED",
          "IN_PROGRESS",
          "COMPLETED",
          "CANCELLED"
        ),
        defaultValue: "PENDING"
      },

      scheduled_date: { type: Sequelize.DATEONLY, allowNull: false },
      time_slot: { type: Sequelize.STRING },

      technician_id: { type: Sequelize.BIGINT },

      asset_info: { type: Sequelize.JSONB },

      started_at: { type: Sequelize.DATE },
      completed_at: { type: Sequelize.DATE },

      completion_otp: { type: Sequelize.STRING(6) },
      technician_notes: { type: Sequelize.TEXT },

      created_at: { type: Sequelize.DATE },
      updated_at: { type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("service_bookings");
  }
};