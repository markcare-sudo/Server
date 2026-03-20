'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('service_providers', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      tenant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'tenants',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      first_name: {
        type: Sequelize.STRING(100)
      },
      last_name: {
        type: Sequelize.STRING(100)
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      email: {
        type: Sequelize.STRING(100)
      },
      category: {
        type: Sequelize.STRING(100)
      },
      skills: {
        type: Sequelize.TEXT
      },
      certifications: {
        type: Sequelize.TEXT
      },
      experience_years: {
        type: Sequelize.INTEGER
      },
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        defaultValue: 0.00
      },
      total_bookings: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      active_status: {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE', 'BLOCKED'),
        defaultValue: 'INACTIVE'
      },
      verification_status: {
        type: Sequelize.ENUM('PENDING', 'VERIFIED', 'REJECTED'),
        defaultValue: 'PENDING'
      },
      kyc_details: {
        type: Sequelize.JSONB
      },
      bank_account: {
        type: Sequelize.JSONB
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8)
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8)
      },
      service_radius_km: {
        type: Sequelize.INTEGER,
        defaultValue: 10
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

    await queryInterface.addIndex('service_providers', ['tenant_id', 'category']);
    await queryInterface.addIndex('service_providers', ['latitude', 'longitude']);
    await queryInterface.addIndex('service_providers', [{ attribute: 'rating', order: 'DESC' }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('service_providers');
  }
};
