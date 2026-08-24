import Reservation from "../../model/reservation.js"; // chỉnh lại path cho đúng
import Invoice from "../../model/invoice.js";
import ReservationTable from "../../model/reservationTable.js";
import Table from "../../model/table.js";
import handleError from "../../middlewares/handleError/handleError.js";

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

// @desc    Tạo đặt bàn mới
// @route   POST /api/reservations
export const createReservation = async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      numberOfGuests,
      depositAmount = 0,
      expectedCheckInTime,
      reservationType,
      note,
    } = req.body;

    const reservation = await Reservation.create({
      customerName,
      customerPhone,
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

    res.status(201).json({
      success: true,
      message: "Tạo đặt bàn thành công",
      data: reservation,
      invoice,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy danh sách đặt bàn (filter theo status, loại đặt, ngày)
// @route   GET /api/reservations
export const getReservations = async (req, res) => {
  try {
    const { status, reservationType, date, query } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (reservationType) filter.reservationType = reservationType;
    if (query?.trim()) {
      const searchValue = query.trim();
      filter.$or = [
        { reservationCode: searchValue },
        { customerPhone: searchValue },
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

    const reservations = await Reservation.find(filter).sort({
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

    reservation.status = "Completed";
    await reservation.save();

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

    reservation.status = "Cancelled";
    await reservation.save();
    await releaseReservationTables(reservation._id);

    res.status(200).json({
      success: true,
      message: "Huỷ đặt bàn thành công",
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