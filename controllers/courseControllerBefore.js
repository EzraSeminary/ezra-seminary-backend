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

// create course
courseController.post("/create", async (req, res) => {
  try {
    // console.log(req.body);
    // console.log(req.files);
    const { title, sub } = req.body;
    const newCourse = await Course.create({
      // title: req.body.title,
      title: title.map((item) => ({
        title1: item.title1,
        title2: item.title2,
      })),
      sub: sub.map((item) => ({
        sub1: item.sub1,
        sub2: item.sub2,
      })),
    });

    // await newCourse.save();

    return res.status(201).json(newCourse);
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = courseController;
