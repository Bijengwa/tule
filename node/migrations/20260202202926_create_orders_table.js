exports.up = function (knex) {
  return knex.schema.createTable("orders", (table) => {
    table.increments("id").primary();

    table.integer("meal_id").unsigned().notNullable();
    table.integer("restaurant_id").unsigned().notNullable();
    table.integer("user_id").unsigned().notNullable();

    table.timestamps(true, true);

    table.foreign("meal_id").references("id").inTable("meals").onDelete("CASCADE");
    table.foreign("restaurant_id").references("id").inTable("accounts").onDelete("CASCADE");
    table.foreign("user_id").references("id").inTable("accounts").onDelete("CASCADE");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("orders");
};
