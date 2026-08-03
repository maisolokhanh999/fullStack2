import express from "express";
import {
  assignTableToReservation,
  getReservationTables,
  getReservationTableById,
  getTablesByReservation,
  releaseTable,
  blockReservationTable,
  deleteReservationTable,
} from "../contreller/reservationTable/reservationTable.js";

const router = express.Router();

router.post("/", assignTableToReservation);
router.get("/", getReservationTables);
router.get("/:id", getReservationTableById);
router.get("/reservations/:reservationId/tables", getTablesByReservation);
router.patch("/:id/release", releaseTable);
router.patch("/:id/block", blockReservationTable);
router.delete("/:id", deleteReservationTable);

export default router;