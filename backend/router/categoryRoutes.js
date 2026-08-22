
import express from "express";
import { authMiddleware,adminMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
import {getCategories, getCategoryById, createCategory, updateCategory, deleteCategory} from "../contreller/category/categoryController.js";
const router = express.Router();

router.get("/",  getCategories,);
router.get("/:id",  getCategoryById);
router.post("/", authMiddleware, adminMiddleware, createCategory);
router.put("/:id", authMiddleware, adminMiddleware, updateCategory);
router.delete("/:id", authMiddleware, adminMiddleware, deleteCategory);

export default router;