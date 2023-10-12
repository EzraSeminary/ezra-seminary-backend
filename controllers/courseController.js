const Course = require("../models/Course");
const courseController = require("express").Router();

// get all courses
courseController.get("/getall", async (req, res) => {
  try {
    const courses = await Course.find({});

    // console.log(courses);

    return res.status(200).json(courses);
  } catch (error) {
    console.error(error);
  }
});

// // create a course
// courseController.post("/create", async (req, res) => {
//   try {
//     const newCourse = await Course.create({
//       ...req.body,
//     });

//     return res.status(201).json(newCourse);
//   } catch (error) {
//     return res.status(500).json(error);
//   }
// });

// create course
courseController.post("/create", async (req, res) => {
  try {
    // console.log(req.body);
    // console.log(req.files);
    const newCourse = await Course.create({
      title: req.body.title,
    });

    return res.status(201).json(newCourse);
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = courseController;
