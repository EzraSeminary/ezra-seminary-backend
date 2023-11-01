const Devotion = require('../models/Devotion');
const multer = require("multer");


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/images");
  },
  filename: (req, file, cb) => {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const upload = multer({ storage: storage });
// Controller function for handling form submission

const createDevotion = async (req, res) => {
  try {
    // Extract form data from the request body
    const { month, day, title, chapter, verse, body, prayer, image, paragraphs } = req.body;

    // Create a new Devotion instance
    const devotion = new Devotion({
      month,
      day,
      title,
      chapter,
      verse,
      body,
      prayer,
      image,
      paragraphs,
    });

    // Save the devotion to the database
    const savedDevotion = await devotion.save();

    res.status(201).json(savedDevotion);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

module.exports = {
 createDevotion,
};
