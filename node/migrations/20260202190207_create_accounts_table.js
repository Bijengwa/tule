exports.up = function(knex) {
  return knex.schema.createTable("accounts", table => {
    table.increments("id").primary();
    table.string("role").notNullable();
    table.string("name").notNullable();
    table.string("phone").unique().notNullable();
    table.string("password").notNullable();
    table.timestamps(true, true);
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists("accounts");
};
