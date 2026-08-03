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

const router = express.Router();

router.post("/", createInvoice);
router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.put("/:id", updateInvoice);
router.patch("/:id/pay", payInvoice);
router.patch("/:id/cancel", cancelInvoice);
router.patch("/:id/refund", refundInvoice);
router.delete("/:id", deleteInvoice);

export default router;