const mongoose = require("mongoose");

const CourseSchema = new mongoose.Schema(
  {
    elements: [
      {
        type: {
          type: String,
        },
        id: {
          type: String,
        },
        value: {
          type: String,
        },
        img: {
          type: String,
          default: null,
        },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
