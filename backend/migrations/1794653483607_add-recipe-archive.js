export const shorthands = undefined;

export const up = (pgm) => {
  pgm.addColumns("recipes", {
    is_archived: { type: "boolean", notNull: true, default: false },
  });
  pgm.createIndex("recipes", ["user_id", "is_archived"]);
};

export const down = (pgm) => {
  pgm.dropIndex("recipes", ["user_id", "is_archived"]);
  pgm.dropColumns("recipes", ["is_archived"]);
};
