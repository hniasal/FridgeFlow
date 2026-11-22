import express from "express";
import {
  createRecipe,
  updateRecipe,
  getRecipes,
  toggleArchiveRecipe,
  checkoutRecipe,
  deleteRecipe,
} from "../controllers/recipeController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", getRecipes);
router.post("/", createRecipe);
router.put("/:id", updateRecipe);
router.patch("/:id/archive", toggleArchiveRecipe);
router.post("/:id/checkout", checkoutRecipe);
router.delete("/:id", deleteRecipe);

export default router;
