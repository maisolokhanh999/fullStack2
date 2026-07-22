import mongoose from "mongoose";

const reservationTableSchema = new mongoose.Schema(
  {
    reservationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reservation",
      required: [true, "Reservation is required"],
    },

    tableId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Table",
      required: [true, "Table is required"],
    },
  },
  {
    timestamps: {
      createdAt: true,
      updatedAt: false,
    },
     status: {
      type: String,
      enum: ["Active", "Inactive", "Blocked"],
      default: "Active",
    },
  }
);

export default mongoose.model("ReservationTable", reservationTableSchema);