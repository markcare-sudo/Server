'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('products', {
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
      name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      slug: {
        type: Sequelize.STRING(200),
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      category: {
        type: Sequelize.STRING(100)
      },
      featured_image: {
        type: Sequelize.STRING(500)
      },
      price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      is_active: {
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

    await queryInterface.addIndex('products', ['tenant_id', 'category']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('products');
  }
};
