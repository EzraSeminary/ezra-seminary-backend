// routes/analyticsRoutes.js

const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const requireAuth = require("../middleware/requireAuth");

router.get("/", requireAuth, analyticsController.getAnalytics);

module.exports = router;
