const express = require("express");
const Course = require("../models/Course");
const courseController = express.Router();
const verifyJWT = require("../middleware/requireAuth");
const { upload, uploadToImageKit, deleteFromImageKit } = require("../middleware/imagekit-course");

// get all courses
courseController.get("/getall", async (req, res) => {
  try {
    // Destructure and set default values for query parameters
    let { limit = 0, sort = "desc" } = req.query;

    // Validate 'limit' parameter to ensure it's a non-negative integer
    limit = parseInt(limit, 10);
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({ error: "Invalid 'limit' parameter" });
    }
    // Apply sensible defaults and caps to avoid timeouts on hosted envs
    if (limit === 0) {
      limit = 1000;
    }
    const MAX_LIMIT = 2000;
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }

    // Validate 'sort' parameter
    const sortOrder = sort.toLowerCase() === "asc" ? 1 : -1;

    const courses = await Course.find({})
      .select("-chapters")
      .sort({ createdAt: sortOrder })
      .limit(limit);

    // Get the chapter count for each course
    const coursesWithChapterCount = await Promise.all(
      courses.map(async (course) => {
        const fullCourse = await Course.findById(course._id);
        return {
          ...course.toObject(),
          chapterCount: fullCourse.chapters.length,
        };
      })
    );

    res.status(200).json(coursesWithChapterCount);
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

// create course
courseController.post("/create", upload.any(), async (req, res) => {
  const { title, description, category, published } = req.body;
  const files = req.files || [];

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
                const fieldName = `chapter_${chapterIndex}_slide_${slideIndex}_img`;
                const file = files.find((f) => f.fieldname === fieldName);
                if (file) {
                  const imageUrl = await uploadToImageKit(file, "Courses");
                  return { ...element, value: imageUrl };
                } else if (element.value && element.value.startsWith("http")) {
                  // If it's a URL, keep it as is
                  return element;
                }
              } else if (
                element.type === "audio" ||
                (element.type === "mix" && element.value && element.value.file)
              ) {
                const fieldName = `chapter_${chapterIndex}_slide_${slideIndex}_${
                  element.type === "mix" ? "mix_file" : element.type
                }`;
                const file = files.find((f) => f.fieldname === fieldName);
                if (file) {
                  const fileUrl = await uploadToImageKit(file, "Courses");
                  return {
                    ...element,
                    value:
                      element.type === "mix"
                        ? { ...element.value, file: fileUrl }
                        : fileUrl,
                  };
                }
              }
              // Preserve existing value if no new file is uploaded
              return element;
            })
          ),
        }))
      ),
    }))
  );

  const imageFile = files.find((file) => file.fieldname === "image");
  let imageUrl = "";
  if (imageFile) {
    imageUrl = await uploadToImageKit(imageFile, "Courses");
  }

  try {
    const newCourse = new Course({
      title,
      description,
      category,
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

// update course
courseController.put("/update/:id", upload.any(), async (req, res) => {
  try {
    const courseId = req.params.id;
    const { title, description, category, published } = req.body;
    const files = req.files || [];

    console.log(`[UPDATE] Updating course ${courseId}`);
    console.log(
      `[UPDATE] Files received:`,
      files.map((f) => ({ fieldname: f.fieldname, filename: f.filename }))
    );

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
                if (
                  element.type === "img" ||
                  element.type === "audio" ||
                  (element.type === "mix" && element.value.file)
                ) {
                  const fieldName = `chapter_${chapterIndex}_slide_${slideIndex}_${
                    element.type === "mix" ? "mix_file" : element.type
                  }`;
                  const file = files.find((f) => f.fieldname === fieldName);
                  if (file) {
                    console.log(
                      `[UPDATE] Found file for ${fieldName}, uploading to ImageKit`
                    );
                    const fileUrl = await uploadToImageKit(file, "Courses");
                    return {
                      ...element,
                      value:
                        element.type === "mix"
                          ? {
                              ...element.value,
                              file: fileUrl,
                            }
                          : fileUrl,
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

    course.title = title || course.title;
    course.description = description || course.description;
    course.category = category || course.category;
    course.published = published || course.published;
    course.chapters =
      updatedChapters.length > 0 ? updatedChapters : course.chapters;

    // CRITICAL FIX: Only update image if a new file was actually uploaded
    // Check if the image field contains a File object (new upload) not just a URL string
    const imageFile = files.find((file) => file.fieldname === "image");
    if (imageFile) {
      console.log(
        `[UPDATE] New image file detected for course ${courseId}, uploading to ImageKit`
      );
      const imageUrl = await uploadToImageKit(imageFile, "Courses");
      course.image = imageUrl;
    } else {
      console.log(
        `[UPDATE] No new image file for course ${courseId}, keeping existing image: ${course.image}`
      );
      // Keep the existing image - don't change it
    }

    await course.save();
    console.log(`[UPDATE] Successfully updated course ${courseId}`);
    res.status(200).json({ message: "Course updated successfully", course });
  } catch (error) {
    console.error(`[UPDATE ERROR] Error updating course:`, error);
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

    // Delete associated files from ImageKit
    await Promise.all([
      deleteFromImageKit(course.image).catch((err) => {
        console.error("Failed to delete course image:", err);
      }),
      ...course.chapters.flatMap((chapter) =>
        chapter.slides.flatMap((slide) =>
          slide.elements
            .filter(
              (element) =>
                element.type === "img" ||
                element.type === "audio" ||
                (element.type === "mix" && element.value.file)
            )
            .map((element) =>
              deleteFromImageKit(
                element.type === "mix" ? element.value.file : element.value
              ).catch((err) => {
                console.error("Failed to delete element file:", err);
              })
            )
        )
      ),
    ]);

    await Course.deleteOne({ _id: courseId });
    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = courseController;
