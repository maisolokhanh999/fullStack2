import User from "../../model/User.js";
import bcrypt from "bcrypt";
import handleError from "../../middlewares/handleError/handleError.js";

// Lấy tất cả user
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .sort({ createdAt: -1 });

    res.status(200).json(users);
  } catch (error) {
    handleError(res, error);
  }
};


// Lấy chi tiết user
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json(user);
  } catch (error) {
   handleError(res, error);
  }
};


// Cập nhật thông tin user
export const updateUser = async (req, res) => {
  try {
    const { name, email, phone, address, status } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name,
        email,
        phone,
        address,
        status,
      },
      {
        new: true,
        runValidators: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      message: "Cập nhật thành công",
      user,
    });
  } catch (error) {
    handleError(res, error);
  }
};


// Cập nhật quyền
export const updateRole = async (req, res) => {
  try {
    const { role } = req.body;

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role không hợp lệ",
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      {
        new: true,
      }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      message: "Cập nhật quyền thành công",
      user,
    });
  } catch (error) {
    handleError(res, error);
  }
};


// Đổi mật khẩu
export const updatePassword = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password || password.length < 6) {
      return res.status(400).json({
        message: "Mật khẩu phải có ít nhất 6 ký tự",
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        password: hashedPassword,
      },
      {
        new: true,
      }
    );

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      message: "Đổi mật khẩu thành công",
    });
  } catch (error) {
   handleError(res, error);
  }
};


// Xóa user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(
      req.params.id
    );

    if (!user) {
      return res.status(404).json({
        message: "Không tìm thấy người dùng",
      });
    }

    res.status(200).json({
      message: "Xóa người dùng thành công",
    });
  } catch (error) {
   handleError(res, error);
  }
};