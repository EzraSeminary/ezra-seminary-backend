const { cloudinary, uploadImage } = require("../middleware/cloudinary");
const Course = require("../models/Course");
const courseController = require("express").Router();
const verifyJWT = require("../middleware/requireAuth");

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

//create course
courseController.post("/create", async (req, res) => {
  const { title, description, published } = req.body;
  const files = req.files || [];

  const imageUploadPromise = files.find((file) => file.fieldname === "image")
    ? uploadImage(files.find((file) => file.fieldname === "image"))
    : Promise.resolve(null);

  let chapters;
  try {
    if (typeof req.body.chapters === "string") {
      chapters = JSON.parse(req.body.chapters);
    } else {
      chapters = req.body.chapters;
    }
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }

  const updatedChapters = await Promise.all(
    chapters.map(async (chapter, chapterIndex) => ({
      ...chapter,
      slides: await Promise.all(
        chapter.slides.map(async (slide, slideIndex) => ({
          ...slide,
          elements: await Promise.all(
            slide.elements.map(async (element) => {
              if (element.type === "img") {
                const fieldName = `chapter_${chapterIndex}_slide_${slideIndex}_image`;
                const file = req.files.find((f) => f.fieldname === fieldName);
                if (file) {
                  const publicId = await uploadImage(file);
                  return {
                    ...element,
                    value: publicId,
                  };
                }
              }
              return element;
            })
          ),
        }))
      ),
    }))
  );

  const imagePublicId = await imageUploadPromise;

  try {
    const newCourse = new Course({
      title,
      description,
      image: imagePublicId,
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

// update course
courseController.put("/update/:id", async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, published } = req.body;
    const files = req.files || [];

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    let chapters;
    try {
      if (typeof req.body.chapters === "string") {
        chapters = JSON.parse(req.body.chapters || "[]");
      } else {
        chapters = req.body.chapters;
      }
    } catch (error) {
      return res.status(400).json({ message: error.message });
    }

    const updatedChapters = await Promise.all(
      chapters.map(async (chapter, chapterIndex) => ({
        ...chapter,
        slides: await Promise.all(
          chapter.slides.map(async (slide, slideIndex) => ({
            ...slide,
            elements: await Promise.all(
              slide.elements.map(async (element) => {
                if (element.type === "img") {
                  const fieldName = `chapter_${chapterIndex}_slide_${slideIndex}_image`;
                  const file = req.files.find((f) => f.fieldname === fieldName);
                  if (file) {
                    const publicId = await uploadImage(file);
                    return {
                      ...element,
                      value: publicId,
                    };
                  }
                }
                return element;
              })
            ),
          }))
        ),
      }))
    );

    const imageFile = files.find((file) => file.fieldname === "image");
    if (imageFile) {
      const imagePublicId = await uploadImage(imageFile);
      course.image = imagePublicId;
    }

    course.title = title || course.title;
    course.description = description || course.description;
    course.published = published || course.published;
    course.chapters =
      updatedChapters.length > 0 ? updatedChapters : course.chapters;

    await course.save();
    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// delete a course
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
