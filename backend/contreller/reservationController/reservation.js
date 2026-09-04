import Reservation from "../../model/reservation.js"; // chỉnh lại path cho đúng
import Invoice from "../../model/invoice.js";
import InvoiceDetail from "../../model/invoiceDetail.js";
import Dish from "../../model/dish.js";
import ReservationTable from "../../model/reservationTable.js";
import Table from "../../model/table.js";
import handleError from "../../middlewares/handleError/handleError.js";
import QRCode from "qrcode";
import { notifyReservationCreated } from "../../services/notificationService.js";

const releaseReservationTables = async (reservationId) => {
  const assignments = await ReservationTable.find({
    reservationId,
    status: "Active",
  }).select("tableId");
  const tableIds = assignments.map((assignment) => assignment.tableId);

  if (!tableIds.length) return;

  await ReservationTable.updateMany(
    { reservationId, status: "Active" },
    { status: "Inactive" }
  );
  await Table.updateMany(
    { _id: { $in: tableIds } },
    { status: "Available" }
  );
};

export const expireLateReservations = async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const lateReservations = await Reservation.find({
    status: { $in: ["Pending", "Confirmed"] },
    expectedCheckInTime: { $lte: cutoff },
  }).select("_id");

  for (const reservation of lateReservations) {
    const updated = await Reservation.findOneAndUpdate(
      { _id: reservation._id, status: { $in: ["Pending", "Confirmed"] } },
      { status: "NoShow" },
      { new: true }
    );
    if (!updated) continue;

    await releaseReservationTables(updated._id);
    await Invoice.updateMany(
      {
        reservationId: updated._id,
        status: { $in: ["Pending", "Finalized"] },
      },
      {
        status: "Cancelled",
        cancellationReason: "Khách không đến trong vòng 30 phút",
        depositRefunded: false,
      }
    );
  }
};

