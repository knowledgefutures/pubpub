export const up = async (queryInterface) => {
  await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');


  await queryInterface.sequelize.query(`
        CREATE INDEX users_full_name_trgm_idx ON "Users" USING gin ("fullName" gin_trgm_ops);
      `);
  await queryInterface.sequelize.query(`
        CREATE INDEX users_email_trgm_idx ON "Users" USING gin (email gin_trgm_ops);
      `);
  await queryInterface.sequelize.query(`
        CREATE INDEX users_slug_trgm_idx ON "Users" USING gin (slug gin_trgm_ops);
      `);
};

export const down = async (queryInterface) => {
  await queryInterface.sequelize.query(
    'DROP INDEX IF EXISTS users_full_name_trgm_idx;',
  );
  await queryInterface.sequelize.query(
    'DROP INDEX IF EXISTS users_email_trgm_idx;',
  );
  await queryInterface.sequelize.query(
    'DROP INDEX IF EXISTS users_slug_trgm_idx;',
  );


  await queryInterface.sequelize.query('DROP EXTENSION IF EXISTS pg_trgm;');
};
