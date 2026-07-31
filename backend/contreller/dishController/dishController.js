import Dish from "../../model/dish.js";

import handleError from "../../middlewares/handleError/handleError.js";

// GET /dishes?page=1&limit=10&categoryId=&status=&keyword=
export const getDishes = async (req, res) => {
  try {
    const { page = 1, limit = 10, categoryId, status, keyword } = req.query;

    const filter = {};
    if (categoryId) filter.categoryId = categoryId;
    if (status) filter.status = status;
    if (keyword) filter.$text = { $search: keyword };

    const skip = (Number(page) - 1) * Number(limit);

    const [dishes, total] = await Promise.all([
      Dish.find(filter)
        .populate("categoryId", "name")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Dish.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: dishes,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /dishes/:id
export const getDishById = async (req, res) => {
  try {
    const dish = await Dish.findById(req.params.id).populate("categoryId", "name");
    if (!dish) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món ăn" });
    }
    res.json({ success: true, data: dish });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /dishes
export const createDish = async (req, res) => {
  try {
    const dish = await Dish.create(req.body);
    res.status(201).json({ success: true, data: dish });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /dishes/:id
export const updateDish = async (req, res) => {
  try {
    const dish = await Dish.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      req.body,
      { new: true, runValidators: true }
    );

    if (!dish) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món ăn" });
    }

    res.json({ success: true, data: dish });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /dishes/:id  (xóa mềm)
export const deleteDish = async (req, res) => {
  try {
    const dish = await Dish.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, status: "Unavailable" },
      { new: true }
    );

    if (!dish) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món ăn" });
    }

    res.json({ success: true, message: "Đã xóa món ăn", data: dish });
  } catch (error) {
    handleError(res, error);
  }
};

// PATCH /dishes/:id/restore  (khôi phục món đã xóa)
export const restoreDish = async (req, res) => {
  try {
    const dish = await Dish.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { isDeleted: false, status: "Available" },
      { new: true }
    );

    if (!dish) {
      return res.status(404).json({ success: false, message: "Không tìm thấy món ăn đã xóa" });
    }

    res.json({ success: true, message: "Đã khôi phục món ăn", data: dish });
  } catch (error) {
    handleError(res, error);
  }
};