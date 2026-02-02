exports.up = function (knex) {
  return knex.schema.alterTable("orders", (table) => {
    table.string("status").defaultTo("pending");
  });
};

exports.down = function (knex) {
  return knex.schema.alterTable("orders", (table) => {
    table.dropColumn("status");
  });
};
