import express from "express";
import { getDishes, getDishById, createDish, updateDish, deleteDish, restoreDish } from "../contreller/dishController/dishController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
const router = express.Router();

router.get("/", getDishes,);
router.get("/:id", getDishById);
router.post("/",  createDish);
router.put("/:id",  updateDish);
router.delete("/:id",  deleteDish);
router.patch("/:id/restore",  restoreDish);

export default router;