import mongoose from "mongoose";

const dishSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Category is required"],
    },

    code: {
      type: String,
      required: [true, "Dish code is required"],
      uppercase: true,
      trim: true,
    },

    name: {
      type: String,
      required: [true, "Dish name is required"],
      trim: true,
      maxlength: 100,
    },

    type: {
      type: String,
      enum: ["MainCourse", "SideDish", "Drink", "Dessert"],
      required: true,
    },

    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    servingUnit: {
      type: String,
      enum: [
        "Phần", "Suất", "Đĩa", "Tô", "Bát",
        "Ly", "Cốc", "Chai", "Lon", "Miếng", "Cái",
      ],
      required: true,
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

    isFeatured: {
      type: Boolean,
      default: false,
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

// ==== Đồng bộ status/stock ====
// Chỉ tự động chuyển đổi giữa Available <-> OutOfStock,
// KHÔNG đụng vào "Unavailable" (admin chủ động tắt bán)
function syncStockStatus(doc) {
  if (doc.stock <= 0 && doc.status === "Available") {
    doc.status = "OutOfStock";
  } else if (doc.stock > 0 && doc.status === "OutOfStock") {
    doc.status = "Available";
  }
}

// Chạy khi dùng .save() / .create()
dishSchema.pre("save", function (next) {
  syncStockStatus(this);
  next();
});

// Chạy khi dùng findByIdAndUpdate / findOneAndUpdate
// (bắt buộc phải có vì .save() không tự kích hoạt trong trường hợp này)
dishSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();
  if (update.stock === undefined) return next();

  // Cần query lại doc hiện tại để biết status trước đó
  this.model.findOne(this.getQuery()).then((doc) => {
    if (!doc) return next();
    const merged = { ...doc.toObject(), ...update, stock: update.stock };
    syncStockStatus(merged);
    update.status = merged.status;
    next();
  }).catch(next);
});

dishSchema.virtual("finalPrice").get(function () {
  return this.price - (this.price * this.discount) / 100;
});

dishSchema.set("toJSON", { virtuals: true });
dishSchema.set("toObject", { virtuals: true });

// ==== Tự động loại bỏ bản ghi đã xóa mềm khỏi mọi query find ====
dishSchema.pre(/^find/, function (next) {
  // Cho phép override bằng cách gọi .find({ isDeleted: true }) tường minh nếu cần
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// ==== Indexes ====
// Partial unique: chỉ enforce unique với các món CHƯA bị xóa mềm
dishSchema.index(
  { code: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
dishSchema.index({ name: "text", description: "text" });
dishSchema.index({ categoryId: 1, status: 1 });
dishSchema.index({ status: 1 });

export default mongoose.model("Dish", dishSchema);