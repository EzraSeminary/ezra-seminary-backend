const express = require("express");
const Course = require("../models/Course");
const courseController = express.Router();
const upload = require("../middleware/upload");
const uploadImage = require("../middleware/cloudinary-course");

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

// Get a single course
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

// Create course
courseController.post("/create", upload.any(), async (req, res) => {
  const { title, description, published } = req.body;
  const files = req.files || [];

  try {
    const chapters = JSON.parse(req.body.chapters || "[]");

    const updatedChapters = chapters.map((chapter, chapterIndex) => ({
      ...chapter,
      slides: chapter.slides.map((slide, slideIndex) => ({
        ...slide,
        elements: slide.elements.map((element) => {
          if (element.type === "img" || element.type === "audio") {
            const fieldName = `chapter_${chapterIndex}_slide_${slideIndex}_${element.type}`;
            const file = files.find((f) => f.fieldname === fieldName);
            if (file) {
              return { ...element, value: file.filename };
            }
          }
          return element;
        }),
      })),
    }));

    const imageFile = files.find((file) => file.fieldname === "image");
    const imageUrl = imageFile ? await uploadImage(imageFile, "Courses") : "";

    const newCourse = new Course({
      title,
      description,
      image: imageUrl,
      chapters: updatedChapters,
      published,
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update course
courseController.put("/update/:id", upload.any(), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, published } = req.body;
    const files = req.files || [];

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const chapters = JSON.parse(req.body.chapters || "[]");

    const updatedChapters = chapters.map((chapter, chapterIndex) => ({
      ...chapter,
      slides: chapter.slides.map((slide, slideIndex) => ({
        ...slide,
        elements: slide.elements.map((element) => {
          if (element.type === "img" || element.type === "audio") {
            const fieldName = `chapter_${chapterIndex}_slide_${slideIndex}_${element.type}`;
            const file = files.find((f) => f.fieldname === fieldName);
            if (file) {
              return { ...element, value: file.filename };
            }
          }
          return element;
        }),
      })),
    }));

    course.title = title || course.title;
    course.description = description || course.description;
    course.published = published || course.published;
    course.chapters =
      updatedChapters.length > 0 ? updatedChapters : course.chapters;

    const imageFile = files.find((file) => file.fieldname === "image");
    if (imageFile) {
      course.image = await uploadImage(imageFile, "Courses");
    }

    await course.save();
    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get a single chapter by its ID
courseController.get("/getchapter/:courseId/:chapterId", async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const chapterId = req.params.chapterId;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

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

// Delete course
courseController.delete("/delete/:id", async (req, res) => {
  const courseId = req.params.id;
  try {
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    await Course.deleteOne({ _id: courseId });
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = courseController;
