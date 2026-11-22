export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("recipes", {
    id: { type: "serial", primaryKey: true },
    user_id: {
      type: "integer",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    title: { type: "varchar(150)", notNull: true },
    yield_label: { type: "varchar(50)" },
    instructions: { type: "text" },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
  });
  pgm.createIndex("recipes", "user_id");
};

export const down = (pgm) => {
  pgm.dropTable("recipes");
};
