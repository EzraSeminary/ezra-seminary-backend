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
  },
  {
    timestamps: true,
  }
);

const Devotion = mongoose.model("Devotion", devotionSchema);

module.exports = Devotion;
