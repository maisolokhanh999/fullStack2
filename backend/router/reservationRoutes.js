import express from "express";
import {
  createReservation,
  getReservations,
  getReservationById,
  updateReservation,
  confirmReservation,
  checkInReservation,
  completeReservation,
  cancelReservation,
  markNoShow,
  deleteReservation,
} from "../contreller/reservationController/reservation.js";

const router = express.Router();

router.post("/", createReservation);
router.get("/", getReservations);
router.get("/:id", getReservationById);
router.put("/:id", updateReservation);
router.patch("/:id/confirm", confirmReservation);
router.patch("/:id/checkin", checkInReservation);
router.patch("/:id/complete", completeReservation);
router.patch("/:id/cancel", cancelReservation);
router.patch("/:id/no-show", markNoShow);
router.delete("/:id", deleteReservation);

export default router;