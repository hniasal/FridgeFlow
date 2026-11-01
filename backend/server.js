const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./config/db");

// Import Routes
const ingredientRoutes = require("./routes/ingredientRoutes");

const app = express();

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
app.use("/api/v1/ingredients", ingredientRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
