import Category from "../../model/category.js";
import handleError from "../../middlewares/handleError/handleError.js";

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ createdAt: -1 });
    res.json(categories);
  } catch (error) {
    handleError(res, error);
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Tên danh mục là bắt buộc" });
    }

    const category = await Category.create({ name, description });
    res.status(201).json(category);
  } catch (error) {
    handleError(res, error);
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    res.json(category);
  } catch (error) {
    handleError(res, error);
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Danh mục không tồn tại" });
    }

    res.json({ message: "Xóa danh mục thành công" });
  } catch (error) {
    handleError(res, error);
  }
};
