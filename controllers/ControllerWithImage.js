// const Course = require("../models/Course");
// const multer = require("multer");
// const courseController = require("express").Router();

// // image upload
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, "public/images");
//   },
//   filename: (req, file, cb) => {
//     cb(null, new Date().toISOString() + file.originalname);
//   },
// });

// const upload = multer({ storage: storage });

// // get all courses
// courseController.get("/getall", async (req, res) => {
//   try {
//     const courses = await Course.find({});
//     res.status(200).json(courses);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// // create course
// courseController.post("/create", upload.array("elements"), async (req, res) => {
//   const elements = req.body.elements.map((element, index) => {
//     const { type, id, value } = JSON.parse(element);
//     const file = req.files[index];
//     return {
//       type,
//       id,
//       value,
//       file: file ? file.path : null,
//     };
//   });

//   try {
//     const newCourse = new Course({ elements });
//     await newCourse.save();
//     res.status(201).json(newCourse);
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// module.exports = courseController;
