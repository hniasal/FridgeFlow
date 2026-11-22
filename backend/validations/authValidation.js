import Joi from "joi";

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(3).max(100).required().messages({
    "string.empty": "Nama lengkap wajib diisi.",
    "string.min": "Nama minimal 3 karakter.",
    "any.required": "Nama lengkap wajib diisi.",
  }),
  email: Joi.string()
    .trim()
    .pattern(STRICT_EMAIL_REGEX)
    .email({ tlds: { allow: true } })
    .required()
    .messages({
      "string.empty": "Silakan cek email dan kata sandi Anda dengan benar.",
      "string.pattern.base":
        "Silakan cek email dan kata sandi Anda dengan benar.",
      "string.email": "Silakan cek email dan kata sandi Anda dengan benar.",
      "any.required": "Silakan cek email dan kata sandi Anda dengan benar.",
    }),
  password: Joi.string().min(6).max(128).required().messages({
    "string.empty": "Silakan cek email dan kata sandi Anda dengan benar.",
    "string.min":
      "Silakan cek email dan kata sandi Anda dengan benar (kata sandi minimal 6 karakter).",
    "any.required": "Silakan cek email dan kata sandi Anda dengan benar.",
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .trim()
    .pattern(STRICT_EMAIL_REGEX)
    .email({ tlds: { allow: true } })
    .required()
    .messages({
      "string.empty": "Silakan cek email dan kata sandi Anda dengan benar.",
      "string.pattern.base":
        "Silakan cek email dan kata sandi Anda dengan benar.",
      "string.email": "Silakan cek email dan kata sandi Anda dengan benar.",
      "any.required": "Silakan cek email dan kata sandi Anda dengan benar.",
    }),
  password: Joi.string().min(1).required().messages({
    "string.empty": "Silakan cek email dan kata sandi Anda dengan benar.",
    "any.required": "Silakan cek email dan kata sandi Anda dengan benar.",
  }),
});
