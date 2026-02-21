'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
  await queryInterface.addColumn("blogs", "alt_text", {
    type: Sequelize.STRING,
    allowNull: true,
  });
},

down: async (queryInterface) => {
  await queryInterface.removeColumn("blogs", "alt_text");
},

};
