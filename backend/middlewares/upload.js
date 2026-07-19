import multer from 'multer';

const storage = multer.memoryStorage();

// Giới hạn file tối đa là 5MB (tùy chọn)
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

export default upload;