import express from 'express';
import { uploadFile } from '../contreller/uploadController/uploadController.js';
import upload from '../middlewares/upload/upload.js';

const router = express.Router();

// Middleware để xử lý upload file
// Định nghĩa route post nhận key là 'file'
router.post('/', upload.single('file'), uploadFile);

export default router;