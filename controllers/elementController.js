const { cloudinary, uploadImage } = require("./cloudinary");
const Element = require("../models/Element");
const elementController = require("express").Router();

// get all courses
elementController.get("/getall", async (req, res) => {
  try {
    const courses = await Element.find({});
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// create courses
elementController.post("/create", async (req, res) => {
  const elements = [];
  const files = req.files;
  const imageIds = JSON.parse(req.body.imageIds);

  const imageUploadPromises = imageIds.map(async (imageId, index) => {
    const publicId = await uploadImage(files[index]);
    return {
      type: "img",
      id: imageId,
      value: publicId,
    };
  });

  const imageElements = await Promise.all(imageUploadPromises);
  imageElements.forEach((imageElement) => {
    const position = elements.findIndex((el) => el.id > imageElement.id);
    elements.splice(position, 0, imageElement);
  });

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
    const newCourse = new Element({ elements });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = elementController;
