const multer = require("multer");
const express = require("express");
const Course = require("../models/Course");
const courseController = require("express").Router();
const verifyJWT = require("../middleware/requireAuth");
const path = require("path");

// image upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/:/g, "-");
    const fileExtension = path.extname(file.originalname); // Extract file extension
    // Extract the base name without target location path
    const baseFileName = path.basename(file.originalname, fileExtension);
    // Prepend timestamp and append the original file extension
    cb(null, `${timestamp}-${baseFileName}${fileExtension}`);
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

// get a single chapter by its ID
courseController.get("/getchapter/:courseId/:chapterId", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;

    // First, we find the course by id
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Next, we find the chapter by id within the course
    const chapter = course.chapters.find(
      (chap) => chap._id.toString() === chapterId
    );

    if (!chapter) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    res.status(200).json(chapter);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

//create course
courseController.post("/create", upload.any(), async (req, res) => {
  const { title, description } = req.body;

  // Create a map for quick file lookups based on the multipart field name
  const fileMap = req.files.reduce((map, file) => {
    map[file.fieldname] = file.filename;
    return map;
  }, {});

  let chapters;
  try {
    chapters = JSON.parse(req.body.chapters);
  } catch (error) {
    return res
      .status(400)
      .json({ message: "Invalid chapters format: " + error.message });
  }

  // Functionality moved inside the POST route
  const updatedChapters = chapters.map((chapter, chapterIndex) => ({
    ...chapter,
    slides: chapter.slides.map((slide, slideIndex) => ({
      ...slide,
      elements: slide.elements.map((element) => {
        if (element.type === "img") {
          const fieldName = `chapter_${chapterIndex}_slide_${slideIndex}_image`;
          const file = req.files.find((f) => f.fieldname === fieldName);
          if (file) {
            return {
              ...element,
              value: file.filename, // Correctly reference the filename here
            };
          }
        }
        return element;
      }),
    })),
  }));
  console.log("Request Files:", req.files); // Log uploaded file details

  try {
    const newCourse = new Course({
      title,
      description,
      image: req.files.find((f) => f.fieldname === "image")?.filename || "",
      chapters: updatedChapters,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = courseController;