export const getReservationQr = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id).select(
      "reservationCode customerName expectedCheckInTime status bookedBy",
    );

    if (!reservation) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đặt bàn" });
    }

    const isStaff = ["admin", "staff"].includes(req.user?.role);
    if (!isStaff && String(reservation.bookedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem mã QR này" });
    }

    const qrPayload = JSON.stringify({
      type: "restaurant-reservation",
      reservationId: reservation._id,
      reservationCode: reservation.reservationCode,
    });
    const qrCode = await QRCode.toDataURL(qrPayload, { margin: 1, width: 320 });

    res.status(200).json({
      success: true,
      data: { qrCode, reservation },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Tạo đặt bàn mới
// @route   POST /api/reservations
export const createReservation = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      numberOfGuests,
      depositAmount = 0,
      preorderItems = [],
      expectedCheckInTime,
      reservationType,
      note,
    } = req.body;

    const reservation = await Reservation.create({
      customerName,
      customerPhone,
      bookedBy: req.user._id,
      numberOfGuests,
      depositAmount,
      expectedCheckInTime,
      reservationType,
      note,
    });

    const invoice = await Invoice.create({
      reservationId: reservation._id,
      userId: req.user._id,
      payerName: customerName,
      phoneNumber: customerPhone,
      totalAmount: 0,
      discountAmount: 0,
      depositAmount,
      finalAmount: 0,
      paymentMethod: "BankTransfer",
      status: "Pending",
    });

    if (Array.isArray(preorderItems) && preorderItems.length > 0) {
      const dishIds = preorderItems.map((item) => item.dishId).filter(Boolean);
      const dishes = await Dish.find({ _id: { $in: dishIds } });
      const dishMap = new Map(dishes.map((dish) => [dish._id.toString(), dish]));
      const detailDocs = preorderItems.map((item) => {
        const dish = dishMap.get(String(item.dishId));
        const quantity = Math.max(1, Math.min(99, Math.round(Number(item.quantity) || 1)));
        if (!dish) throw new Error(`Món ăn với id ${item.dishId} không tồn tại`);
        return {
          invoiceId: invoice._id,
          dishId: dish._id,
          itemName: dish.name,
          unitPrice: dish.price,
          quantity,
          totalAmount: dish.price * quantity,
        };
      });
      await InvoiceDetail.insertMany(detailDocs);
      const totalAmount = detailDocs.reduce((sum, item) => sum + item.totalAmount, 0);
      invoice.totalAmount = totalAmount;
      invoice.finalAmount = Math.max(totalAmount - depositAmount, 0);
      await invoice.save();
    }

    res.status(201).json({
      success: true,
      message: "Tạo đặt bàn thành công",
      data: reservation,
      invoice,
    });

    notifyReservationCreated({
      email: req.user.email,
      phone: customerPhone,
      reservationCode: reservation.reservationCode,
      checkInTime: reservation.expectedCheckInTime.toISOString(),
    }).catch((error) => console.error("Reservation notification error:", error));
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy danh sách đặt bàn (filter theo status, loại đặt, ngày)
// @route   GET /api/reservations
export const getReservations = async (req, res) => {
  try {
    await expireLateReservations();
    const { status, reservationType, date, query } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (reservationType) filter.reservationType = reservationType;
    if (query?.trim()) {
      const searchValue = query.trim();
      const escaped = searchValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { reservationCode: { $regex: `^${escaped}$`, $options: "i" } },
        { customerPhone: { $regex: `^${escaped}$` } },
        { customerName: { $regex: escaped, $options: "i" } },
      ];
    }

    // Lọc theo ngày check-in dự kiến (yyyy-mm-dd)
    if (date) {
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      filter.expectedCheckInTime = { $gte: start, $lte: end };
    }

    const reservations = await Reservation.find(filter).populate("bookedBy", "name phone").sort({
      expectedCheckInTime: 1,
    });

    res.status(200).json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy chi tiết 1 đặt bàn
// @route   GET /api/reservations/:id
export const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    res.status(200).json({
      success: true,
      data: reservation,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Cập nhật thông tin đặt bàn (thông tin chung, không phải status)
// @route   PUT /api/reservations/:id
export const updateReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật đặt bàn thành công",
      data: reservation,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Xác nhận đặt bàn (Pending -> Confirmed)
// @route   PATCH /api/reservations/:id/confirm
export const confirmReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    if (reservation.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Không thể xác nhận vì trạng thái hiện tại là "${reservation.status}"`,
      });
    }

    reservation.status = "Confirmed";
    await reservation.save();

    res.status(200).json({
      success: true,
      message: "Xác nhận đặt bàn thành công",
      data: reservation,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Check-in khách (Confirmed/Pending -> CheckedIn), ghi nhận actualCheckInTime
// @route   PATCH /api/reservations/:id/checkin
export const checkInReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    if (!["Pending", "Confirmed"].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể check-in vì trạng thái hiện tại là "${reservation.status}"`,
      });
    }

    reservation.status = "CheckedIn";
    reservation.actualCheckInTime = new Date();
    await reservation.save();

    await Table.updateMany(
      { _id: { $in: await ReservationTable.find({ reservationId: reservation._id, status: "Active" }).distinct("tableId") } },
      { status: "Occupied" }
    );

    res.status(200).json({
      success: true,
      message: "Check-in thành công",
      data: reservation,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Hoàn thành đặt bàn (CheckedIn -> Completed)
// @route   PATCH /api/reservations/:id/complete
export const completeReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    if (reservation.status !== "CheckedIn") {
      return res.status(400).json({
        success: false,
        message: `Không thể hoàn thành vì trạng thái hiện tại là "${reservation.status}"`,
      });
    }

    const invoice = await Invoice.findOne({ reservationId: reservation._id });
    if (!invoice || invoice.status !== "Paid") {
      return res.status(400).json({
        success: false,
        message: "Cần thanh toán hóa đơn trước khi hoàn tất lượt đặt bàn",
      });
    }

    reservation.status = "Completed";
    await reservation.save();
    await releaseReservationTables(reservation._id);

    res.status(200).json({
      success: true,
      message: "Hoàn thành đặt bàn thành công",
      data: reservation,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Huỷ đặt bàn (Pending/Confirmed -> Cancelled)
// @route   PATCH /api/reservations/:id/cancel
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    if (!["Pending", "Confirmed"].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể huỷ vì trạng thái hiện tại là "${reservation.status}"`,
      });
    }

    const isStaff = ["admin", "staff"].includes(req.user?.role);
    const isOwner = String(reservation.bookedBy) === String(req.user?._id);
    if (!isStaff && !isOwner) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền hủy lượt đặt bàn này" });
    }

    const hoursUntilVisit = (new Date(reservation.expectedCheckInTime) - Date.now()) / (60 * 60 * 1000);
    const refundWindowHours = 24;
    const canRefundDeposit = hoursUntilVisit >= refundWindowHours;
    const cancellationReason = String(req.body?.reason || "Khách yêu cầu hủy").trim();

    reservation.status = "Cancelled";
    reservation.cancellationReason = cancellationReason;
    reservation.cancelledAt = new Date();
    reservation.cancelledBy = req.user?._id || null;
    reservation.depositRefunded = canRefundDeposit;
    await reservation.save();
    await releaseReservationTables(reservation._id);

    await Invoice.updateMany(
      { reservationId: reservation._id, status: { $in: ["Pending", "Finalized"] } },
      {
        status: "Cancelled",
        cancellationReason,
        depositRefunded: canRefundDeposit,
      },
    );

    res.status(200).json({
      success: true,
      message: canRefundDeposit
        ? "Huỷ đặt bàn thành công, tiền cọc đủ điều kiện hoàn lại"
        : "Huỷ đặt bàn thành công, tiền cọc không đủ điều kiện hoàn lại theo chính sách",
      data: reservation,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Đánh dấu khách không đến (Pending/Confirmed -> NoShow)
// @route   PATCH /api/reservations/:id/no-show
export const markNoShow = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    if (!["Pending", "Confirmed"].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: `Không thể đánh dấu no-show vì trạng thái hiện tại là "${reservation.status}"`,
      });
    }

    reservation.status = "NoShow";
    await reservation.save();
    await releaseReservationTables(reservation._id);

    res.status(200).json({
      success: true,
      message: "Đã đánh dấu khách không đến",
      data: reservation,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Xoá đặt bàn
// @route   DELETE /api/reservations/:id
export const deleteReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    if (req.user?.role !== "admin") {
      return res.status(403).json({ success: false, message: "Chỉ quản trị viên mới được xóa lượt đặt bàn" });
    }

    await releaseReservationTables(reservation._id);
    await Reservation.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Xoá đặt bàn thành công",
    });
  } catch (error) {
    handleError(res, error);
  }
};
