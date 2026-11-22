import express from "express";
import {
  getTransactions,
  getDashboardSummary,
} from "../controllers/transactionController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();
router.use(verifyToken);

router.get("/", getTransactions);
router.get("/summary", getDashboardSummary);

export default router;
