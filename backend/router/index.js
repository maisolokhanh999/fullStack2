import express from "express";
import uploadRoutes from "./uploadRoutes.js";
import authRoutes from "./authRoutes.js";
const router = express.Router();
router.use("/upload", uploadRoutes);
router.use("/auth", authRoutes);
export default router;
