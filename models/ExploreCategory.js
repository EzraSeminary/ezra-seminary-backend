const mongoose = require("mongoose");

const exploreCategorySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

exploreCategorySchema.index({ order: 1, createdAt: -1 });

module.exports = mongoose.model("ExploreCategory", exploreCategorySchema);

