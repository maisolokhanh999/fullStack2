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
      enum: ["Phần", "Suất", "Đĩa", "Tô", "Bát", "Ly", "Cốc", "Chai", "Lon", "Miếng", "Cái"],
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
  { timestamps: true }
);

// ── Đồng bộ status/stock ─────────────────────────────────────
function syncStockStatus(doc) {
  if (doc.stock <= 0 && doc.status === "Available") {
    doc.status = "OutOfStock";
  } else if (doc.stock > 0 && doc.status === "OutOfStock") {
    doc.status = "Available";
  }
}

// Khi dùng .save() / .create()
dishSchema.pre("save", async function () {
  syncStockStatus(this);
});

// Khi dùng findOneAndUpdate / findByIdAndUpdate
dishSchema.pre("findOneAndUpdate", async function () {
  const update = this.getUpdate();
  if (update.stock === undefined) return;

  const doc = await this.model.findOne(this.getQuery()).lean();
  if (!doc) return;

  const merged = { ...doc, ...update, stock: update.stock };
  syncStockStatus(merged);
  update.status = merged.status;
});

// ── Auto filter isDeleted ────────────────────────────────────
dishSchema.pre(/^find/, async function () {
  if (this.getFilter().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
});

// ── Virtual: giá sau giảm ────────────────────────────────────
dishSchema.virtual("finalPrice").get(function () {
  return this.price - (this.price * this.discount) / 100;
});

dishSchema.set("toJSON", { virtuals: true });
dishSchema.set("toObject", { virtuals: true });

// ── Indexes ──────────────────────────────────────────────────
dishSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });
dishSchema.index({ name: "text", description: "text" });
dishSchema.index({ categoryId: 1, status: 1 });
dishSchema.index({ status: 1 });

export default mongoose.model("Dish", dishSchema);