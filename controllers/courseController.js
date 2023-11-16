const multer = require("multer");
const Course = require("../models/Course");
const courseController = require("express").Router();

// image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    cb(null, `${timestamp}-${file.originalname}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
});

// Get all courses
courseController.get("/getall", async (req, res) => {
  try {
    const courses = await Course.find({});
    res.status(200).json(courses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create a course
courseController.post("/create", upload.any(), async (req, res) => {
  const chapters = [];

  const { name, description } = req.body;
  const image = req.files[0].filename;

  const chapterKeys = Object.keys(req.body).filter((key) =>
    key.startsWith("chapter")
  );

  for (let chapterKey of chapterKeys) {
    const chapterIndex = chapterKey.split("-")[1];
    const slideKeys = Object.keys(req.body).filter((key) =>
      key.startsWith(`chapter-${chapterIndex}-slide`)
    );

    const slides = [];

    for (let slideKey of slideKeys) {
      const slideIndex = slideKey.split("-")[2];
      const elementKeys = Object.keys(req.body).filter((key) =>
        key.startsWith(`chapter-${chapterIndex}-slide-${slideIndex}-`)
      );

      const elements = [];

      for (let elementKey of elementKeys) {
        if (elementKey.endsWith("-title")) {
          const title = req.body[elementKey];
          elements.push({ type: "title", value: title });
        } else if (elementKey.endsWith("-subslide")) {
          const subslideIndex = elementKey.split("-")[4];
          const content = req.body[elementKey];
          elements.push({ type: "sub", value: content, subslides: [] });
        }
      }

      slides.push({ slide: `Slide ${slideIndex}`, elements });
    }

    chapters.push({ chapter: `Chapter ${chapterIndex}`, slides });
  }

  try {
    const newCourse = new Course({ name, description, image, chapters });
    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = courseController;
