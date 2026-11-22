import express from "express";
import {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  restockIngredient,
  deleteIngredient,
} from "../controllers/ingredientController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", getIngredients);
router.get("/:id", getIngredientById);
router.post("/", createIngredient);
router.put("/:id", updateIngredient);
router.post("/:id/restock", restockIngredient);
router.delete("/:id", deleteIngredient);

export default router;
