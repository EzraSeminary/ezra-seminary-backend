const Quiz = require("../models/Quiz");
const quizController = require("express").Router();

// get all quizes
quizController.get("/getall", async (req, res) => {
  try {
    const quizes = await Quiz.find({});
    res.status(200).json(quizes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// create quiz
quizController.post("/create", async (req, res) => {
  try {
    console.log(req.body);
    const newQuiz = await Quiz.create({
      ...req.body,
    });

    return res.status(201).json(newQuiz);
  } catch (error) {
    return res.status(500).json(error);
  }
});

module.exports = quizController;
