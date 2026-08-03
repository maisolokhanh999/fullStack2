import express from "express";
import {
  createTable,
  getTables,
  getTableById,
  updateTable,
  updateTableStatus,
  deleteTable,
} from "../contreller/tableController/tableController.js";

const router = express.Router();

router.post("/", createTable);
router.get("/", getTables);
router.get("/:id", getTableById);
router.put("/:id", updateTable);
router.patch("/:id/status", updateTableStatus);
router.delete("/:id", deleteTable);

export default router;