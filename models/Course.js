const mongoose = require("mongoose");

const subSlideSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
});

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
  subslides: {
    type: [subSlideSchema],
    required: true,
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
      required: true,
    },
    chapters: {
      type: [chapterSchema],
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
