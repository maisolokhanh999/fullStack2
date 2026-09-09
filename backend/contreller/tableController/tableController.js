import { editTable } from "../../services/tableManagement.js";
import Table from "../../model/table.js"; // chỉnh lại path cho đúng
import handleError from "../../middlewares/handleError/handleError.js";

// @desc    Tạo bàn mới
// @route   POST /api/tables
export const createTable = async (req, res) => {
  try {
    const { tableNumber, capacity, location, note, status } = req.body;

    const existing = await Table.findOne({ tableNumber });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Số bàn này đã tồn tại",
      });
    }

    const table = await Table.create({
      tableNumber,
      capacity,
      location,
      note,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Tạo bàn thành công",
      data: table,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy danh sách tất cả bàn (có thể filter theo status)
// @route   GET /api/tables
export const getTables = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};

    const tables = await Table.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: tables.length,
      data: tables,
    });
  } catch (error) {
    handleError(res, error);
  }
};

// @desc    Lấy chi tiết 1 bàn theo id
// @route   GET /api/tables/:id
export const getTableById = async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bàn",
      });
    }

    res.status(200).json({
      success: true,
      data: table,
    });
  } catch (error) {
    handleError(res, error);
  }
};

const edit = (remove = false) => async (req, res) => {
  try {
    const table = await editTable(req.params.id, req.body || {}, remove);
    res.json({ success: true, data: table, message: "Cập nhật bàn thành công" });
  } catch (error) { handleError(res, error); }
};
export const updateTable = edit();
export const updateTableStatus = async (req, res) => {
  if (!["Available", "Occupied", "Reserved", "Cleaning"].includes(req.body?.status)) return res.status(400).json({ success: false, message: "Trạng thái không hợp lệ" });
  try {
    const table = await editTable(req.params.id, { status: req.body.status });
    res.json({ success: true, data: table });
  } catch (error) { handleError(res, error); }
};
export const deleteTable = edit(true);
