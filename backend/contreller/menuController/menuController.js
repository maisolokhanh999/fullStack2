import Menu from "../../model/menu.js";
import handleError from "../../middlewares/handleError/handleError.js";


// GET /menus
export const getMenus = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const skip = (Number(page) - 1) * Number(limit);

    const [menus, total] = await Promise.all([
      Menu.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Menu.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: menus,
      pagination: { total, page: Number(page), limit: Number(limit), totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    handleError(res, error);
  }
};

// GET /menus/:id  (kèm chi tiết từng món)
export const getMenuById = async (req, res) => {
  try {
    const menu = await Menu.findById(req.params.id).populate("items.dishId");
    if (!menu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy menu" });
    }
    res.json({ success: true, data: menu });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /menus
export const createMenu = async (req, res) => {
  try {
    const menu = await Menu.create(req.body);
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /menus/:id  (cập nhật thông tin chung, không đụng items)
export const updateMenu = async (req, res) => {
  try {
    const { items, ...rest } = req.body; // items xử lý qua API riêng bên dưới
    const menu = await Menu.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      rest,
      { new: true, runValidators: true }
    );
    if (!menu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy menu" });
    }
    res.json({ success: true, data: menu });
  } catch (error) {
    handleError(res, error);
  }
};

// POST /menus/:id/items  { dishId }  — thêm 1 món vào menu
export const addDishToMenu = async (req, res) => {
  try {
    const menu = await Menu.findOne({ _id: req.params.id, isDeleted: false });
    if (!menu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy menu" });
    }

    const exists = menu.items.some((i) => i.dishId.toString() === req.body.dishId);
    if (exists) {
      return res.status(409).json({ success: false, message: "Món ăn đã có trong menu" });
    }

    const maxOrder = menu.items.reduce((max, i) => Math.max(max, i.displayOrder), 0);
    menu.items.push({ dishId: req.body.dishId, displayOrder: maxOrder + 1 });

    await menu.save();
    const populated = await menu.populate("items.dishId");

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /menus/:id/items/:dishId  — bỏ 1 món khỏi menu
export const removeDishFromMenu = async (req, res) => {
  try {
    const menu = await Menu.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { $pull: { items: { dishId: req.params.dishId } } },
      { new: true }
    );
    if (!menu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy menu" });
    }
    res.json({ success: true, data: menu });
  } catch (error) {
    handleError(res, error);
  }
};

// PUT /menus/:id/items/reorder  { orders: [{ dishId, displayOrder }] }
export const reorderMenuItems = async (req, res) => {
  try {
    const menu = await Menu.findOne({ _id: req.params.id, isDeleted: false });
    if (!menu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy menu" });
    }

    const orderMap = new Map(req.body.orders.map((o) => [o.dishId, o.displayOrder]));
    menu.items.forEach((item) => {
      const newOrder = orderMap.get(item.dishId.toString());
      if (newOrder !== undefined) item.displayOrder = newOrder;
    });

    await menu.save();
    res.json({ success: true, data: menu });
  } catch (error) {
    handleError(res, error);
  }
};

// DELETE /menus/:id  (xóa mềm)
export const deleteMenu = async (req, res) => {
  try {
    const menu = await Menu.findOneAndUpdate(
      { _id: req.params.id, isDeleted: false },
      { isDeleted: true, status: "Inactive" },
      { new: true }
    );
    if (!menu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy menu" });
    }
    res.json({ success: true, message: "Đã xóa menu", data: menu });
  } catch (error) {
    handleError(res, error);
  }
};

// PATCH /menus/:id/restore
export const restoreMenu = async (req, res) => {
  try {
    const menu = await Menu.findOneAndUpdate(
      { _id: req.params.id, isDeleted: true },
      { isDeleted: false, status: "Active" },
      { new: true }
    );
    if (!menu) {
      return res.status(404).json({ success: false, message: "Không tìm thấy menu đã xóa" });
    }
    res.json({ success: true, message: "Đã khôi phục menu", data: menu });
  } catch (error) {
    handleError(res, error);
  }
};