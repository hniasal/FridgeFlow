import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import ingredientRoutes from "./routes/ingredientRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Endpoint Health Check
app.get("/api/v1/health", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({
      status: "Success",
      message: "Backend Express & PostgreSQL Lokal Aktif!",
      time: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
});

// Endpoint Master Bahan Makanan
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/ingredients", ingredientRoutes);
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
