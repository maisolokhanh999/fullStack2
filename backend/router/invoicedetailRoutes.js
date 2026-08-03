import express from "express";
import {
  createInvoiceDetail,
  createInvoiceDetailsBulk,
  getInvoiceDetailsByInvoice,
  getInvoiceDetailById,
  updateInvoiceDetail,
  deleteInvoiceDetail,
} from "../contreller/invoiceDetail/invoiceDetail.js";

const router = express.Router();

router.post("/", createInvoiceDetail);
router.post("/bulk", createInvoiceDetailsBulk);
router.get("/:id", getInvoiceDetailById);
router.put("/:id", updateInvoiceDetail);
router.delete("/:id", deleteInvoiceDetail);

export default router;