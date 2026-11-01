const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on("connect", () => {
  console.log("Terhubung ke database PostgreSQL: fridgeflow_db");
});

pool.on("error", (err) => {
  console.error("Koneksi database error:", err);
});

module.exports = pool;
