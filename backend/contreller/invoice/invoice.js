import Invoice from "../../model/invoice.js"; // chỉnh lại path cho đúng
import Reservation from "../../model/reservation.js";

// @desc    Tạo hoá đơn mới
// @route   POST /api/invoices
export const createInvoice = async (req, res) => {
  try {
    const {
      reservationId,
      userId,
      payerName,
      phoneNumber,
      totalAmount,
      discountAmount = 0,
      paymentMethod,
      cashReceived = 0,
      status,
    } = req.body;

    // Kiểm tra reservation tồn tại
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    // Không cho tạo hoá đơn trùng cho 1 reservation (trừ khi hoá đơn cũ đã Cancelled)
    const existingInvoice = await Invoice.findOne({
      reservationId,
      status: { $in: ["Pending", "Paid"] },
    });
    if (existingInvoice) {
      return res.status(400).json({
        success: false,
        message: "Đặt bàn này đã có hoá đơn",
      });
    }

    if (discountAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Số tiền giảm giá không thể lớn hơn tổng tiền",
      });
    }

    const finalAmount = totalAmount - discountAmount;

    let changeAmount = 0;
    if (paymentMethod === "Cash") {
      if (cashReceived < finalAmount) {
        return res.status(400).json({
          success: false,
          message: "Số tiền khách đưa không đủ để thanh toán",
        });
      }
      changeAmount = cashReceived - finalAmount;
    }

    const invoice = await Invoice.create({
      reservationId,
      userId,
      payerName,
      phoneNumber,
      totalAmount,
      discountAmount,
      finalAmount,
      paymentMethod,
      cashReceived,
      changeAmount,
      status: status || "Pending",
    });

    res.status(201).json({
      success: true,
      message: "Tạo hoá đơn thành công",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy danh sách hoá đơn (filter theo status, paymentMethod, khoảng ngày)
// @route   GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const { status, paymentMethod, fromDate, toDate } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    if (fromDate || toDate) {
      filter.paymentDate = {};
      if (fromDate) filter.paymentDate.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.paymentDate.$lte = end;
      }
    }

    const invoices = await Invoice.find(filter)
      .populate("reservationId")
      .populate("userId", "-password")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Lấy chi tiết 1 hoá đơn
// @route   GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("reservationId")
      .populate("userId", "-password");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật hoá đơn (chỉ khi còn Pending)
// @route   PUT /api/invoices/:id
export const updateInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    if (invoice.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Không thể sửa hoá đơn vì trạng thái hiện tại là "${invoice.status}"`,
      });
    }

    const {
      payerName,
      phoneNumber,
      totalAmount,
      discountAmount,
      paymentMethod,
      cashReceived,
    } = req.body;

    const newTotal = totalAmount ?? invoice.totalAmount;
    const newDiscount = discountAmount ?? invoice.discountAmount;
    const newMethod = paymentMethod ?? invoice.paymentMethod;
    const newCashReceived = cashReceived ?? invoice.cashReceived;

    if (newDiscount > newTotal) {
      return res.status(400).json({
        success: false,
        message: "Số tiền giảm giá không thể lớn hơn tổng tiền",
      });
    }

    const newFinal = newTotal - newDiscount;

    let newChange = 0;
    if (newMethod === "Cash") {
      if (newCashReceived < newFinal) {
        return res.status(400).json({
          success: false,
          message: "Số tiền khách đưa không đủ để thanh toán",
        });
      }
      newChange = newCashReceived - newFinal;
    }

    if (payerName !== undefined) invoice.payerName = payerName;
    if (phoneNumber !== undefined) invoice.phoneNumber = phoneNumber;
    invoice.totalAmount = newTotal;
    invoice.discountAmount = newDiscount;
    invoice.finalAmount = newFinal;
    invoice.paymentMethod = newMethod;
    invoice.cashReceived = newCashReceived;
    invoice.changeAmount = newChange;

    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Cập nhật hoá đơn thành công",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xác nhận thanh toán (Pending -> Paid)
// @route   PATCH /api/invoices/:id/pay
export const payInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    if (invoice.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Không thể thanh toán vì trạng thái hiện tại là "${invoice.status}"`,
      });
    }

    invoice.status = "Paid";
    invoice.paymentDate = new Date();
    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Thanh toán thành công",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Huỷ hoá đơn (Pending -> Cancelled)
// @route   PATCH /api/invoices/:id/cancel
export const cancelInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    if (invoice.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Không thể huỷ vì trạng thái hiện tại là "${invoice.status}"`,
      });
    }

    invoice.status = "Cancelled";
    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Huỷ hoá đơn thành công",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Hoàn tiền hoá đơn (Paid -> Refunded)
// @route   PATCH /api/invoices/:id/refund
export const refundInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    if (invoice.status !== "Paid") {
      return res.status(400).json({
        success: false,
        message: `Không thể hoàn tiền vì trạng thái hiện tại là "${invoice.status}"`,
      });
    }

    invoice.status = "Refunded";
    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Hoàn tiền thành công",
      data: invoice,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xoá hoá đơn
// @route   DELETE /api/invoices/:id
export const deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xoá hoá đơn thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};