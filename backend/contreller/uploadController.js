import { v2 as cloudinary } from 'cloudinary';

export const uploadFile = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Không có tệp được tải lên.' });
    }

    // Chuyển đổi file từ buffer sang chuỗi Base64
    const dataUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    const fileName = file.originalname.split('.')[0];

    // Upload lên Cloudinary bằng async/await
    const result = await cloudinary.uploader.upload(dataUrl, {
      folder: 'uploads', // Thêm folder để quản lý ảnh gọn gàng hơn
      public_id: `${Date.now()}-${fileName}`, // Thêm timestamp tránh trùng tên file
      resource_type: 'auto',
    });

    // Trả kết quả về cho Client sau khi upload thành công
    return res.status(200).json({ 
      message: 'Tệp được tải lên thành công.', 
      secure_url: result.secure_url, // URL này dùng để lưu vào Database
      public_id: result.public_id 
    });

  } catch (error) {
    console.error('Lỗi upload:', error);
    return res.status(500).json({ error: 'Có lỗi xảy ra trong quá trình upload.' });
  }
};