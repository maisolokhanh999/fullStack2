import express from 'express';
import upload from '../middlewares/upload.js';
import { uploadFile } from '../controller/uploadController.js';

const router = express.Router();
 // Middleware để xử lý upload file
// Định nghĩa route post nhận key là 'file'
router.post('/', upload.single('file'), uploadFile);

export default router;