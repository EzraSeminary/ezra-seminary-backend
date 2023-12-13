// models/Devotion.js

const mongoose = require("mongoose");

const devotionSchema = new mongoose.Schema(
  {
    month: String,
    day: String,
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
