import InvoiceDetail from "../../model/invoiceDetail.js";
import handleError from "../../middlewares/handleError/handleError.js";
import { mutateInvoiceItems } from "../../services/invoiceItems.js";

const mutate = (operation) => async (req, res) => {
  try {
    const result = await mutateInvoiceItems(operation, req.body || {}, req.params.id);
    res.status(result.status).json({ success: true, data: result.data, message: "Cập nhật món thành công" });
  } catch (error) { handleError(res, error); }
};
export const createInvoiceDetail = mutate('create');
export const createInvoiceDetailsBulk = mutate('bulk');
export const updateInvoiceDetail = mutate('update');
export const deleteInvoiceDetail = mutate('delete');

export const getInvoiceDetailsByInvoice = async (req, res) => {
  try {
    const details = await InvoiceDetail.find({
      invoiceId: req.params.invoiceId,
    }).populate("dishId").sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: details.length,
      data: details,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy chi tiết 1 dòng món
// @route   GET /api/invoice-details/:id
export const getInvoiceDetailById = async (req, res) => {
  try {
    const detail = await InvoiceDetail.findById(req.params.id)
      .populate("invoiceId")
      .populate("menuId");

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi tiết hoá đơn",
      });
    }

    res.status(200).json({
      success: true,
      data: detail,
    });
  } catch (error) {
    handleError(res, error);
  }
};
