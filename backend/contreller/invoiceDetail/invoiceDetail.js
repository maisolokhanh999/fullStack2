import mongoose from "mongoose";
import InvoiceDetail from "../../model/invoiceDetail.js"; // chỉnh lại path cho đúng
import Invoice from "../../model/invoice.js";
import Menu from "../../model/menu.js"; // chỉnh lại path nếu tên khác

// Helper: tính lại totalAmount của Invoice dựa trên tổng các InvoiceDetail
const recalculateInvoiceTotal = async (invoiceId) => {
  const details = await InvoiceDetail.find({ invoiceId });

  const totalAmount = details.reduce((sum, item) => sum + item.totalAmount, 0);

  const invoice = await Invoice.findById(invoiceId);
  if (!invoice) return;

  invoice.totalAmount = totalAmount;
  invoice.finalAmount = totalAmount - (invoice.discountAmount || 0);

  if (invoice.paymentMethod === "Cash") {
    invoice.changeAmount = Math.max(
      (invoice.cashReceived || 0) - invoice.finalAmount,
      0
    );
  }

  await invoice.save();
};

// @desc    Thêm 1 món vào hoá đơn
// @route   POST /api/invoice-details
export const createInvoiceDetail = async (req, res) => {
  try {
    const { invoiceId, menuId, quantity, discount = 0, note } = req.body;

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    if (invoice.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể thêm món khi hoá đơn đang ở trạng thái Pending",
      });
    }

    const menu = await Menu.findById(menuId);
    if (!menu) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy món ăn",
      });
    }

    const unitPrice = menu.price; // giả sử Menu có field price, chỉnh lại nếu tên khác
    const totalAmount = unitPrice * quantity * (1 - discount / 100);

    const detail = await InvoiceDetail.create({
      invoiceId,
      menuId,
      itemName: menu.name, // giả sử Menu có field name
      unitPrice,
      discount,
      quantity,
      totalAmount,
      note,
    });

    await recalculateInvoiceTotal(invoiceId);

    res.status(201).json({
      success: true,
      message: "Thêm món vào hoá đơn thành công",
      data: detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Thêm nhiều món cùng lúc vào hoá đơn
// @route   POST /api/invoice-details/bulk
export const createInvoiceDetailsBulk = async (req, res) => {
  try {
    const { invoiceId, items } = req.body; // items: [{ menuId, quantity, discount, note }]

    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    if (invoice.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể thêm món khi hoá đơn đang ở trạng thái Pending",
      });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Danh sách món ăn không được để trống",
      });
    }

    const menuIds = items.map((i) => i.menuId);
    const menus = await Menu.find({ _id: { $in: menuIds } });
    const menuMap = new Map(menus.map((m) => [m._id.toString(), m]));

    const docsToInsert = [];
    for (const item of items) {
      const menu = menuMap.get(item.menuId);
      if (!menu) {
        return res.status(404).json({
          success: false,
          message: `Không tìm thấy món ăn với id ${item.menuId}`,
        });
      }

      const discount = item.discount || 0;
      const totalAmount = menu.price * item.quantity * (1 - discount / 100);

      docsToInsert.push({
        invoiceId,
        menuId: item.menuId,
        itemName: menu.name,
        unitPrice: menu.price,
        discount,
        quantity: item.quantity,
        totalAmount,
        note: item.note || "",
      });
    }

    const details = await InvoiceDetail.insertMany(docsToInsert);

    await recalculateInvoiceTotal(invoiceId);

    res.status(201).json({
      success: true,
      message: "Thêm danh sách món vào hoá đơn thành công",
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy tất cả chi tiết của 1 hoá đơn
// @route   GET /api/invoices/:invoiceId/details
export const getInvoiceDetailsByInvoice = async (req, res) => {
  try {
    const details = await InvoiceDetail.find({
      invoiceId: req.params.invoiceId,
    }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      count: details.length,
      data: details,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật 1 dòng món (đổi số lượng, giảm giá, ghi chú)
// @route   PUT /api/invoice-details/:id
export const updateInvoiceDetail = async (req, res) => {
  try {
    const detail = await InvoiceDetail.findById(req.params.id);

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi tiết hoá đơn",
      });
    }

    const invoice = await Invoice.findById(detail.invoiceId);
    if (invoice && invoice.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể sửa món khi hoá đơn đang ở trạng thái Pending",
      });
    }

    const { quantity, discount, note } = req.body;

    const newQuantity = quantity ?? detail.quantity;
    const newDiscount = discount ?? detail.discount;

    detail.quantity = newQuantity;
    detail.discount = newDiscount;
    detail.totalAmount =
      detail.unitPrice * newQuantity * (1 - newDiscount / 100);
    if (note !== undefined) detail.note = note;

    await detail.save();
    await recalculateInvoiceTotal(detail.invoiceId);

    res.status(200).json({
      success: true,
      message: "Cập nhật chi tiết hoá đơn thành công",
      data: detail,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xoá 1 món khỏi hoá đơn
// @route   DELETE /api/invoice-details/:id
export const deleteInvoiceDetail = async (req, res) => {
  try {
    const detail = await InvoiceDetail.findById(req.params.id);

    if (!detail) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy chi tiết hoá đơn",
      });
    }

    const invoice = await Invoice.findById(detail.invoiceId);
    if (invoice && invoice.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể xoá món khi hoá đơn đang ở trạng thái Pending",
      });
    }

    const invoiceId = detail.invoiceId;
    await InvoiceDetail.findByIdAndDelete(req.params.id);
    await recalculateInvoiceTotal(invoiceId);

    res.status(200).json({
      success: true,
      message: "Xoá món khỏi hoá đơn thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};