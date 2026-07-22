import mongoose from "mongoose";

const loginHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
    },

    loginTime: {
      type: Date,
      default: Date.now,
    },

    ipAddress: {
      type: String,
      required: [true, "IP address is required"],
      trim: true,
    },

    status: {
      type: String,
      enum: ["Success", "Failed"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("LoginHistory", loginHistorySchema);