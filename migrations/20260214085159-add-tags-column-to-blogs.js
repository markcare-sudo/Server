"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("blogs", "tags", {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
      after: "category", // optional (MySQL only)
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn("blogs", "tags");
  },
};
