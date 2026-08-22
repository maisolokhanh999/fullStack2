import express from "express";
import {
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  payInvoice,
  cancelInvoice,
  refundInvoice,
  deleteInvoice,
} from "../contreller/invoice/invoice.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createInvoice);
router.get("/", authMiddleware, getInvoices);
router.get("/:id", authMiddleware, getInvoiceById);
router.put("/:id", authMiddleware, updateInvoice);
router.patch("/:id/pay", authMiddleware, payInvoice);
router.patch("/:id/cancel", authMiddleware, cancelInvoice);
router.patch("/:id/refund", authMiddleware, refundInvoice);
router.delete("/:id", authMiddleware, adminMiddleware, deleteInvoice);

export default router;