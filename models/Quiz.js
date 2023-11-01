const mongoose = require("mongoose");

const QuizSchema = new mongoose.Schema(
  {
    questions: [
      {
        text: {
          type: String,
          required: true,
        },
        options: [
          {
            id: {
              type: Number,
              required: true,
            },
            text: {
              type: String,
              required: true,
            },
            isCorrect: {
              type: Boolean,
              required: true,
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Quiz", QuizSchema);
