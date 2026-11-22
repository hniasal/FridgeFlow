export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("ingredients", {
    id: { type: "serial", primaryKey: true },
    user_id: {
      type: "integer",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    name: { type: "varchar(100)", notNull: true },
    category: { type: "varchar(50)" },
    qty: { type: "numeric(10, 2)", notNull: true, default: 0 },
    unit: { type: "varchar(20)", notNull: true },
    min_qty: { type: "numeric(10, 2)", notNull: true, default: 0 },
    expiry_date: { type: "date" },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
  });
  pgm.createIndex("ingredients", "user_id");
};

export const down = (pgm) => {
  pgm.dropTable("ingredients");
};
