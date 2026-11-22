export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("recipe_ingredients", {
    id: { type: "serial", primaryKey: true },
    recipe_id: {
      type: "integer",
      notNull: true,
      references: "recipes",
      onDelete: "CASCADE",
    },
    ingredient_id: {
      type: "integer",
      notNull: true,
      references: "ingredients",
      onDelete: "CASCADE",
    },
    qty_needed: { type: "numeric(10, 2)", notNull: true },
    unit: { type: "varchar(20)", notNull: true },
  });
};

export const down = (pgm) => {
  pgm.dropTable("recipe_ingredients");
};
