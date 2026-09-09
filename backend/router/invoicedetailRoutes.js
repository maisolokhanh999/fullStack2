import express from "express";
import {
  createInvoiceDetail,
  createInvoiceDetailsBulk,
  getInvoiceDetailsByInvoice,
  getInvoiceDetailById,
  updateInvoiceDetail,
  deleteInvoiceDetail,
} from "../contreller/invoiceDetail/invoiceDetail.js";
import { authMiddleware, staffMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";
import { invoiceAccess, detailAccess } from "../middlewares/authMiddleware/resourceAccess.js";
const router = express.Router();

router.post("/", authMiddleware, staffMiddleware, createInvoiceDetail);
router.post("/bulk", authMiddleware, staffMiddleware,createInvoiceDetailsBulk);
router.get("/invoice/:invoiceId", authMiddleware, invoiceAccess, getInvoiceDetailsByInvoice);
router.get("/:id", authMiddleware, detailAccess, getInvoiceDetailById);
router.put("/:id", authMiddleware, staffMiddleware, updateInvoiceDetail);
router.delete("/:id", authMiddleware, staffMiddleware, deleteInvoiceDetail);

export default router;
