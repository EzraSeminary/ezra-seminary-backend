const mongoose = require("mongoose");

const ElementSchema = new mongoose.Schema({
  type: {
    type: String,
  },
  id: {
    type: String,
  },
  value: {
    type: String,
  },
});

const slideSchema = new mongoose.Schema({
  slide: {
    type: String,
    required: true,
  },
  elements: {
    type: [ElementSchema],
    required: true,
  },
});

const chapterSchema = new mongoose.Schema({
  chapter: {
    type: String,
    required: true,
  },
  slides: {
    type: [slideSchema],
    required: true,
  },
});

const CourseSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    image: {
      type: String,
    },
    chapters: {
      type: [chapterSchema],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
