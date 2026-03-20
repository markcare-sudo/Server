'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('orders', {
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
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      customer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'RESTRICT', // Orders should persist history
        onUpdate: 'CASCADE'
      },
      order_number: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      subtotal: {
        type: Sequelize.DECIMAL(10, 2)
      },
      discount_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      tax_amount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0
      },
      total_amount: {
        type: Sequelize.DECIMAL(10, 2)
      },
      payment_method: {
        type: Sequelize.STRING(50)
      },
      payment_status: {
        type: Sequelize.ENUM('PENDING', 'COMPLETED', 'FAILED'),
        defaultValue: 'PENDING'
      },
      order_status: {
        type: Sequelize.ENUM('PLACED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURNED'),
        defaultValue: 'PLACED'
      },
      shipping_address: {
        type: Sequelize.JSONB
      },
      delivery_date: {
        type: Sequelize.DATEONLY
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

    await queryInterface.addIndex('orders', ['tenant_id', 'order_status']);
    await queryInterface.addIndex('orders', ['customer_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('orders');
  }
};
