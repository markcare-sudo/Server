'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupons', {
      id: { type: Sequelize.BIGINT, allowNull: false, autoIncrement: true, primaryKey: true },
      tenant_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'tenants', key: 'id' }, onDelete: 'CASCADE' },
      code: { type: Sequelize.STRING(50), allowNull: false, unique: true },
      discount_type: { type: Sequelize.ENUM('PERCENTAGE', 'FIXED', 'FREE_DELIVERY'), allowNull: false },
      discount_value: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      max_discount: { type: Sequelize.DECIMAL(10, 2) },
      min_purchase_amount: { type: Sequelize.DECIMAL(10, 2), defaultValue: 0 },
      applicable_to: { type: Sequelize.ENUM('ALL', 'SERVICES', 'PRODUCTS'), defaultValue: 'ALL' },
      max_uses: { type: Sequelize.INTEGER }, // Null implies entirely unlimited dynamically globally 
      current_uses: { type: Sequelize.INTEGER, defaultValue: 0 },
      valid_from: { type: Sequelize.DATEONLY, allowNull: false },
      valid_till: { type: Sequelize.DATEONLY, allowNull: false },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE }
    });

    await queryInterface.addIndex('coupons', ['code'], { unique: true });
    await queryInterface.addIndex('coupons', ['tenant_id', 'is_active']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('coupons');
  }
};
