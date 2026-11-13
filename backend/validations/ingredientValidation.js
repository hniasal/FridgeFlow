import Joi from "joi";

export const ingredientSchema = Joi.object({
  name: Joi.string().max(100).required(),
  category: Joi.string().max(50).required(),
  qty: Joi.number().min(0).default(0),
  unit: Joi.string().max(20).required(),
  min_qty: Joi.number().min(0).default(0),
  expiry_date: Joi.date().allow(null, ""),
});
