import Review from "../../model/review.js";
import Reservation from "../../model/reservation.js";
import handleError from "../../middlewares/handleError/handleError.js";

export const createReview = async (req, res) => {
  try {
    const { reservationId, rating, comment = "" } = req.body;
    const reservation = await Reservation.findById(reservationId);

    if (!reservation) {
      return res.status(404).json({ success: false, message: "Không tìm thấy đặt bàn" });
    }

    if (String(reservation.bookedBy) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền đánh giá lượt đặt bàn này" });
    }

    if (reservation.status !== "Completed") {
      return res.status(400).json({ success: false, message: "Chỉ có thể đánh giá sau khi dùng bữa" });
    }

    const review = await Review.create({
      reservationId,
      userId: req.user._id,
      rating,
      comment,
    });

    res.status(201).json({ success: true, data: review, message: "Cảm ơn đánh giá của bạn" });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ success: false, message: "Bạn đã đánh giá lượt đặt bàn này" });
    }
    handleError(res, error);
  }
};

export const getReviews = async (req, res) => {
  try {
    const filter = { status: "Published" };
    if (req.query.reservationId) filter.reservationId = req.query.reservationId;

    const reviews = await Review.find(filter)
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    handleError(res, error);
  }
};