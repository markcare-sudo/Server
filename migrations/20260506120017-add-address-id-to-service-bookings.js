module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("service_bookings", "address_id", {
      type: Sequelize.BIGINT,
      allowNull: false, // or true if needed
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("service_bookings", "address_id");
  },
};