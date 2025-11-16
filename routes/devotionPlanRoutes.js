const express = require("express");
const router = express.Router();
const {
  createPlan,
  listPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  startPlan,
  recordProgress,
  getMyPlans,
  listPlanDevotions,
  createPlanDevotion,
  updatePlanDevotion,
  deletePlanDevotion,
} = require("../controllers/devotionPlanController");
const upload = require("../middleware/upload");
const verifyJWT = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// Public/list endpoints
router.get("/", listPlans);
router.get("/:id", getPlanById);

// Admin management
router.post("/", verifyJWT, requireAdmin, upload.single("image"), createPlan);
router.put("/:id", verifyJWT, requireAdmin, upload.single("image"), updatePlan);
router.delete("/:id", verifyJWT, requireAdmin, deletePlan);

// User progress
router.post("/:id/start", verifyJWT, startPlan);
router.post("/:id/progress", verifyJWT, recordProgress);
router.get("/me/my", verifyJWT, getMyPlans);

// Plan-specific devotions (admin)
router.get("/:id/devotions", verifyJWT, listPlanDevotions);
router.post(
  "/:id/devotions",
  verifyJWT,
  requireAdmin,
  upload.single("image"),
  createPlanDevotion
);
router.put(
  "/:id/devotions/:devotionId",
  verifyJWT,
  requireAdmin,
  upload.single("image"),
  updatePlanDevotion
);
router.delete(
  "/:id/devotions/:devotionId",
  verifyJWT,
  requireAdmin,
  deletePlanDevotion
);

module.exports = router;


