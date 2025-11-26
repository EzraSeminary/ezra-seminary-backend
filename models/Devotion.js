// models/Devotion.js

const mongoose = require("mongoose");

const devotionSchema = new mongoose.Schema(
  {
    month: String,
    day: String,
    year: {
      type: Number,
      required: function() {
        // Only required if not part of a plan
        return !this.planId;
      },
      default: function () {
        // Get current Ethiopian year as default for non-plan devotions
        if (!this.planId) {
          const { getCurrentEthiopianYear } = require("../utils/devotionUtils");
          return getCurrentEthiopianYear();
        }
        return undefined;
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
    order: {
      type: Number,
      default: 0, // Used for ordering devotions within a plan
    },
    // Likes: array of user IDs who liked this devotion
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Comments: array of comment objects
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        text: {
          type: String,
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
