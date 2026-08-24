import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema(
  {
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