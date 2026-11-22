import Joi from "joi";
import { isDiscreteUnit } from "./ingredientValidation.js";

export const createRecipeSchema = Joi.object({
  title: Joi.string().min(2).max(150).required().messages({
    "string.empty": "Judul resep tidak boleh kosong",
    "any.required": "Judul resep wajib diisi",
  }),
  instructions: Joi.string().allow("", null).optional(),
  ingredients: Joi.array()
    .items(
      Joi.object({
        ingredient_id: Joi.number().integer().positive().allow(null).optional(),
        custom_name: Joi.string().max(100).allow("", null).optional(),
        qty_needed: Joi.number().positive().required(),
        unit: Joi.string().max(20).required(),
      }).custom((item, helpers) => {
        if (
          !item.ingredient_id &&
          (!item.custom_name || !item.custom_name.trim())
        ) {
          return helpers.message(
            "Pilih bahan dari daftar atau ketik nama bahan baru.",
          );
        }
        if (isDiscreteUnit(item.unit) && !Number.isInteger(item.qty_needed)) {
          return helpers.message(
            `Takaran untuk satuan "${item.unit}" harus berupa angka bulat.`,
          );
        }
        return item;
      }),
    )
    .min(1)
    .required()
    .messages({
      "array.min": "Resep minimal harus memiliki 1 bahan baku",
      "any.required": "Daftar bahan baku wajib diisi",
    }),
});
