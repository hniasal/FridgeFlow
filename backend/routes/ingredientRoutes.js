const express = require("express");
const router = express.Router();
const {
  getIngredients,
  getIngredientById,
  createIngredient,
  updateIngredient,
  deleteIngredient,
} = require("../controllers/ingredientController");

router.get("/", getIngredients);
router.get("/:id", getIngredientById);
router.post("/", createIngredient);
router.put("/:id", updateIngredient);
router.delete("/:id", deleteIngredient);

module.exports = router;
