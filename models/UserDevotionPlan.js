const mongoose = require("mongoose");

const userDevotionPlanSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DevotionPlan",
      required: true,
    },
    // Completed devotion item ids from the plan
    itemsCompleted: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Devotion",
      },
    ],
    status: {
      type: String,
      enum: ["in_progress", "completed"],
      default: "in_progress",
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
  },
  {
    timestamps: true,
    indexes: [{ userId: 1, planId: 1 }],
  }
);

const UserDevotionPlan = mongoose.model(
  "UserDevotionPlan",
  userDevotionPlanSchema
);
module.exports = UserDevotionPlan;


