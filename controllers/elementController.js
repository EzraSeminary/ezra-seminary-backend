const express = require("express");
const Element = require("../models/Element");
const elementController = express.Router();
const upload = require("../middleware/upload");
const uploadImage = require("../middleware/cloudinary-course");

// Get all elements
elementController.get("/getall", async (req, res) => {
  try {
    const elements = await Element.find({});
    res.status(200).json(elements);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create element
elementController.post("/create", upload.any(), async (req, res) => {
  const elements = [];
  const files = req.files;
  const imageIds = JSON.parse(req.body.imageIds);

  for (let key in req.body) {
    if (key !== "images" && key !== "imageIds") {
      const element = {
        type: key.includes("title") ? "title" : "sub",
        id: key,
        value: req.body[key],
      };
      elements.push(element);
    }
  }

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const url = await uploadImage(file, "Courses");
      const element = {
        type: "img",
        id: imageIds[i],
        value: url,
      };
      const position = elements.findIndex((el) => el.id > imageIds[i]);
      elements.splice(position, 0, element);
    }

    const newElement = new Element({ elements });
    await newElement.save();
    res.status(201).json(newElement);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = elementController;
