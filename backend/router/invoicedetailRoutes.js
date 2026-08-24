import express from "express";
import {
  createInvoiceDetail,
  createInvoiceDetailsBulk,
  getInvoiceDetailsByInvoice,
  getInvoiceDetailById,
  updateInvoiceDetail,
  deleteInvoiceDetail,
} from "../contreller/invoiceDetail/invoiceDetail.js";
import { authMiddleware, adminMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
const router = express.Router();

router.post("/", authMiddleware, adminMiddleware, createInvoiceDetail);
router.post("/bulk", authMiddleware, adminMiddleware,createInvoiceDetailsBulk);
router.get("/invoice/:invoiceId", getInvoiceDetailsByInvoice);
router.get("/:id", getInvoiceDetailById);
router.put("/:id", authMiddleware, adminMiddleware, updateInvoiceDetail);
router.delete("/:id", authMiddleware, adminMiddleware, deleteInvoiceDetail);

export default router;