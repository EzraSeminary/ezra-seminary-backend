const mongoose = require("mongoose");

const ElementSchema = new mongoose.Schema(
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
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Element", ElementSchema);
