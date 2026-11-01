const db = require("../config/db");
const Joi = require("joi");

// Skema Validasi Joi untuk Bahan Makanan
const ingredientSchema = Joi.object({
  name: Joi.string().max(100).required(),
  category: Joi.string().max(50).required(),
  qty: Joi.number().min(0).default(0),
  unit: Joi.string().max(20).required(),
  min_qty: Joi.number().min(0).default(0),
  expiry_date: Joi.date().allow(null, ""),
});

// 1. Ambil Semua Bahan Makanan
const getIngredients = async (req, res) => {
  try {
    const result = await db.query(
      "SELECT * FROM ingredients ORDER BY created_at DESC",
    );
    res.status(200).json({
      status: "Success",
      data: result.rows,
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

// 2. Ambil Detail Bahan Makanan Berdasarkan ID
const getIngredientById = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query("SELECT * FROM ingredients WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Bahan makanan tidak ditemukan" });
    }
    res.status(200).json({
      status: "Success",
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

// 3. Tambah Bahan Makanan Baru
const createIngredient = async (req, res) => {
  const { error, value } = ingredientSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      status: "Failed",
      message: error.details[0].message,
    });
  }

  const { name, category, qty, unit, min_qty, expiry_date } = value;

  try {
    const queryText = `
      INSERT INTO ingredients (name, category, qty, unit, min_qty, expiry_date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [name, category, qty, unit, min_qty, expiry_date || null];
    const result = await db.query(queryText, values);

    res.status(201).json({
      status: "Success",
      message: "Bahan makanan berhasil ditambahkan",
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

// 4. Update Bahan Makanan Berdasarkan ID
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

  try {
    const queryText = `
      UPDATE ingredients
      SET name = $1, category = $2, qty = $3, unit = $4, min_qty = $5, expiry_date = $6
      WHERE id = $7
      RETURNING *
    `;
    const values = [
      name,
      category,
      qty,
      unit,
      min_qty,
      expiry_date || null,
      id,
    ];
    const result = await db.query(queryText, values);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ status: "Failed", message: "Bahan makanan tidak ditemukan" });
    }

    res.status(200).json({
      status: "Success",
      message: "Bahan makanan berhasil diperbarui",
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

// 5. Hapus Bahan Makanan Berdasarkan ID
const deleteIngredient = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await db.query(
      "DELETE FROM ingredients WHERE id = $1 RETURNING *",
      [id],
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

module.exports = {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
};
