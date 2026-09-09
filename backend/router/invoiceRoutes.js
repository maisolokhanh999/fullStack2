import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceByReservation,
  getInvoiceById,
  updateInvoice,
  finalizeInvoice,
  payInvoice,
  cancelInvoice,
  refundInvoice,
  createDepositPayment,
  getInvoiceTransferQr,
  deleteInvoice,
  confirmDeposit,
} from "../contreller/invoice/invoice.js";
import { authMiddleware, adminMiddleware, staffMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createInvoice);
router.get("/", authMiddleware, getInvoices);
router.get("/reservation/:reservationId", authMiddleware, getInvoiceByReservation);
router.get("/:id", authMiddleware, getInvoiceById);
router.put("/:id", authMiddleware, staffMiddleware, updateInvoice);
router.patch("/:id/finalize", authMiddleware, staffMiddleware, finalizeInvoice);
router.patch("/:id/confirm-deposit", authMiddleware, staffMiddleware, confirmDeposit);
router.patch("/:id/pay", authMiddleware, staffMiddleware, payInvoice);
router.patch("/:id/cancel", authMiddleware, staffMiddleware, cancelInvoice);
router.patch("/:id/refund", authMiddleware, adminMiddleware, refundInvoice);
router.post("/:id/deposit-payment", authMiddleware, createDepositPayment);
router.get("/:id/transfer-qr", authMiddleware, getInvoiceTransferQr);
router.delete("/:id", authMiddleware, adminMiddleware, deleteInvoice);

export default router;
