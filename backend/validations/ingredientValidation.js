import Joi from "joi";

export const DISCRETE_UNITS = [
  "gram",
  "butir",
  "pcs",
  "siung",
  "lembar",
  "bungkus",
  "botol",
  "ikat",
  "potong",
  "buah",
  "pack",
  "kaleng",
  "sachet",
];

export const isDiscreteUnit = (unit = "") =>
  DISCRETE_UNITS.includes(String(unit).trim().toLowerCase());

export const ingredientSchema = Joi.object({
  name: Joi.string().max(100).required().messages({
    "string.empty": "Nama bahan tidak boleh kosong",
    "any.required": "Nama bahan wajib diisi",
  }),
  category: Joi.string().max(50).required(),
  qty: Joi.number().min(0).default(0),
  unit: Joi.string().max(20).required(),
  min_qty: Joi.number().min(0).default(0),
  expiry_date: Joi.date().allow(null, "").optional(),
}).custom((value, helpers) => {
  if (isDiscreteUnit(value.unit)) {
    if (!Number.isInteger(value.qty) || !Number.isInteger(value.min_qty)) {
      return helpers.message(
        `Satuan "${value.unit}" harus menggunakan angka bulat (integer).`,
      );
    }
  }
  return value;
});

export const restockSchema = Joi.object({
  qty_added: Joi.number().positive().required().messages({
    "number.positive": "Jumlah restock harus lebih dari 0",
    "any.required": "Jumlah restock wajib diisi",
  }),
  notes: Joi.string().max(255).allow("", null).optional(),
});
