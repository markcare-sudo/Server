'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reviews', {
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
      booking_id: {
        type: Sequelize.BIGINT,
        references: { model: 'bookings', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      order_id: {
        type: Sequelize.BIGINT,
        references: { model: 'orders', key: 'id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      reviewer_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      reviewee_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      review_type: {
        type: Sequelize.ENUM('SERVICE', 'PRODUCT'),
        allowNull: false
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(200)
      },
      comment: {
        type: Sequelize.TEXT
      },
      is_verified_purchase: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      helpful_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    // Constrain integers mathematically preventing UI manipulations bleeding downstream
    await queryInterface.addConstraint('reviews', {
      fields: ['rating'],
      type: 'check',
      where: {
        rating: {
          [Sequelize.Op.between]: [1, 5]
        }
      },
      name: 'reviews_rating_check'
    });

    await queryInterface.addIndex('reviews', ['reviewee_id', 'rating']);
    await queryInterface.addIndex('reviews', ['created_at'], { name: 'reviews_created_at_idx' });
    await queryInterface.addIndex('reviews', ['tenant_id', 'review_type']);
    
    // Explicit model-driven uniqueness checking mapped natively securely onto SQL
    await queryInterface.addConstraint('reviews', {
      fields: ['booking_id', 'reviewer_id'],
      type: 'unique',
      name: 'unique_booking_reviewer'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reviews');
  }
};
