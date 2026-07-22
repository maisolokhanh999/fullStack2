import mongoose from "mongoose";

const tableSchema = new mongoose.Schema(
  {
    tableNumber: {
      type: String,
      required: [true, "Table number is required"],
      unique: true,
      trim: true,
    },

    capacity: {
      type: Number,
      required: [true, "Capacity is required"],
      min: 1,
    },

    location: {
      type: String,
      default: "",
      trim: true,
    },

    note: {
      type: String,
      default: "",
      trim: true,
    },

    status: {
      type: String,
      enum: ["Available", "Occupied", "Reserved", "Cleaning"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Table", tableSchema);