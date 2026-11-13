import express from "express";
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} from "../controllers/ingredientController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Lindungi semua endpoint bahan baku dengan JWT
router.use(verifyToken);

router.get("/", getIngredients);
router.get("/:id", getIngredientById);
router.post("/", createIngredient);
router.put("/:id", updateIngredient);
router.delete("/:id", deleteIngredient);

export default router;
