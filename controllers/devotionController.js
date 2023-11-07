// controllers/devotionController.js

const Devotion = require('../models/Devotion');

const createDevotion = async (req, res) => {
  try {
    const { month, day, title, chapter, verse, prayer } = req.body;

    // Extract all paragraph fields from the request body
    const paragraphs = Object.keys(req.body)
      .filter(key => key.startsWith('paragraph'))
      .map(key => req.body[key]);

    const image = req.file ? req.file.filename : null;

    const devotion = new Devotion({
      month,
      day,
      title,
      chapter,
      verse,
      body: paragraphs,
      prayer,
      image,
    });

    const savedDevotion = await devotion.save();

    res.status(201).json(savedDevotion);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const getDevotions = async (req, res) => {
  try {
    const devotions = await Devotion.find();

    res.status(200).json(devotions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

const deleteDevotion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDevotion = await Devotion.findByIdAndDelete(id);
    if (!deletedDevotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }
    res.status(200).json({ message: "Devotion deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


module.exports = {
  createDevotion,
  getDevotions,
  deleteDevotion,
};

