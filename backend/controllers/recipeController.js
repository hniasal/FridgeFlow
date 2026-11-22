import db from "../config/db.js";
import { createRecipeSchema } from "../validations/recipeValidation.js";

const cleanNumber = (val) => {
  const num = Number(val);
  return Number.isInteger(num) ? num : Number(num.toFixed(2));
};

export const createRecipe = async (req, res) => {
  const { error, value } = createRecipeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "Failed",
      message: error.details[0].message,
    });
  }

  const { title, instructions, ingredients } = value;
  const userId = req.user.id;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const recipeResult = await client.query(
      `INSERT INTO recipes (user_id, title, yield_label, instructions, is_archived)
       VALUES ($1, $2, NULL, $3, false) RETURNING *`,
      [userId, title.trim(), instructions || null],
    );
    const newRecipe = recipeResult.rows[0];

    for (const item of ingredients) {
      let ingredientId = item.ingredient_id || null;
      let customName = item.custom_name ? item.custom_name.trim() : null;

      if (ingredientId) {
        const checkIng = await client.query(
          "SELECT id FROM ingredients WHERE id = $1 AND user_id = $2",
          [ingredientId, userId],
        );
        if (checkIng.rows.length === 0) {
          throw new Error(`Bahan dengan ID ${ingredientId} tidak ditemukan.`);
        }
      } else if (customName) {
        const matchExisting = await client.query(
          "SELECT id FROM ingredients WHERE LOWER(name) = LOWER($1) AND user_id = $2 LIMIT 1",
          [customName, userId],
        );
        if (matchExisting.rows.length > 0) {
          ingredientId = matchExisting.rows[0].id;
          customName = null;
        }
      }

      await client.query(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, custom_name, qty_needed, unit)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          newRecipe.id,
          ingredientId,
          customName,
          item.qty_needed,
          item.unit.trim(),
        ],
      );
    }

    await client.query("COMMIT");
    return res.status(201).json({
      status: "Success",
      message: "Resep berhasil dibuat",
      data: newRecipe,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(400).json({ status: "Failed", message: err.message });
  } finally {
    client.release();
  }
};

