import User from "../../model/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import handleError from "../../middlewares/handleError/handleError.js";

const createToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

export const register = async (req, res) => {
  try {
    const { name, email, password, phone, address } = req.body;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedPhone = String(phone ?? '').trim();

    if (!name?.trim() || !normalizedEmail || !password || !normalizedPhone || !address?.trim()) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Email chưa đúng định dạng" });
    }

    if (!/^\d{9,10}$/.test(normalizedPhone)) {
      return res.status(400).json({ message: "Số điện thoại cần có 9 đến 10 chữ số" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 6 ký tự" });
    }

    const existUser = await User.findOne({ email: normalizedEmail });

    if (existUser) {
      return res.status(400).json({ message: "Email đã tồn tại" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      phone: Number(normalizedPhone),
      address: address.trim(),
    });

    const token = createToken(user._id);

    res.status(201).json({
      message: "Đăng ký thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Vui lòng nhập email và mật khẩu" });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(400).json({ message: "Tài khoản không tồn tại" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Sai mật khẩu" });
    }

    const token = createToken(user._id);

    res.json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        address: user.address,
        role: user.role,
      },
    });
  } catch (error) {
    handleError(res, error);
  }
};

export const getMe = async (req, res) => {
  res.json({ user: req.user });
};
