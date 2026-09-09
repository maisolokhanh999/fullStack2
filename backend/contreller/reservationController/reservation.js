import { transitionReservation } from "../../services/reservationLifecycle.js";
import Reservation from "../../model/reservation.js"; // chỉnh lại path cho đúng

import { bookReservation } from "../../services/bookingService.js";
import handleError from "../../middlewares/handleError/handleError.js";
import QRCode from "qrcode";
import { notifyReservationCreated } from "../../services/notificationService.js";

export const expireLateReservations = async () => {
  const cutoff = new Date(Date.now() - 30 * 60 * 1000);
  const late = await Reservation.find({ status: { $in: ['Pending', 'Confirmed'] }, expectedCheckInTime: { $lte: cutoff } }).select('_id');
  for (const reservation of late) {
    try { await transitionReservation(reservation._id, 'no-show'); }
    catch (error) { if (![400, 404, 409].includes(error.status) && error.name !== 'VersionError') throw error; }
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

    const requestOrigin = req.headers.origin || "";
    const isLocalOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(requestOrigin);
    const frontendUrl = (
      isLocalOrigin ? requestOrigin : (process.env.FRONTEND_URL || requestOrigin || "http://localhost:5173")
    ).replace(/\/+$/, "");
    const link = `${frontendUrl}/bookings?reservation=${encodeURIComponent(reservation.reservationCode)}`;
    const qrCode = await QRCode.toDataURL(link, { margin: 1, width: 320 });

    res.status(200).json({
      success: true,
      data: { qrCode, link, reservation },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Tạo đặt bàn mới
// @route   POST /api/reservations
export const createReservation = async (req, res) => {
  try {
    const { reservation, invoice } = await bookReservation(req.user, req.body);

    res.status(201).json({
      success: true,
      message: "Tạo đặt bàn thành công",
      data: reservation,
      invoice,
    });

    notifyReservationCreated({
      email: req.user.email,
      phone: reservation.customerPhone,
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
    if (!["admin", "staff"].includes(req.user.role)) filter.bookedBy = req.user._id;

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
    // Status, owner and money belong to dedicated operations, never a generic PUT.
    const allowed = ["customerName", "customerPhone", "note"];
    const payload = Object.fromEntries(allowed.filter((key) => req.body[key] !== undefined).map((key) => [key, req.body[key]]));
    if (Object.keys(req.body).some((key) => !allowed.includes(key))) {
      return res.status(400).json({ success: false, message: "Chỉ được sửa tên khách, điện thoại và ghi chú" });
    }
    const reservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      payload,
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

const transition = (action) => async (req, res) => {
  try {
    const { reservation, message } = await transitionReservation(req.params.id, action, req.user, req.body);
    res.json({ success: true, data: reservation, message });
  } catch (error) { handleError(res, error); }
};
export const confirmReservation = transition('confirm');
export const checkInReservation = transition('checkin');
export const completeReservation = transition('complete');
export const cancelReservation = transition('cancel');
export const markNoShow = transition('no-show');
export const deleteReservation = transition('delete');
