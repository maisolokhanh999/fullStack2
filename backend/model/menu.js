import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    dishId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Dish",
      required: true,
    },
    displayOrder: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { _id: false, timestamps: true } // _id: false để mảng gọn, vẫn có createdAt/updatedAt riêng từng dòng
);

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Menu name is required"],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    image: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    startDate: {
      type: Date,
    },

    endDate: {
      type: Date,
      validate: {
        validator(value) {
          if (!value || !this.startDate) return true;
          return value >= this.startDate;
        },
        message: "End date must be greater than or equal to start date",
      },
    },

    items: {
      type: [menuItemSchema],
      default: [],
      validate: {
        validator(items) {
          // Chống trùng dishId trong cùng 1 menu
          const ids = items.map((i) => i.dishId.toString());
          return new Set(ids).size === ids.length;
        },
        message: "Menu có món ăn bị trùng",
      },
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Kiểm tra tất cả dishId trong items đều tồn tại và chưa bị xóa mềm
menuSchema.pre("save", async function () {
  if (!this.isModified("items") || this.items.length === 0) {
    return;
  }

  const Dish = mongoose.model("Dish");
  const ids = this.items.map((i) => i.dishId);

  const count = await Dish.countDocuments({
    _id: { $in: ids },
    isDeleted: false,
  });

  if (count !== ids.length) {
    throw new Error("Một hoặc nhiều món ăn không tồn tại hoặc đã bị xóa");
  }
});

menuSchema.pre(/^find/, function (next) {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

menuSchema.index(
  { name: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
menuSchema.index({ status: 1 });
menuSchema.index({ "items.dishId": 1 }); // hỗ trợ truy vấn "menu nào chứa món X"

export default mongoose.model("Menu", menuSchema);