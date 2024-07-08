// models/VideoLink.js
const mongoose = require("mongoose");

const VideoLinkSchema = new mongoose.Schema({
  year: { type: Number, required: true },
  quarter: { type: Number, required: true },
  lesson: { type: Number, required: true },
  videoUrl: { type: String, required: true },
});

// Compound index to ensure uniqueness of year-quarter-lesson combination
VideoLinkSchema.index({ year: 1, quarter: 1, lesson: 1 }, { unique: true });

module.exports = mongoose.model("VideoLink", VideoLinkSchema);
