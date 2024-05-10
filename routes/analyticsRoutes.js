// routes/analyticsRoutes.js

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const requireAuth = require("../middleware/requireAuth");

router.get("/", requireAuth, async (req, res) => {
  try {
    const analyticsData = await analyticsController.getAnalytics();
    res.json(analyticsData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
