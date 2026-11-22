import express from "express";
import {
  register,
  verifyOtp,
  login,
  googleLogin,
  getProfile,
  deleteAccount,
} from "../controllers/authController.js";
import { verifyToken } from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/verify-otp", verifyOtp);
router.post("/login", login);
router.post("/google", googleLogin);
router.get("/me", verifyToken, getProfile);
router.delete("/delete-account", verifyToken, deleteAccount);

export default router;
