
function handleError(res, error) {
  // Lỗi trùng key (unique index) - VD: code món ăn trùng, tên menu trùng
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue || {})[0] || "Giá trị";
    const value = error.keyValue?.[field];
    return res.status(409).json({
      success: false,
      message: value
        ? `${field} "${value}" đã tồn tại`
        : `${field} đã tồn tại`,
    });
  }

  // Lỗi validate của Mongoose (required, min, max, enum, custom validator...)
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      message: messages.join(", "),
    });
  }

  // Lỗi ObjectId sai định dạng (VD: "123" không phải ObjectId hợp lệ)
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: `${error.path} không hợp lệ`,
    });
  }

  // Lỗi custom throw từ middleware (pre-save) như "không tồn tại", "bị trùng"...
  if (
    error.message?.includes("không tồn tại") ||
    error.message?.includes("bị trùng") ||
    error.message?.includes("đã bị xóa")
  ) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Lỗi không xác định - log để debug, không lộ chi tiết cho client
  console.error("[Unhandled Error]", error);
  return res.status(500).json({
    success: false,
    message: "Lỗi server, vui lòng thử lại sau",
  });
}

export default handleError;