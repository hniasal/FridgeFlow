import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../config/db.js";
import { registerSchema, loginSchema } from "../validations/authValidation.js";

export const register = async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ status: "Failed", message: error.details[0].message });
  }

  const { name, email, password } = value;

  try {
    const userExists = await db.query("SELECT id FROM users WHERE email = $1", [
      email,
    ]);
    if (userExists.rows.length > 0) {
      return res
        .status(409)
        .json({ status: "Failed", message: "Email sudah terdaftar" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await db.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name, email, hashedPassword],
    );

    res.status(201).json({
      status: "Success",
      message: "Registrasi berhasil",
      data: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};

export const login = async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res
      .status(400)
      .json({ status: "Failed", message: error.details[0].message });
  }

  const { email, password } = value;

  try {
    const result = await db.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    if (result.rows.length === 0) {
      return res
        .status(401)
        .json({ status: "Failed", message: "Email atau password salah" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "Failed", message: "Email atau password salah" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.status(200).json({
      status: "Success",
      message: "Login berhasil",
      data: {
        token,
        user: { id: user.id, name: user.name, email: user.email },
      },
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
};
