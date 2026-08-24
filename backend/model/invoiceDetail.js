import mongoose from "mongoose";

const invoiceDetailSchema = new mongoose.Schema(
  {
    invoiceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: [true, "Invoice is required"],
    },

    dishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
    },

    menuId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Menu",
    },

    itemName: {
      type: String,
      required: [true, "Item name is required"],
      trim: true,
    },

    unitPrice: {
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

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
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

export default mongoose.model("InvoiceDetail", invoiceDetailSchema);