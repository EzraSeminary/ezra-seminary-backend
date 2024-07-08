// routes/videoLinks.js
const express = require("express");
const router = express.Router();
const VideoLink = require("../models/SSLVideoLink");

// Add a new video link
router.post("/", async (req, res) => {
  try {
    const { year, quarter, lesson, videoUrl } = req.body;
    const newVideoLink = new VideoLink({ year, quarter, lesson, videoUrl });
    await newVideoLink.save();
    res.status(201).json(newVideoLink);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get video link for a specific lesson
router.get("/:year/:quarter/:lesson", async (req, res) => {
  try {
    const { year, quarter, lesson } = req.params;
    const videoLink = await VideoLink.findOne({ year, quarter, lesson });
    if (videoLink) {
      res.json(videoLink);
    } else {
      res.status(404).json({ message: "Video link not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
