// routes/devotionPlanRoutes.js

const express = require("express");
const router = express.Router();
const devotionPlanController = require("../controllers/devotionPlanController");
const verifyJWT = require("../middleware/requireAuth");

const {
  getDevotionPlans,
  getDevotionPlanById,
  getUserDevotionPlans,
  getDevotionPlanProgress,
  startDevotionPlan,
  updateDevotionPlanProgress,
  completeDevotionPlan,
} = devotionPlanController;

// Get all devotion plans (public)
router.get("/", getDevotionPlans);

// Get user's devotion plans (requires auth)
router.get("/user", verifyJWT, getUserDevotionPlans);

// Get specific devotion plan
router.get("/:id", getDevotionPlanById);

// Get progress for a specific plan
router.get("/:id/progress", verifyJWT, getDevotionPlanProgress);

// Start a devotion plan
router.post("/:id/start", verifyJWT, startDevotionPlan);

// Update progress
router.put("/:id/progress", verifyJWT, updateDevotionPlanProgress);

// Complete a devotion plan
router.post("/:id/complete", verifyJWT, completeDevotionPlan);

module.exports = router;

