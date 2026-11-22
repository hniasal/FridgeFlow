export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("transactions", {
    id: { type: "serial", primaryKey: true },
    user_id: {
      type: "integer",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    ingredient_id: {
      type: "integer",
      references: "ingredients",
      onDelete: "SET NULL",
    },
    recipe_id: {
      type: "integer",
      references: "recipes",
      onDelete: "SET NULL",
    },
    type: {
      type: "varchar(10)",
      notNull: true,
      check: "type IN ('IN', 'OUT')",
    },
    qty: { type: "numeric(10, 2)", notNull: true },
    notes: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
  });
  pgm.createIndex("transactions", "user_id");
};

export const down = (pgm) => {
  pgm.dropTable("transactions");
};
