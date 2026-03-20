'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.BIGINT
      },
      tenant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      service_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      service_variant_id: {
        type: Sequelize.BIGINT,
        references: { model: 'service_variants', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      service_provider_id: {
        type: Sequelize.BIGINT,
        references: { model: 'service_providers', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      booking_datetime: {
        type: Sequelize.DATE,
        allowNull: false
      },
      service_address: {
        type: Sequelize.TEXT
      },
      service_latitude: {
        type: Sequelize.DECIMAL(10, 8)
      },
      service_longitude: {
        type: Sequelize.DECIMAL(11, 8)
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
        defaultValue: 'PENDING'
      },
      base_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      final_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      payment_method: {
        type: Sequelize.STRING(50)
      },
      payment_status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'),
        defaultValue: 'PENDING'
      },
      cancellation_reason: {
        type: Sequelize.STRING(500)
      },
      cancelled_by: {
        type: Sequelize.ENUM('CUSTOMER', 'PROFESSIONAL', 'ADMIN')
      },
      refund_amount: {
        type: Sequelize.DECIMAL(10, 2)
      },
      notes: {
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('bookings', ['tenant_id', 'status']);
    await queryInterface.addIndex('bookings', ['customer_id']);
    await queryInterface.addIndex('bookings', ['service_provider_id']);
    await queryInterface.addIndex('bookings', ['booking_datetime']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('bookings');
  }
};
