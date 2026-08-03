import Table from "../../model/table.js"; // chỉnh lại path cho đúng

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
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật thông tin bàn
// @route   PUT /api/tables/:id
export const updateTable = async (req, res) => {
  try {
    const { tableNumber } = req.body;

    // Nếu đổi số bàn, kiểm tra trùng với bàn khác
    if (tableNumber) {
      const existing = await Table.findOne({
        tableNumber,
        _id: { $ne: req.params.id },
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: "Số bàn này đã tồn tại",
        });
      }
    }

    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bàn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật bàn thành công",
      data: table,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cập nhật trạng thái bàn (dùng riêng cho thao tác nhanh)
// @route   PATCH /api/tables/:id/status
export const updateTableStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatus = ["Available", "Occupied", "Reserved", "Cleaning"];

    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Trạng thái không hợp lệ",
      });
    }

    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bàn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật trạng thái thành công",
      data: table,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Xoá bàn
// @route   DELETE /api/tables/:id
export const deleteTable = async (req, res) => {
  try {
    const table = await Table.findByIdAndDelete(req.params.id);

    if (!table) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bàn",
      });
    }

    res.status(200).json({
      success: true,
      message: "Xoá bàn thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};