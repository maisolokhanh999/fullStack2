import express from "express";
import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  updateTableStatus,
  deleteTable,
} from "../contreller/tableController/tableController.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
const router = express.Router();

router.post("/", authMiddleware, adminMiddleware,createTable);
router.get("/",  getTables);
router.get("/:id", getTableById);
router.put("/:id", authMiddleware, adminMiddleware, updateTable);
router.patch("/:id/status", authMiddleware, updateTableStatus);
router.delete("/:id", authMiddleware, adminMiddleware, deleteTable);

export default router;