const VideoLink = require("../models/SSLVideoLink");
const express = require("express");
const router = express.Router();

// Middleware to validate video link data from req.body
const validateVideoLinkBody = (req, res, next) => {
  const { year, quarter, lesson, videoUrl } = req.body;
  if (!year || !quarter || !lesson || !videoUrl) {
    return res.status(400).json({ message: "Missing required fields" });
  }
  if (
    typeof year !== "number" ||
    typeof quarter !== "number" ||
    typeof lesson !== "number"
  ) {
    return res
      .status(400)
      .json({ message: "Year, quarter, and lesson must be numbers." });
  }
  if (quarter < 1 || quarter > 4) {
    return res
      .status(400)
      .json({ message: "Quarter must be between 1 and 4." });
  }
  if (typeof videoUrl !== "string") {
    return res.status(400).json({ message: "videoUrl must be a string." });
  }
  next();
};

// Add a video link or update if it exists
router.post("/", validateVideoLinkBody, async (req, res) => {
  try {
    const { year, quarter, lesson, videoUrl } = req.body;
    let existingLink = await VideoLink.findOne({ year, quarter, lesson });
    if (existingLink) {
      existingLink.videoUrl = videoUrl;
      await existingLink.save();
      return res.status(200).json(existingLink);
    } else {
      let newVideoLink = new VideoLink({ year, quarter, lesson, videoUrl });
      await newVideoLink.save();
      return res.status(201).json(newVideoLink);
    }
  } catch (err) {
    console.error("Error adding video link:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Get a video link based on year, quarter, and lesson
router.get("/:year/:quarter/:lesson", async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const quarter = parseInt(req.params.quarter);
    const lesson = parseInt(req.params.lesson);
    let videoLink = await VideoLink.findOne({ year, quarter, lesson });

    if (videoLink) {
      return res.json(videoLink);
    }
    return res.status(404).json({ message: "Video link not found" });
  } catch (err) {
    console.error("Error fetching video link:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Update a video link based on year, quarter, and lesson
router.put("/:year/:quarter/:lesson", async (req, res) => {
  try {
    const { year, quarter, lesson } = req.params;
    const { videoUrl } = req.body;

    let updatedLink = await VideoLink.findOneAndUpdate(
      {
        year: parseInt(year),
        quarter: parseInt(quarter),
        lesson: parseInt(lesson),
      },
      { videoUrl },
      { new: true }
    );

    if (updatedLink) {
      return res.json(updatedLink);
    } else {
      return res.status(404).json({ message: "Video link not found" });
    }
  } catch (err) {
    console.error("Error updating video link:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Delete a video link based on year, quarter, and lesson
router.delete("/:year/:quarter/:lesson", async (req, res) => {
  try {
    const year = parseInt(req.params.year);
    const quarter = parseInt(req.params.quarter);
    const lesson = parseInt(req.params.lesson);

    let deletedLink = await VideoLink.findOneAndDelete({
      year,
      quarter,
      lesson,
    });

    if (deletedLink) {
      return res
        .status(200)
        .json({ message: "Video link successfully deleted" });
    } else {
      return res.status(404).json({ message: "Video link not found" });
    }
  } catch (err) {
    console.error("Error deleting video link:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
