'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_provider_availability', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      service_provider_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'service_providers',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      day_of_week: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      start_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      end_time: {
        type: Sequelize.TIME,
        allowNull: false
      },
      break_start: {
        type: Sequelize.TIME
      },
      break_end: {
        type: Sequelize.TIME
      },
      is_available: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });

    await queryInterface.addIndex('service_provider_availability', ['service_provider_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('service_provider_availability');
  }
};
