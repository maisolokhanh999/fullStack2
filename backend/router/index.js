import express from "express";
import uploadRoutes from "./uploadRoutes.js";
import authRoutes from "./authRoutes.js";
import userRoutes from "./userRoutes.js";
const router = express.Router();
router.use("/upload", uploadRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
export default router;
