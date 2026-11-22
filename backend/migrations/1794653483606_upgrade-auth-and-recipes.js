export const shorthands = undefined;

export const up = (pgm) => {
  pgm.alterColumn("users", "password", { notNull: false });
  pgm.addColumns("users", {
    is_verified: { type: "boolean", notNull: true, default: false },
    auth_provider: { type: "varchar(20)", notNull: true, default: "local" },
    google_id: { type: "varchar(120)" },
    otp_code: { type: "varchar(6)" },
    otp_expires_at: { type: "timestamp" },
  });

  pgm.alterColumn("recipe_ingredients", "ingredient_id", { notNull: false });
  pgm.addColumns("recipe_ingredients", {
    custom_name: { type: "varchar(100)" },
  });
};

export const down = (pgm) => {
  pgm.dropColumns("recipe_ingredients", ["custom_name"]);
  pgm.alterColumn("recipe_ingredients", "ingredient_id", { notNull: true });
  pgm.dropColumns("users", [
    "is_verified",
    "auth_provider",
    "google_id",
    "otp_code",
    "otp_expires_at",
  ]);
  pgm.alterColumn("users", "password", { notNull: true });
};
