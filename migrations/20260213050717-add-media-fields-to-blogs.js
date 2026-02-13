"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("blogs", "featured_media", {
      type: Sequelize.STRING,
      allowNull: true,
    });

    await queryInterface.addColumn("blogs", "media_type", {
      type: Sequelize.STRING,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("blogs", "featured_media");
    await queryInterface.removeColumn("blogs", "media_type");
  },
};
