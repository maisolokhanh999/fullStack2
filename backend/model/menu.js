import mongoose from "mongoose";

const menuSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    name: {
      type: String,
      required: [true, "Menu item name is required"],
      trim: true,
    },

    type: {
      type: String,
      enum: ["MainCourse", "SideDish", "Drink", "Dessert", "Combo"],
      required: true,
    },

    description: {
      type: String,
      default: "",
    },

    servingUnit: {
      type: String,
      required: true,
      trim: true,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    stock: {
      type: Number,
      default: 0,
      min: 0,
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Available", "OutOfStock", "Unavailable"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Menu", menuSchema);