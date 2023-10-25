const multer = require("multer");
const Course = require("../models/Course");
const courseController = require("express").Router();

// image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const upload = multer({ storage: storage });

// get all courses
courseController.get("/getall", async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// create course
courseController.post("/create", upload.any(), async (req, res) => {
  const elements = [];
  const files = {};

  req.files.forEach((file) => {
    files[file.fieldname] = file;
  });

  for (let key in req.body) {
    const { type, id, value } = JSON.parse(req.body[key]);
    let img = null;

    if (type === "img") {
      img = files[key] ? files[key].path : null;
    }

    elements.push({
      type,
      id,
      value,
      img,
    });
  }

  try {
    const newCourse = new Course({ elements });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = courseController;
