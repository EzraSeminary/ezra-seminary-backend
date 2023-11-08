const multer = require("multer");
const Course = require("../models/Course");
const courseController = require("express").Router();

// image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB limit
});

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

// create courses
courseController.post("/create", upload.any(), async (req, res) => {
  const elements = [];
  const files = req.files;

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

  files.forEach((file, index) => {
    const element = {
      type: "img",
      id: req.body.imageIds[index],
      value: file.filename,
      img: file.path,
    };
    elements.push(element);
  });

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

