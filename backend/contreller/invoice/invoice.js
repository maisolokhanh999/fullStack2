import Invoice from "../../model/invoice.js"; // chỉnh lại path cho đúng
import Reservation from "../../model/reservation.js";
import handleError from "../../middlewares/handleError/handleError.js";

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
      depositAmount,
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

    const invoiceDeposit = depositAmount ?? reservation.depositAmount ?? 0;

    if (discountAmount > totalAmount) {
      return res.status(400).json({
        success: false,
        message: "Số tiền giảm giá không thể lớn hơn tổng tiền",
      });
    }

    if (invoiceDeposit > totalAmount - discountAmount) {
      return res.status(400).json({
        success: false,
        message: "Số tiền cọc không thể lớn hơn số tiền sau giảm giá",
      });
    }

    const finalAmount = totalAmount - discountAmount - invoiceDeposit;

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
      depositAmount: invoiceDeposit,
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
    handleError(res, error);
  }
};

// @desc    Lấy danh sách hoá đơn (filter theo status, paymentMethod, khoảng ngày)
// @route   GET /api/invoices
export const getInvoices = async (req, res) => {
  try {
    const { status, paymentMethod, fromDate, toDate } = req.query;
    const filter = {};

    if (!['admin', 'staff'].includes(req.user?.role)) filter.userId = req.user._id;

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
      .populate("paidBy", "name role")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: invoices.length,
      data: invoices,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy chi tiết 1 hoá đơn
// @route   GET /api/invoices/:id
export const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate("reservationId")
      .populate("userId", "-password")
      .populate("paidBy", "name role");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hoá đơn",
      });
    }

    const isOwner = String(invoice.userId?._id || invoice.userId) === String(req.user._id);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền xem hóa đơn này",
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    handleError(res, error);
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
      depositAmount,
      paymentMethod,
      cashReceived,
    } = req.body;

    const newTotal = totalAmount ?? invoice.totalAmount;
    const newDiscount = discountAmount ?? invoice.discountAmount;
    const newDeposit = depositAmount ?? invoice.depositAmount ?? 0;
    const newMethod = paymentMethod ?? invoice.paymentMethod;
    const newCashReceived = cashReceived ?? invoice.cashReceived;

    if (newDiscount > newTotal) {
      return res.status(400).json({
        success: false,
        message: "Số tiền giảm giá không thể lớn hơn tổng tiền",
      });
    }

    if (newDeposit > newTotal - newDiscount) {
      return res.status(400).json({
        success: false,
        message: "Số tiền cọc không thể lớn hơn số tiền sau giảm giá",
      });
    }

    const newFinal = newTotal - newDiscount - newDeposit;

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
    invoice.depositAmount = newDeposit;
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
    handleError(res, error);
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

    if (invoice.status !== "Finalized") {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể thanh toán hóa đơn đã chốt. Trạng thái hiện tại là "${invoice.status}"`,
      });
    }

    const paymentMethod = req.body.paymentMethod || invoice.paymentMethod;
    const cashReceived = req.body.cashReceived ?? invoice.cashReceived ?? 0;

    if (paymentMethod === "Cash" && cashReceived < invoice.finalAmount) {
      return res.status(400).json({
        success: false,
        message: "Số tiền mặt khách đưa không đủ để thanh toán",
      });
    }

    invoice.status = "Paid";
    invoice.paymentMethod = paymentMethod;
    invoice.cashReceived = paymentMethod === "Cash" ? cashReceived : 0;
    invoice.changeAmount = paymentMethod === "Cash" ? cashReceived - invoice.finalAmount : 0;
    invoice.paymentDate = new Date();
    invoice.paidBy = req.user._id;
    await invoice.save();

    // Thanh toán trước ngày đến không được giải phóng bàn. Bàn chỉ được trả
    // về Available khi lượt đặt đã hoàn tất, hủy hoặc no-show.

    res.status(200).json({
      success: true,
      message: "Thanh toán thành công",
      data: invoice,
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const createDepositPayment = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Không tìm thấy hóa đơn" });

    const isOwner = String(invoice.userId) === String(req.user._id);
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền thanh toán hóa đơn này" });
    }
    if (!invoice.depositAmount || invoice.depositAmount <= 0) {
      return res.status(400).json({ success: false, message: "Hóa đơn không có tiền cọc cần thanh toán" });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(503).json({ success: false, message: "Chưa cấu hình cổng thanh toán online" });
    }

    const stripeBody = new URLSearchParams({
      amount: String(Math.round(invoice.depositAmount)),
      currency: "vnd",
      "metadata[invoiceId]": String(invoice._id),
      "metadata[reservationId]": String(invoice.reservationId),
    });
    const stripeResponse = await fetch("https://api.stripe.com/v1/payment_intents", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: stripeBody,
    });
    const paymentIntent = await stripeResponse.json();
    if (!stripeResponse.ok) {
      return res.status(502).json({ success: false, message: "Không tạo được giao dịch thanh toán" });
    }

    invoice.depositPaymentStatus = "Pending";
    invoice.depositPaymentProvider = "stripe";
    invoice.depositPaymentIntentId = paymentIntent.id;
    await invoice.save();

    res.status(201).json({
      success: true,
      data: { provider: "stripe", paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret },
    });
  } catch (error) {
    handleError(res, error);
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
    handleError(res, error);
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
    handleError(res, error);
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
    handleError(res, error);
  }
};

// @desc    Chốt hóa đơn (Pending -> Finalized)
// @route   PATCH /api/invoices/:id/finalize
export const finalizeInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Không tìm thấy hoá đơn" });
    }

    if (invoice.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Không thể chốt vì trạng thái hiện tại là "${invoice.status}"`,
      });
    }

    invoice.status = "Finalized";
    await invoice.save();

    res.status(200).json({
      success: true,
      message: "Chốt hoá đơn thành công",
      data: invoice,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy hóa đơn hiện tại của một lượt đặt bàn
// @route   GET /api/invoices/reservation/:reservationId
export const getInvoiceByReservation = async (req, res) => {
  try {
    const invoice = await Invoice.findOne({ reservationId: req.params.reservationId })
      .populate("reservationId")
      .populate("userId", "name")
      .populate("paidBy", "name role");

    if (!invoice) {
      return res.status(404).json({ success: false, message: "Lượt đặt bàn này chưa có hóa đơn" });
    }

    const bookedBy = invoice.reservationId?.bookedBy;
    const isOwner = String(invoice.userId?._id || invoice.userId) === String(req.user._id)
      || (bookedBy && String(bookedBy) === String(req.user._id));
    if (req.user.role !== "admin" && !isOwner) {
      return res.status(403).json({ success: false, message: "Không có quyền xem hóa đơn này" });
    }

    res.status(200).json({ success: true, data: invoice });
  } catch (error) {
    handleError(res, error);
  }
};
