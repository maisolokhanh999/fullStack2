import express from "express";
import { createReview, getReviews } from "../contreller/reviewController/review.js";
import { authMiddleware } from "../middlewares/authMiddleware/authMiddleware.js";

const router = express.Router();

router.get("/", getReviews);
router.post("/", authMiddleware, createReview);

export default router;