import express from "express";
import {
  getAiInsights,
  generateAiRecipe,
} from "../controllers/aiController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/insights", getAiInsights);
router.post("/generate-recipe", generateAiRecipe);

export default router;
