import express from "express";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
import {
  getUsers,
  getUserById,
  updateUser,
  updateRole,
  updatePassword,
  deleteUser,
} from "../contreller/userController/userController.js";

const router = express.Router();

router.get("/", getUsers);

router.get("/:id", getUserById);

router.put("/:id",authMiddleware, adminMiddleware, updateUser,);

router.put("/:id/role",authMiddleware, adminMiddleware, updateRole);

router.put("/:id/password",authMiddleware, adminMiddleware ,updatePassword);

router.delete("/:id",authMiddleware, adminMiddleware, deleteUser);

export default router;