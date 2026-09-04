import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
    reservationCode: {
      type: String,
      unique: true,
      default: () => `BV-${Date.now().toString(36).toUpperCase()}`,
      trim: true,
    },

    customerName: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
    },

    customerPhone: {
      type: String,
      required: [true, "Customer phone is required"],
      trim: true,
    },

    // Tài khoản tạo lượt đặt, dùng để nhà hàng nhận diện người đặt thay vì
    // chỉ dựa vào tên người đến dùng bữa.
    bookedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    numberOfGuests: {
      type: Number,
      required: [true, "Number of guests is required"],
      min: 1,
    },

    depositAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    expectedCheckInTime: {
      type: Date,
      required: [true, "Expected check-in time is required"],
    },

    actualCheckInTime: {
      type: Date,
      default: null,
    },

    reservationType: {
      type: String,
      enum: ["WalkIn", "Online", "Phone"],
      default: "Online",
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "CheckedIn",
        "Completed",
        "Cancelled",
        "NoShow",
      ],
      default: "Pending",
    },

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    depositRefunded: {
      type: Boolean,
      default: false,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Reservation", reservationSchema);
