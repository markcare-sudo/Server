'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;
      ALTER TABLE products ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

      CREATE INDEX IF NOT EXISTS services_search_idx ON services USING GIN(search_vector);
      CREATE INDEX IF NOT EXISTS products_search_idx ON products USING GIN(search_vector);

      CREATE OR REPLACE FUNCTION update_catalog_search_vector() RETURNS trigger AS $$
      BEGIN
        NEW.search_vector :=
          to_tsvector('english', coalesce(NEW.name, '') || ' ' || coalesce(NEW.description, '') || ' ' || coalesce(NEW.category, ''));
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Bind exactly into table cascades explicitly
      DROP TRIGGER IF EXISTS trigger_update_services_search_vector ON services;
      CREATE TRIGGER trigger_update_services_search_vector
      BEFORE INSERT OR UPDATE ON services
      FOR EACH ROW EXECUTE FUNCTION update_catalog_search_vector();

      DROP TRIGGER IF EXISTS trigger_update_products_search_vector ON products;
      CREATE TRIGGER trigger_update_products_search_vector
      BEFORE INSERT OR UPDATE ON products
      FOR EACH ROW EXECUTE FUNCTION update_catalog_search_vector();
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_update_services_search_vector ON services;
      DROP TRIGGER IF EXISTS trigger_update_products_search_vector ON products;
      DROP FUNCTION IF EXISTS update_catalog_search_vector();

      DROP INDEX IF EXISTS services_search_idx;
      DROP INDEX IF EXISTS products_search_idx;

      ALTER TABLE services DROP COLUMN IF EXISTS search_vector;
      ALTER TABLE products DROP COLUMN IF EXISTS search_vector;
    `);
  }
};
