const express = require("express");
const router = express.Router();
const VideoLink = require("../models/SSLVideoLink");

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
  if (quarter < 1 || quarter > 4) {
    return res.status(400).json({ message: "quarter must be between 1 and 4" });
  }
  if (typeof videoUrl !== "string") {
    return res.status(400).json({ message: "videoUrl must be a string" });
  }
  next();
};

router.post("/", validateVideoLinkBody, async (req, res) => {
  try {
    const { year, quarter, lesson, videoUrl } = req.body;
    console.log(" { year, quarter, lesson, videoUrl } ");

    const existingLink = await VideoLink.findOne({ year, quarter, lesson });
    if (existingLink) {
      existingLink.videoUrl = videoUrl;
      await existingLink.save();
      return res.status(200).json(existingLink);
    }
    const newVideoLink = new VideoLink({ year, quarter, lesson, videoUrl });
    await newVideoLink.save();
    res.status(201).json(newVideoLink);
  } catch (error) {
    console.error("Error adding video link:", error);
    res.status(400).json({ message: error.message });
  }
});

router.get("/:quarter/:lesson", async (req, res) => {
  try {
    const { quarter, lesson } = req.params;
    const videoLink = await VideoLink.findOne({
      quarter: parseInt(quarter),
      lesson: parseInt(lesson),
    }).sort({ year: -1 }); // Get the most recent link if multiple exist
    if (videoLink) {
      res.json(videoLink);
    } else {
      res.status(404).json({ message: "Video link not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put("/:year/:quarter/:lesson", async (req, res) => {
  try {
    const { year, quarter, lesson } = req.params;
    const { videoUrl } = req.body;
    const updatedLink = await VideoLink.findOneAndUpdate(
      {
        year: parseInt(year),
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

router.delete("/:year/:quarter/:lesson", async (req, res) => {
  try {
    const { year, quarter, lesson } = req.params;
    const deletedLink = await VideoLink.findOneAndDelete({
      year: parseInt(year),
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
