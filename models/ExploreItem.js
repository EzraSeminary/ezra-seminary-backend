const mongoose = require("mongoose");

const exploreItemSchema = new mongoose.Schema(
  {
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExploreCategory",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    imageUrl: { type: String, default: "" },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    fileType: { type: String, default: "file" }, // pdf | ppt | pptx | file
    order: { type: Number, default: 0 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

exploreItemSchema.index({ categoryId: 1, order: 1, createdAt: -1 });

module.exports = mongoose.model("ExploreItem", exploreItemSchema);

