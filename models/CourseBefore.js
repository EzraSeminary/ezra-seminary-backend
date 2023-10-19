const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    title: [
      {
        title1: {
          type: String,
        },
        title2: {
          type: String,
        },
      },
    ],
    sub: [
      {
        sub1: {
          type: String,
        },
        sub2: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
