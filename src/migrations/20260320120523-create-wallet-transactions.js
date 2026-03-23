'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('wallet_transactions', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      wallet_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'wallets', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      amount: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      type: {
        type: Sequelize.ENUM('CREDIT', 'DEBIT')
      },
      reference_id: {
        type: Sequelize.BIGINT
      },
      description: {
        type: Sequelize.STRING(200)
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.fn('NOW')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('wallet_transactions');
  }
};
