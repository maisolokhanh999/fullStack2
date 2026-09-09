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
  getReservationQr,
} from "../contreller/reservationController/reservation.js";
import { authMiddleware, adminMiddleware, staffMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
import { reservationAccess } from "../middlewares/authMiddleware/resourceAccess.js";

const router = express.Router();

router.post("/", authMiddleware, createReservation);
router.get("/", authMiddleware, getReservations);
router.get("/:id", authMiddleware, reservationAccess, getReservationById);
router.get("/:id/qr", authMiddleware, getReservationQr);
router.put("/:id", authMiddleware, reservationAccess, updateReservation);
router.patch("/:id/confirm", authMiddleware, staffMiddleware, confirmReservation);
router.patch("/:id/checkin", authMiddleware, staffMiddleware, checkInReservation);
router.patch("/:id/complete", authMiddleware, staffMiddleware, completeReservation);
router.patch("/:id/cancel", authMiddleware, cancelReservation);
router.patch("/:id/no-show", authMiddleware, staffMiddleware, markNoShow);
router.delete("/:id", authMiddleware, adminMiddleware, deleteReservation);

export default router;
