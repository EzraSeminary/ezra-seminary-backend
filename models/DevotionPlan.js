const mongoose = require("mongoose");

const devotionPlanSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    image: { type: String, default: "" }, // Cloudinary URL or local filename
    // Array of Devotion ObjectIds that make up the plan, ordered
    items: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Devotion",
      },
    ],
    published: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

// Virtual for number of items
devotionPlanSchema.virtual("numItems").get(function () {
  return Array.isArray(this.items) ? this.items.length : 0;
});

const DevotionPlan = mongoose.model("DevotionPlan", devotionPlanSchema);
module.exports = DevotionPlan;


