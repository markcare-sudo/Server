'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('payments', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      tenant_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'tenants', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      user_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      reference_type: {
        type: Sequelize.ENUM('BOOKING', 'ORDER'),
        allowNull: false
      },
      reference_id: {
        type: Sequelize.BIGINT,
        allowNull: false
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      currency: {
        type: Sequelize.STRING(3),
        defaultValue: 'INR'
      },
      payment_method: {
        type: Sequelize.STRING(50)
      },
      provider_transaction_id: {
        type: Sequelize.STRING(100)
      },
      status: {
        type: Sequelize.ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED'),
        defaultValue: 'PENDING'
      },
      metadata: {
        type: Sequelize.JSONB
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

    await queryInterface.addIndex('payments', ['tenant_id', 'status']);
    await queryInterface.addIndex('payments', ['user_id']);
    await queryInterface.addIndex('payments', ['reference_type', 'reference_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('payments');
  }
};
