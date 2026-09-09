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
import { authMiddleware, staffMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
import { reservationAccess, assignmentAccess } from "../middlewares/authMiddleware/resourceAccess.js";

const router = express.Router();
router.use(authMiddleware);

router.post("/", reservationAccess, assignTableToReservation);
router.get("/", getReservationTables);
router.get("/reservations/:reservationId/tables", reservationAccess, getTablesByReservation);
router.get("/:id", assignmentAccess, getReservationTableById);
router.patch("/:id/release", staffMiddleware, releaseTable);
router.patch("/:id/block", staffMiddleware, blockReservationTable);
router.delete("/:id", staffMiddleware, deleteReservationTable);

export default router;
