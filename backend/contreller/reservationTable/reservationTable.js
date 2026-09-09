import { editAssignment } from "../../services/tableManagement.js";
import ReservationTable from "../../model/reservationTable.js"; // chỉnh lại path cho đúng
import Reservation from "../../model/reservation.js";
import Table from "../../model/table.js";
import handleError from "../../middlewares/handleError/handleError.js";
import mongoose from "mongoose";
import { reject } from "../../services/bookingService.js";

// @desc    Gán bàn cho một đặt bàn
// @route   POST /api/reservation-tables
export const assignTableToReservation = async (req, res) => {
  try {
    const { reservationId, tableId } = req.body;

    const reservationTable = await mongoose.connection.transaction(async (session) => {
      // Write to the reservation as well so assignment conflicts with cancellation.
      const reservation = await Reservation.findOneAndUpdate(
        { _id: reservationId, status: { $in: ["Pending", "Confirmed", "CheckedIn"] } },
        { $inc: { __v: 1 } }, { returnDocument: 'after', session },
      );
      if (!reservation) reject("Đặt bàn không tồn tại hoặc đã kết thúc", 409);
      const existing = await ReservationTable.exists({ tableId, status: "Active" }).session(session);
      if (existing) reject("Bàn đã được gán cho một đặt bàn khác", 409);
      const table = await Table.findOneAndUpdate(
        { _id: tableId, status: "Available", capacity: { $gte: reservation.numberOfGuests } },
        { status: reservation.status === "CheckedIn" ? "Occupied" : "Reserved" },
        { returnDocument: 'after', session },
      );
      if (!table) reject("Bàn không còn khả dụng hoặc không đủ chỗ", 409);
      const [assignment] = await ReservationTable.create([{ reservationId, tableId }], { session });
      return assignment;
    });

    res.status(201).json({
      success: true,
      message: "Gán bàn thành công",
      data: reservationTable,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy danh sách gán bàn (có thể filter theo reservationId, tableId, status)
// @route   GET /api/reservation-tables
export const getReservationTables = async (req, res) => {
  try {
    const { reservationId, tableId, status } = req.query;
    const filter = {};

    if (reservationId) filter.reservationId = reservationId;
    if (tableId) filter.tableId = tableId;
    if (status) filter.status = status;
    if (!["admin", "staff"].includes(req.user.role)) {
      const owned = await Reservation.find({ bookedBy: req.user._id }).select("_id");
      const ids = owned.map((item) => item._id);
      if (reservationId && !ids.some((id) => String(id) === reservationId)) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xem đặt bàn này" });
      }
      filter.reservationId = reservationId || { $in: ids };
    }

    const reservationTables = await ReservationTable.find(filter)
      .populate("reservationId")
      .populate("tableId")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reservationTables.length,
      data: reservationTables,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy chi tiết 1 bản ghi gán bàn
// @route   GET /api/reservation-tables/:id
export const getReservationTableById = async (req, res) => {
  try {
    const reservationTable = await ReservationTable.findById(req.params.id)
      .populate("reservationId")
      .populate("tableId");

    if (!reservationTable) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi gán bàn",
      });
    }

    res.status(200).json({
      success: true,
      data: reservationTable,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy tất cả bàn đang gán cho 1 reservation
// @route   GET /api/reservations/:reservationId/tables
export const getTablesByReservation = async (req, res) => {
  try {
    const reservationTables = await ReservationTable.find({
      reservationId: req.params.reservationId,
      status: "Active",
    }).populate("tableId");

    res.status(200).json({
      success: true,
      count: reservationTables.length,
      data: reservationTables,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const edit = (action) => async (req, res) => {
  try {
    const assignment = await editAssignment(req.params.id, action);
    res.json({ success: true, data: assignment, message: "Cập nhật gán bàn thành công" });
  } catch (error) { handleError(res, error); }
};
export const releaseTable = edit('release');
export const blockReservationTable = edit('block');
export const deleteReservationTable = edit('delete');