// 2. EDIT RESEP
export const updateRecipe = async (req, res) => {
  const recipeId = req.params.id;
  const userId = req.user.id;
  const { error, value } = createRecipeSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "Failed",
      message: error.details[0].message,
    });
  }

  const { title, instructions, ingredients } = value;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const updatedRes = await client.query(
      `UPDATE recipes
       SET title = $1, yield_label = NULL, instructions = $2
       WHERE id = $3 AND user_id = $4
       RETURNING *`,
      [title.trim(), instructions || null, recipeId, userId],
    );

    if (updatedRes.rows.length === 0) {
      throw new Error("Resep tidak ditemukan");
    }

    await client.query("DELETE FROM recipe_ingredients WHERE recipe_id = $1", [
      recipeId,
    ]);

    for (const item of ingredients) {
      let ingredientId = item.ingredient_id || null;
      let customName = item.custom_name ? item.custom_name.trim() : null;

      if (!ingredientId && customName) {
        const matchExisting = await client.query(
          "SELECT id FROM ingredients WHERE LOWER(name) = LOWER($1) AND user_id = $2 LIMIT 1",
          [customName, userId],
        );
        if (matchExisting.rows.length > 0) {
          ingredientId = matchExisting.rows[0].id;
          customName = null;
        }
      }

      await client.query(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, custom_name, qty_needed, unit)
         VALUES ($1, $2, $3, $4, $5)`,
        [recipeId, ingredientId, customName, item.qty_needed, item.unit.trim()],
      );
    }

    await client.query("COMMIT");
    return res.status(200).json({
      status: "Success",
      message: "Resep berhasil diperbarui",
      data: updatedRes.rows[0],
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(400).json({ status: "Failed", message: err.message });
  } finally {
    client.release();
  }
};

// 3. AMBIL DAFTAR RESEP (BESERTA DATA KEBUTUHAN STOK UNTUK HALAMAN PRODUKSI)
export const getRecipes = async (req, res) => {
  try {
    const userId = req.user.id;
    const recipesResult = await db.query(
      "SELECT * FROM recipes WHERE user_id = $1 ORDER BY created_at DESC",
      [userId],
    );
    const recipes = recipesResult.rows;

    if (recipes.length === 0) {
      return res.status(200).json({ status: "Success", data: [] });
    }

    const recipeIds = recipes.map((r) => r.id);
    const itemsResult = await db.query(
      `SELECT ri.id, ri.recipe_id, ri.ingredient_id, ri.custom_name, ri.qty_needed, ri.unit,
              COALESCE(i.name, ri.custom_name) AS ingredient_name,
              COALESCE(i.qty, 0) AS stock_available,
              (i.id IS NOT NULL) AS is_registered_stock
       FROM recipe_ingredients ri
       LEFT JOIN ingredients i ON ri.ingredient_id = i.id
       WHERE ri.recipe_id = ANY($1::int[])`,
      [recipeIds],
    );

    const enrichedRecipes = recipes.map((recipe) => {
      const recipeItems = itemsResult.rows
        .filter((item) => item.recipe_id === recipe.id)
        .map((item) => {
          const needed = cleanNumber(item.qty_needed);
          const available = cleanNumber(item.stock_available);
          const isEnough = item.is_registered_stock && available >= needed;
          return {
            ...item,
            qty_needed: needed,
            stock_available: available,
            is_enough: isEnough,
            shortage: isEnough ? 0 : cleanNumber(needed - available),
          };
        });

      const canMake =
        recipeItems.length > 0 && recipeItems.every((item) => item.is_enough);

      return {
        ...recipe,
        is_archived: Boolean(recipe.is_archived),
        can_make: canMake,
        ingredients: recipeItems,
      };
    });

    return res.status(200).json({ status: "Success", data: enrichedRecipes });
  } catch (err) {
    return res.status(500).json({ status: "Error", message: err.message });
  }
};

// 4. ARSIPKAN / PULIHKAN RESEP
export const toggleArchiveRecipe = async (req, res) => {
  const recipeId = req.params.id;
  const userId = req.user.id;

  try {
    const existing = await db.query(
      "SELECT id, title, is_archived FROM recipes WHERE id = $1 AND user_id = $2",
      [recipeId, userId],
    );

    if (existing.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Resep tidak ditemukan" });
    }

    const currentArchived = Boolean(existing.rows[0].is_archived);
    const nextArchived =
      typeof req.body?.is_archived === "boolean"
        ? req.body.is_archived
        : !currentArchived;

    const updated = await db.query(
      "UPDATE recipes SET is_archived = $1 WHERE id = $2 AND user_id = $3 RETURNING *",
      [nextArchived, recipeId, userId],
    );

    return res.status(200).json({
      status: "Success",
      message: nextArchived
        ? `Resep "${existing.rows[0].title}" berhasil diarsipkan.`
        : `Resep "${existing.rows[0].title}" berhasil dipulihkan dari arsip.`,
      data: updated.rows[0],
    });
  } catch (err) {
    return res.status(500).json({ status: "Error", message: err.message });
  }
};

// 5. PRODUKSI RESEP (MENDUKUNG JUMLAH PRODUKSI N PCS/PORSI)
export const checkoutRecipe = async (req, res) => {
  const recipeId = req.params.id;
  const userId = req.user.id;
  const rawQty = req.body?.quantity ?? 1;
  const quantity = Number(rawQty);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({
      status: "Failed",
      message: "Jumlah produksi harus berupa angka bulat minimal 1.",
    });
  }

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const recipeCheck = await client.query(
      "SELECT * FROM recipes WHERE id = $1 AND user_id = $2",
      [recipeId, userId],
    );
    if (recipeCheck.rows.length === 0) {
      throw new Error("Resep tidak ditemukan");
    }
    const recipe = recipeCheck.rows[0];

    if (recipe.is_archived) {
      throw new Error(
        "Resep yang sedang diarsipkan tidak dapat diproduksi. Pulihkan resep terlebih dahulu.",
      );
    }

    const ingredientsResult = await client.query(
      `SELECT ri.ingredient_id, ri.custom_name, ri.qty_needed, ri.unit,
              COALESCE(i.name, ri.custom_name) AS ingredient_name,
              COALESCE(i.qty, 0) AS stock_available
       FROM recipe_ingredients ri
       LEFT JOIN ingredients i ON ri.ingredient_id = i.id AND i.user_id = $2
       WHERE ri.recipe_id = $1`,
      [recipeId, userId],
    );

    const items = ingredientsResult.rows;
    if (items.length === 0) {
      throw new Error("Resep ini belum memiliki daftar bahan baku");
    }

    for (const item of items) {
      const totalNeeded = cleanNumber(Number(item.qty_needed) * quantity);
      const available = cleanNumber(Number(item.stock_available));

      if (!item.ingredient_id) {
        throw new Error(
          `Bahan "${item.ingredient_name}" belum terdaftar di Bahan Baku (butuh ${totalNeeded} ${item.unit}).`,
        );
      }

      if (available < totalNeeded) {
        const shortage = cleanNumber(totalNeeded - available);
        throw new Error(
          `Stok ${item.ingredient_name} tidak mencukupi untuk produksi ${quantity} pcs (butuh ${totalNeeded} ${item.unit}, tersedia ${available} ${item.unit}, butuh ${shortage} ${item.unit} lagi)`,
        );
      }
    }

    for (const item of items) {
      const totalNeeded = cleanNumber(Number(item.qty_needed) * quantity);

      await client.query(
        "UPDATE ingredients SET qty = qty - $1 WHERE id = $2 AND user_id = $3",
        [totalNeeded, item.ingredient_id, userId],
      );

      await client.query(
        `INSERT INTO transactions (user_id, ingredient_id, recipe_id, type, qty, notes)
         VALUES ($1, $2, $3, 'OUT', $4, $5)`,
        [
          userId,
          item.ingredient_id,
          recipeId,
          totalNeeded,
          `Produksi: ${recipe.title} (${quantity}x)`,
        ],
      );
    }

    await client.query("COMMIT");
    return res.status(200).json({
      status: "Success",
      message: `Produksi "${recipe.title}" sebanyak ${quantity} berhasil! Stok bahan baku telah diperbarui.`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    return res.status(400).json({ status: "Failed", message: err.message });
  } finally {
    client.release();
  }
};

// 6. HAPUS RESEP
export const deleteRecipe = async (req, res) => {
  try {
    const result = await db.query(
      "DELETE FROM recipes WHERE id = $1 AND user_id = $2 RETURNING *",
      [req.params.id, req.user.id],
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Resep tidak ditemukan" });
    }
    return res
      .status(200)
      .json({ status: "Success", message: "Resep berhasil dihapus" });
  } catch (err) {
    return res.status(500).json({ status: "Error", message: err.message });
  }
};
