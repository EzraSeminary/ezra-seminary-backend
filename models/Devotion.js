// models/Devotion.js

const mongoose = require("mongoose");

const devotionSchema = new mongoose.Schema(
  {
    month: String,
    day: String,
    year: {
      type: Number,
      required: true,
      default: function () {
        // Get current Ethiopian year as default
        const { getCurrentEthiopianYear } = require("../utils/devotionUtils");
        return getCurrentEthiopianYear();
      },
    },
    title: String,
    chapter: String,
    verse: String,
    body: [String],
    prayer: String,
    image: String,
    // Optional: when this devotion belongs to a specific devotion plan
    planId: { type: mongoose.Schema.Types.ObjectId, ref: "DevotionPlan" },
  },
  {
    timestamps: true,
  }
);

// after schema definition
devotionSchema.index({ year: 1, createdAt: -1 });
devotionSchema.index({ createdAt: -1 });
devotionSchema.index({ planId: 1, createdAt: -1 });
const Devotion = mongoose.model("Devotion", devotionSchema);

module.exports = Devotion;
