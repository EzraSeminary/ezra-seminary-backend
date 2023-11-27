const multer = require("multer");
const Course = require("../models/Course");
// const chapterSchema = require("../models/Chapter");
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

// get a single course
courseController.get("/get/:id", async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    res.status(200).json(course);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// get a single chapter by ID
courseController.get("/getChapter/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const chapter = await chapterSchema.findById(id);
    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }
    res.status(200).json(chapter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// create courses
courseController.post("/create", upload.any(), async (req, res) => {
  const { title, description, chapters } = req.body;
  const files = req.files;
  const imageIds = req.body.imageIds ? JSON.parse(req.body.imageIds) : [];

  const imageElements = imageIds.map((imageId, index) => ({
    type: "img",
    id: imageId,
    value: files[index].filename,
  }));

  const modifiedChapters = chapters.map((chapter) => ({
    ...chapter,
    slides: chapter.slides.map((slide) => ({
      ...slide,
      elements: [
        ...slide.elements,
        ...imageElements.filter((imgEl) => imgEl.id.startsWith(slide.slide)),
      ],
    })),
  }));

  try {
    const newCourse = new Course({
      title,
      description,
      image: files && files.length > 0 ? files[0].filename : "", // assuming the first image is the course image, if available
      chapters: modifiedChapters,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = courseController;
