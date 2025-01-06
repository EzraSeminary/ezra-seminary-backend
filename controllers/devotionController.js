// controllers/devotionController.js

const Devotion = require("../models/Devotion");
const { uploadImage } = require("../middleware/cloudinary"); // Make sure to require your new uploadImage function

const createDevotion = async (req, res) => {
  try {
    const { month, day, title, chapter, verse, prayer } = req.body;

    // Extract all paragraph fields from the request body
    const paragraphs = Object.keys(req.body)
      .filter((key) => key.startsWith("paragraph"))
      .map((key) => req.body[key]);

    let image = null;
    // Check if there is an image file sent in the request
    if (req.file) {
      // Upload image to Cloudinary
      const uploadResult = await uploadImage(req.file); // Pass the file to the upload function
      image = uploadResult; // Get public_id or secure_url depending on what you need
    }

    const devotion = new Devotion({
      month,
      day,
      title,
      chapter,
      verse,
      body: paragraphs,
      prayer,
      image, // This will contain the Cloudinary URL
    });

    const savedDevotion = await devotion.save();

    res.status(201).json(savedDevotion);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDevotions = async (req, res) => {
  try {
    // Destructure and set default values for query parameters
    let { limit = 0, sort = "desc" } = req.query;

    // Validate 'limit' parameter to ensure it's a non-negative integer
    limit = parseInt(limit, 10);
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({ error: "Invalid 'limit' parameter" });
    }

    // Validate 'sort' parameter
    const sortOrder = sort.toLowerCase() === "asc" ? 1 : -1;

    // Fetch devotions from the database with applied sorting and limit
    const devotions = await Devotion.find()
      .sort({ createdAt: sortOrder }) // Assuming there's a 'createdAt' field in your Devotion schema
      .limit(limit);

    res.status(200).json(devotions);
  } catch (error) {
    console.error("Error fetching devotions:", error);
    res.status(500).json({ error: "Internal Server Error" });
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

const updateDevotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, day, title, chapter, verse, prayer } = req.body;

    // Extract all paragraph fields from the request body
    const paragraphs = Object.keys(req.body)
      .filter((key) => key.startsWith("paragraph"))
      .map((key) => req.body[key]);

    const updateData = {
      month,
      day,
      title,
      chapter,
      verse,
      body: paragraphs,
      prayer,
    };

    if (req.file) {
      const uploadResult = await uploadImage(req.file);
      updateData.image = uploadResult;
    }

    const updatedDevotion = await Devotion.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedDevotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    res.status(200).json(updatedDevotion);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createDevotion,
  getDevotions,
  deleteDevotion,
  updateDevotion,
};
