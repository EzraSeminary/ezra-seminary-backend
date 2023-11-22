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
  },
  elements: {
    type: [ElementSchema],
  },
});

const chapterSchema = new mongoose.Schema({
  chapter: {
    type: String,
  },
  slides: {
    type: [slideSchema],
  },
});

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    image: {
      type: String,
    },
    chapters: {
      type: [chapterSchema],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
