import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import db from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import ingredientRoutes from "./routes/ingredientRoutes.js";
import recipeRoutes from "./routes/recipeRoutes.js";
import transactionRoutes from "./routes/transactionRoutes.js";
import aiRoutes from "./routes/aiRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json());

// Memastikan kolom arsip resep tersedia secara otomatis
db.query(
  "ALTER TABLE recipes ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT false",
).catch((err) => {
  console.warn("Info skema recipes:", err.message);
});

app.get("/api/v1/health", async (req, res) => {
  try {
    const result = await db.query("SELECT NOW()");
    res.json({
      status: "Success",
      message: "Backend FridgeFlow Aktif",
      time: result.rows[0].now,
    });
  } catch (err) {
    res.status(500).json({ status: "Error", message: err.message });
  }
});

app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/ingredients", ingredientRoutes);
app.use("/api/v1/recipes", recipeRoutes);
app.use("/api/v1/transactions", transactionRoutes);
app.use("/api/v1/ai", aiRoutes);

app.listen(PORT, () => {
  console.log(`Server FridgeFlow berjalan di http://localhost:${PORT}`);
});
