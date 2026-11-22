import db from "../config/db.js";
import {
  ingredientSchema,
  restockSchema,
  isDiscreteUnit,
} from "../validations/ingredientValidation.js";

const cleanNumber = (val) => {
  const num = Number(val);
  return Number.isInteger(num) ? num : Number(num.toFixed(2));
};

const formatRow = (row) => ({
  ...row,
  qty: cleanNumber(row.qty),
  min_qty: cleanNumber(row.min_qty),
});

const getIngredients = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM ingredients WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );
    res.status(200).json({
      status: "Success",
      data: result.rows.map(formatRow),
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

const getIngredientById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "SELECT * FROM ingredients WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Bahan makanan tidak ditemukan" });
    }
    res.status(200).json({
      status: "Success",
      data: formatRow(result.rows[0]),
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

const createIngredient = async (req, res) => {
  const { error, value } = ingredientSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "Failed",
      message: error.details[0].message,
    });
  }

  const { name, category, qty, unit, min_qty, expiry_date } = value;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const queryText = `
      INSERT INTO ingredients (user_id, name, category, qty, unit, min_qty, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      req.user.id,
      name.trim(),
      category,
      qty,
      unit.trim(),
      min_qty,
      expiry_date || null,
    ];
    const result = await client.query(queryText, values);
    const newIngredient = result.rows[0];

    // Otomatis hubungkan jika ada resep yang sebelumnya memakai custom_name yang sama
    await client.query(
      `UPDATE recipe_ingredients ri
       SET ingredient_id = $1, custom_name = NULL
       FROM recipes r
       WHERE ri.recipe_id = r.id
         AND r.user_id = $2
         AND ri.ingredient_id IS NULL
         AND LOWER(ri.custom_name) = LOWER($3)`,
      [newIngredient.id, req.user.id, name.trim()]
    );

    if (Number(qty) > 0) {
      await client.query(
        `INSERT INTO transactions (user_id, ingredient_id, type, qty, notes)
         VALUES ($1, $2, 'IN', $3, $4)`,
        [req.user.id, newIngredient.id, qty, `Stok awal: ${name.trim()}`]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      status: "Success",
      message: "Bahan makanan berhasil ditambahkan",
      data: formatRow(newIngredient),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ status: "Error", message: err.message });
  } finally {
    client.release();
  }
};

const updateIngredient = async (req, res) => {
  const { id } = req.params;
  const { error, value } = ingredientSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "Failed",
      message: error.details[0].message,
    });
  }

  const { name, category, qty, unit, min_qty, expiry_date } = value;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const oldRes = await client.query(
      "SELECT * FROM ingredients WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (oldRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res
        .status(404)
        .json({ status: "Failed", message: "Bahan makanan tidak ditemukan" });
    }

    const oldQty = Number(oldRes.rows[0].qty);
    const newQty = Number(qty);

    const queryText = `
      UPDATE ingredients
      SET name = $1, category = $2, qty = $3, unit = $4, min_qty = $5, expiry_date = $6
      WHERE id = $7 AND user_id = $8
      RETURNING *
    `;
    const values = [
      name.trim(),
      category,
      qty,
      unit.trim(),
      min_qty,
      expiry_date || null,
      id,
      req.user.id,
    ];
    const result = await client.query(queryText, values);

    // Catat selisih stok jika user mengedit jumlah secara manual agar riwayat audit tetap akurat
    const diff = cleanNumber(newQty - oldQty);
    if (diff !== 0) {
      await client.query(
        `INSERT INTO transactions (user_id, ingredient_id, type, qty, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          req.user.id,
          id,
          diff > 0 ? "IN" : "OUT",
          Math.abs(diff),
          `Penyesuaian stok manual: ${name.trim()}`,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(200).json({
      status: "Success",
      message: "Bahan makanan berhasil diperbarui",
      data: formatRow(result.rows[0]),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(500).json({ status: "Error", message: err.message });
  } finally {
    client.release();
  }
};

const restockIngredient = async (req, res) => {
  const { id } = req.params;
  const { error, value } = restockSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "Failed",
      message: error.details[0].message,
    });
  }

  const { qty_added, notes } = value;
  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const currentRes = await client.query(
      "SELECT * FROM ingredients WHERE id = $1 AND user_id = $2",
      [id, req.user.id]
    );
    if (currentRes.rows.length === 0) {
      throw new Error("Bahan makanan tidak ditemukan");
    }

    const currentItem = currentRes.rows[0];
    if (isDiscreteUnit(currentItem.unit) && !Number.isInteger(qty_added)) {
      throw new Error(
        `Satuan "${currentItem.unit}" harus ditambah dengan angka bulat.`
      );
    }

    const updateRes = await client.query(
      `UPDATE ingredients
       SET qty = qty + $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [qty_added, id, req.user.id]
    );

    const updated = updateRes.rows[0];

    await client.query(
      `INSERT INTO transactions (user_id, ingredient_id, type, qty, notes)
       VALUES ($1, $2, 'IN', $3, $4)`,
      [
        req.user.id,
        id,
        qty_added,
        notes || `Restock bahan: ${updated.name}`,
      ]
    );

    await client.query("COMMIT");

    res.status(200).json({
      status: "Success",
      message: `Stok ${updated.name} berhasil ditambah sebanyak ${cleanNumber(qty_added)} ${updated.unit}`,
      data: formatRow(updated),
    });
  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ status: "Failed", message: err.message });
  } finally {
    client.release();
  }
};

const deleteIngredient = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM ingredients WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id]
    );
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Bahan makanan tidak ditemukan" });
    }
    res.status(200).json({
      status: "Success",
      message: "Bahan makanan berhasil dihapus",
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

export {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  restockIngredient,
  deleteIngredient,
};
