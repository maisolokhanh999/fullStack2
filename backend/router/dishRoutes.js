import express from "express";
import { getDishes, getDishById, createDish, updateDish, deleteDish, restoreDish } from "../contreller/dishController/dishController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
const router = express.Router();

router.get("/", getDishes,);
router.get("/:id",getDishById);
router.post("/", authMiddleware, adminMiddleware ,createDish,);
router.put("/:id",  authMiddleware, adminMiddleware,updateDish,);
router.delete("/:id",  authMiddleware, adminMiddleware, deleteDish);
router.patch("/:id/restore",  authMiddleware, adminMiddleware, restoreDish);

export default router;