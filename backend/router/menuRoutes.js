import express from 'express';
import { getMenus, getMenuById, createMenu, updateMenu, deleteMenu, restoreMenu, addDishToMenu, removeDishFromMenu, reorderMenuItems } from '../contreller/menuController/menuController.js';
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
const router = express.Router();

router.get("/", getMenus);
router.get("/:id", getMenuById);
router.post("/", createMenu);
router.put("/:id", updateMenu);
router.delete("/:id", authMiddleware, adminMiddleware, deleteMenu);
router.patch("/:id/restore", restoreMenu);

// Items
router.post("/:id/items", addDishToMenu);
router.delete("/:id/items/:dishId", removeDishFromMenu);
router.put("/:id/items/reorder", reorderMenuItems);
export default router;