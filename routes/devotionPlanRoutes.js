const express = require("express");
const router = express.Router();

// Lazy load controller to avoid circular dependencies and make debugging easier
let controller;
try {
  controller = require("../controllers/devotionPlanController");
  console.log("[DevotionPlan Routes] Controller loaded successfully");
} catch (error) {
  console.error("[DevotionPlan Routes] Error loading controller:", error.message);
  console.error("[DevotionPlan Routes] Stack:", error.stack);
  controller = null;
}

const upload = require("../middleware/upload");
const verifyJWT = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

// Health check endpoint - BASIC (no models)
router.get("/health", (req, res) => {
  console.log("[DevotionPlan] Health check called");
  res.status(200).json({ 
    status: "ok", 
    message: "Devotion plan routes are mounted and working"
  });
});

// Model check endpoint
router.get("/check-models", (req, res) => {
  console.log("[DevotionPlan] Model check called");
  const fs = require("fs");
  const path = require("path");
  
  try {
    const modelPath1 = path.join(__dirname, "../models/DevotionPlan.js");
    const modelPath2 = path.join(__dirname, "../models/UserDevotionPlan.js");
    
    const file1Exists = fs.existsSync(modelPath1);
    const file2Exists = fs.existsSync(modelPath2);
    
    console.log("[DevotionPlan] DevotionPlan.js exists:", file1Exists);
    console.log("[DevotionPlan] UserDevotionPlan.js exists:", file2Exists);
    
    let DevotionPlanModel = null;
    let UserDevotionPlanModel = null;
    let modelError = null;
    
    if (file1Exists && file2Exists) {
      try {
        DevotionPlanModel = require("../models/DevotionPlan");
        UserDevotionPlanModel = require("../models/UserDevotionPlan");
      } catch (err) {
        modelError = err.message;
        console.error("[DevotionPlan] Model require error:", err);
      }
    }
    
    res.status(200).json({ 
      status: "ok",
      files: {
        DevotionPlan: file1Exists,
        UserDevotionPlan: file2Exists
      },
      models: {
        DevotionPlan: !!DevotionPlanModel,
        UserDevotionPlan: !!UserDevotionPlanModel
      },
      modelError,
      paths: {
        DevotionPlan: modelPath1,
        UserDevotionPlan: modelPath2
      }
    });
  } catch (error) {
    console.error("[DevotionPlan] Check models error:", error);
    res.status(500).json({ 
      status: "error", 
      message: error.message,
      stack: error.stack
    });
  }
});

// Helper to get controller methods safely
const getController = () => {
  if (!controller) {
    throw new Error("DevotionPlan controller failed to load. Check server logs.");
  }
  return controller;
};

// Public/list endpoints
router.get("/", (req, res) => getController().listPlans(req, res));
router.get("/:id", (req, res) => getController().getPlanById(req, res));

// Admin management
router.post("/", verifyJWT, requireAdmin, upload.single("image"), (req, res) => getController().createPlan(req, res));
router.put("/:id", verifyJWT, requireAdmin, upload.single("image"), (req, res) => getController().updatePlan(req, res));
router.delete("/:id", verifyJWT, requireAdmin, (req, res) => getController().deletePlan(req, res));

// User progress
router.post("/:id/start", verifyJWT, (req, res) => getController().startPlan(req, res));
router.post("/:id/progress", verifyJWT, (req, res) => getController().recordProgress(req, res));
router.get("/me/my", verifyJWT, (req, res) => getController().getMyPlans(req, res));

// Plan-specific devotions (admin)
router.get("/:id/devotions", verifyJWT, (req, res) => getController().listPlanDevotions(req, res));
router.post(
  "/:id/devotions",
  verifyJWT,
  requireAdmin,
  upload.single("image"),
  (req, res) => getController().createPlanDevotion(req, res)
);
router.put(
  "/:id/devotions/:devotionId",
  verifyJWT,
  requireAdmin,
  upload.single("image"),
  (req, res) => getController().updatePlanDevotion(req, res)
);
router.delete(
  "/:id/devotions/:devotionId",
  verifyJWT,
  requireAdmin,
  (req, res) => getController().deletePlanDevotion(req, res)
);

module.exports = router;


