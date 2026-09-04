import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["Published", "Hidden"],
      default: "Published",
    },
  },
  { timestamps: true },
);

reviewSchema.index({ reservationId: 1, userId: 1 }, { unique: true });

export default mongoose.model("Review", reviewSchema);