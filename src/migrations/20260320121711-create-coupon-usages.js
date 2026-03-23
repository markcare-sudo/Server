'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('coupon_usages', {
      id: { type: Sequelize.BIGINT, allowNull: false, autoIncrement: true, primaryKey: true },
      coupon_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'coupons', key: 'id' }, onDelete: 'CASCADE' },
      user_id: { type: Sequelize.BIGINT, allowNull: false, references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      order_id: { type: Sequelize.BIGINT, references: { model: 'orders', key: 'id' }, onDelete: 'SET NULL' },
      booking_id: { type: Sequelize.BIGINT, references: { model: 'bookings', key: 'id' }, onDelete: 'SET NULL' },
      used_at: { type: Sequelize.DATE, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
    });

    // Tracking deduplication checks rapidly avoiding multiple sequential lookups natively
    await queryInterface.addIndex('coupon_usages', ['coupon_id', 'user_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('coupon_usages');
  }
};
