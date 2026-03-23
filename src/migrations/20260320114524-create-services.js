'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('services', {
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
        allowNull: false,
        unique: true
      },
      description: {
        type: Sequelize.TEXT
      },
      category: {
        type: Sequelize.STRING(100)
      },
      base_price: {
        type: Sequelize.DECIMAL(10, 2)
      },
      featured_image: {
        type: Sequelize.STRING(500)
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

    // Standard Index
    await queryInterface.addIndex('services', ['tenant_id', 'category']);

    // PostgreSQL specific FULLTEXT GIN Index
    await queryInterface.sequelize.query(`
      CREATE INDEX services_fulltext_idx 
      ON services USING GIN (to_tsvector('english', name || ' ' || coalesce(description, '')));
    `);
  },

  async down(queryInterface, Sequelize) {
    // Drop raw index first
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS services_fulltext_idx;`);
    await queryInterface.dropTable('services');
  }
};
