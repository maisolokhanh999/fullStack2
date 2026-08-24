import ReservationTable from "../../model/reservationTable.js"; // chỉnh lại path cho đúng
import Reservation from "../../model/reservation.js";
import Table from "../../model/table.js";
import handleError from "../../middlewares/handleError/handleError.js";

// @desc    Gán bàn cho một đặt bàn
// @route   POST /api/reservation-tables
export const assignTableToReservation = async (req, res) => {
  try {
    const { reservationId, tableId } = req.body;

    // Kiểm tra reservation và table có tồn tại không
    const reservation = await Reservation.findById(reservationId);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đặt bàn",
      });
    }

    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bàn",
      });
    }

    if (table.status !== "Available") {
      return res.status(400).json({
        success: false,
        message: "Bàn này không còn khả dụng",
      });
    }

    if (table.capacity < reservation.numberOfGuests) {
      return res.status(400).json({
        success: false,
        message: "Bàn không đủ chỗ cho số khách",
      });
    }

    // Kiểm tra bàn đã được gán (Active) cho reservation khác chưa
    const existingActive = await ReservationTable.findOne({
      tableId,
      status: "Active",
    });
    if (existingActive) {
      return res.status(400).json({
        success: false,
        message: "Bàn này đang được gán cho một đặt bàn khác",
      });
    }

    const reservationTable = await ReservationTable.create({
      reservationId,
      tableId,
    });

    // Cập nhật trạng thái bàn thành Reserved
    table.status = "Reserved";
    await table.save();

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

// @desc    Bỏ gán bàn (Active -> Inactive), đưa bàn về Available
// @route   PATCH /api/reservation-tables/:id/release
export const releaseTable = async (req, res) => {
  try {
    const reservationTable = await ReservationTable.findById(req.params.id);

    if (!reservationTable) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi gán bàn",
      });
    }

    if (reservationTable.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: `Không thể huỷ gán vì trạng thái hiện tại là "${reservationTable.status}"`,
      });
    }

    reservationTable.status = "Inactive";
    await reservationTable.save();

    // Đưa bàn về trạng thái Available
    await Table.findByIdAndUpdate(reservationTable.tableId, {
      status: "Available",
    });

    res.status(200).json({
      success: true,
      message: "Bỏ gán bàn thành công",
      data: reservationTable,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Chặn bản ghi gán bàn (dùng khi có sự cố, ví dụ đặt trùng)
// @route   PATCH /api/reservation-tables/:id/block
export const blockReservationTable = async (req, res) => {
  try {
    const reservationTable = await ReservationTable.findByIdAndUpdate(
      req.params.id,
      { status: "Blocked" },
      { new: true, runValidators: true }
    );

    if (!reservationTable) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi gán bàn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Đã chặn bản ghi gán bàn",
      data: reservationTable,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Xoá bản ghi gán bàn
// @route   DELETE /api/reservation-tables/:id
export const deleteReservationTable = async (req, res) => {
  try {
    const reservationTable = await ReservationTable.findByIdAndDelete(
      req.params.id
    );

    if (!reservationTable) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi gán bàn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xoá bản ghi gán bàn thành công",
    });
  } catch (error) {
    handleError(res, error);
  }
};