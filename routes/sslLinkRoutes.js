const express = require("express");
const router = express.Router();
const VideoLink = require("../models/SSLVideoLink");

// Add request body validation middleware
const validateVideoLinkBody = (req, res, next) => {
  const { year, quarter, lesson, videoUrl } = req.body;
  console.log("Received data:", { year, quarter, lesson, videoUrl });

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
      .json({ message: "year, quarter, and lesson must be numbers" });
  }
  if (typeof videoUrl !== "string") {
    return res.status(400).json({ message: "videoUrl must be a string" });
  }
  next();
};

// Add a new video link
router.post("/", validateVideoLinkBody, async (req, res) => {
  try {
    const { year, quarter, lesson, videoUrl } = req.body;
    const newVideoLink = new VideoLink({ year, quarter, lesson, videoUrl });
    await newVideoLink.save();
    res.status(201).json(newVideoLink);
  } catch (error) {
    console.error("Error adding video link:", error);
    res.status(400).json({ message: error.message });
  }
});

// Get video link for a specific lesson
router.get("/:quarter/:lesson", async (req, res) => {
  try {
    const { quarter, lesson } = req.params;
    const currentYear = new Date().getFullYear();
    const videoLink = await VideoLink.findOne({
      year: currentYear,
      quarter,
      lesson,
    });
    if (videoLink) {
      res.json(videoLink);
    } else {
      res.status(404).json({ message: "Video link not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update a video link
router.put("/:quarter/:lesson", async (req, res) => {
  try {
    const { quarter, lesson } = req.params;
    const { videoUrl } = req.body;
    const currentYear = new Date().getFullYear();
    const updatedLink = await VideoLink.findOneAndUpdate(
      {
        year: currentYear,
        quarter: parseInt(quarter),
        lesson: parseInt(lesson),
      },
      { videoUrl },
      { new: true }
    );
    if (!updatedLink) {
      return res.status(404).json({ message: "Video link not found" });
    }
    res.json(updatedLink);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a video link
router.delete("/:quarter/:lesson", async (req, res) => {
  try {
    const { quarter, lesson } = req.params;
    const currentYear = new Date().getFullYear();
    const deletedLink = await VideoLink.findOneAndDelete({
      year: currentYear,
      quarter: parseInt(quarter),
      lesson: parseInt(lesson),
    });
    if (!deletedLink) {
      return res.status(404).json({ message: "Video link not found" });
    }
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
