export const shorthands = undefined;

export const up = (pgm) => {
  pgm.createTable("users", {
    id: { type: "serial", primaryKey: true },
    name: { type: "varchar(100)", notNull: true },
    email: { type: "varchar(100)", notNull: true, unique: true },
    password: { type: "text", notNull: true },
    created_at: { type: "timestamp", default: pgm.func("current_timestamp") },
  });
};

export const down = (pgm) => {
  pgm.dropTable("users");
};
