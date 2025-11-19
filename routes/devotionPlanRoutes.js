// routes/devotionPlanRoutes.js

const express = require("express");
const router = express.Router();
const devotionPlanController = require("../controllers/devotionPlanController");
const verifyJWT = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const upload = require("../middleware/upload");

const {
  getDevotionPlans,
  getDevotionPlanById,
  getUserDevotionPlans,
  getDevotionPlanProgress,
  startDevotionPlan,
  updateDevotionPlanProgress,
  completeDevotionPlan,
  createDevotionPlan,
  updateDevotionPlan,
  deleteDevotionPlan,
  listPlanDevotions,
  createPlanDevotion,
  updatePlanDevotion,
  deletePlanDevotion,
  reorderPlanDevotion,
} = devotionPlanController;

// Public endpoints
// Get all devotion plans (public)
router.get("/", getDevotionPlans);

// Get specific devotion plan
router.get("/:id", getDevotionPlanById);

// Get plan devotions (public for viewing)
router.get("/:id/devotions", listPlanDevotions);

// User endpoints (requires auth)
// Get user's devotion plans (requires auth)
router.get("/user", verifyJWT, getUserDevotionPlans);

// Get progress for a specific plan
router.get("/:id/progress", verifyJWT, getDevotionPlanProgress);

// Start a devotion plan
router.post("/:id/start", verifyJWT, startDevotionPlan);

// Update progress
router.put("/:id/progress", verifyJWT, updateDevotionPlanProgress);

// Complete a devotion plan
router.post("/:id/complete", verifyJWT, completeDevotionPlan);

// Admin endpoints (requires auth + admin)
// Create devotion plan
router.post("/", verifyJWT, requireAdmin, upload.single("image"), createDevotionPlan);

// Update devotion plan
router.put("/:id", verifyJWT, requireAdmin, upload.single("image"), updateDevotionPlan);

// Delete devotion plan
router.delete("/:id", verifyJWT, requireAdmin, deleteDevotionPlan);

// Create devotion in plan
router.post(
  "/:id/devotions",
  verifyJWT,
  requireAdmin,
  upload.single("image"),
  createPlanDevotion
);

// Update devotion in plan
router.put(
  "/:id/devotions/:devotionId",
  verifyJWT,
  requireAdmin,
  upload.single("image"),
  updatePlanDevotion
);

// Delete devotion from plan
router.delete(
  "/:id/devotions/:devotionId",
  verifyJWT,
  requireAdmin,
  deletePlanDevotion
);

// Reorder devotion in plan
router.post(
  "/:id/devotions/:devotionId/reorder",
  verifyJWT,
  requireAdmin,
  reorderPlanDevotion
);

module.exports = router;

