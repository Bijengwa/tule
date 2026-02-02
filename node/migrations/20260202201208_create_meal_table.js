exports.up = function (knex) {
  return knex.schema.createTable("meals", (table) => {
    table.increments("id").primary();
    table.integer("restaurant_id").unsigned().notNullable();

    table.string("name").notNullable();
    table.decimal("price", 10, 2).notNullable();

    table.timestamps(true, true);

    table
      .foreign("restaurant_id")
      .references("id")
      .inTable("accounts")
      .onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("meals");
};
