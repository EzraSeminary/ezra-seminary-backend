// controllers/devotionPlanController.js

// NOTE: You'll need to create a DevotionPlan model and DevotionPlanProgress model
// This is a basic controller structure - adjust based on your actual models

const getDevotionPlans = async (req, res) => {
  try {
    // TODO: Replace with your actual DevotionPlan model
    // const DevotionPlan = require("../models/DevotionPlan");
    // const plans = await DevotionPlan.find({}).lean();
    
    // Temporary: Return empty array until model is set up
    console.log("[DevotionPlans] Fetching all devotion plans");
    res.status(200).json([]);
  } catch (error) {
    console.error("Error fetching devotion plans:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDevotionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    // TODO: Replace with your actual DevotionPlan model
    // const DevotionPlan = require("../models/DevotionPlan");
    // const plan = await DevotionPlan.findById(id).lean();
    
    // Temporary: Return 404 until model is set up
    console.log("[DevotionPlans] Fetching plan by ID:", id);
    res.status(404).json({ error: "Devotion plan not found" });
  } catch (error) {
    console.error("Error fetching devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getUserDevotionPlans = async (req, res) => {
  try {
    const userId = req.user._id; // From JWT middleware
    // TODO: Replace with your actual DevotionPlanProgress model
    // const DevotionPlanProgress = require("../models/DevotionPlanProgress");
    // const userPlans = await DevotionPlanProgress.find({ userId }).lean();
    
    // Temporary: Return empty array until model is set up
    console.log("[DevotionPlans] Fetching user plans for:", userId);
    res.status(200).json([]);
  } catch (error) {
    console.error("Error fetching user devotion plans:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDevotionPlanProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    // TODO: Replace with your actual DevotionPlanProgress model
    // const DevotionPlanProgress = require("../models/DevotionPlanProgress");
    // const progress = await DevotionPlanProgress.findOne({ planId: id, userId }).lean();
    
    // Temporary: Return 404 until model is set up
    console.log("[DevotionPlans] Fetching progress for plan:", id, "user:", userId);
    res.status(404).json({ error: "Progress not found" });
  } catch (error) {
    console.error("Error fetching devotion plan progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const startDevotionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    // TODO: Replace with your actual DevotionPlanProgress model
    // const DevotionPlanProgress = require("../models/DevotionPlanProgress");
    // const existing = await DevotionPlanProgress.findOne({ planId: id, userId });
    // if (existing) {
    //   return res.status(400).json({ error: "Plan already started" });
    // }
    // const progress = new DevotionPlanProgress({
    //   planId: id,
    //   userId,
    //   currentDay: 1,
    //   completedDays: [],
    //   startedAt: new Date(),
    // });
    // await progress.save();
    
    // Temporary: Return success until model is set up
    console.log("[DevotionPlans] Starting plan:", id, "for user:", userId);
    res.status(201).json({ message: "Plan started successfully" });
  } catch (error) {
    console.error("Error starting devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDevotionPlanProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentDay, completedDays } = req.body;
    const userId = req.user._id;
    // TODO: Replace with your actual DevotionPlanProgress model
    // const DevotionPlanProgress = require("../models/DevotionPlanProgress");
    // const progress = await DevotionPlanProgress.findOneAndUpdate(
    //   { planId: id, userId },
    //   { currentDay, completedDays, updatedAt: new Date() },
    //   { new: true }
    // );
    
    // Temporary: Return success until model is set up
    console.log("[DevotionPlans] Updating progress for plan:", id, "user:", userId);
    res.status(200).json({ message: "Progress updated successfully" });
  } catch (error) {
    console.error("Error updating devotion plan progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const completeDevotionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    // TODO: Replace with your actual DevotionPlanProgress model
    // const DevotionPlanProgress = require("../models/DevotionPlanProgress");
    // const progress = await DevotionPlanProgress.findOneAndUpdate(
    //   { planId: id, userId },
    //   { completedAt: new Date() },
    //   { new: true }
    // );
    
    // Temporary: Return success until model is set up
    console.log("[DevotionPlans] Completing plan:", id, "for user:", userId);
    res.status(200).json({ message: "Plan completed successfully" });
  } catch (error) {
    console.error("Error completing devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  getDevotionPlans,
  getDevotionPlanById,
  getUserDevotionPlans,
  getDevotionPlanProgress,
  startDevotionPlan,
  updateDevotionPlanProgress,
  completeDevotionPlan,
};

