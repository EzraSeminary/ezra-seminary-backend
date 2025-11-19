// controllers/devotionPlanController.js

const DevotionPlan = require("../models/DevotionPlan");
const UserDevotionPlan = require("../models/UserDevotionPlan");
const Devotion = require("../models/Devotion");
const { uploadImage } = require("../middleware/cloudinary");

// Get all devotion plans (public)
const getDevotionPlans = async (req, res) => {
  try {
    const plans = await DevotionPlan.find({ published: true })
      .populate("items", "title chapter verse image")
      .sort({ createdAt: -1 });

    res.status(200).json({
      items: plans,
      total: plans.length,
    });
  } catch (error) {
    console.error("Error fetching devotion plans:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get specific devotion plan
const getDevotionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await DevotionPlan.findById(id).populate("items", "title chapter verse image body prayer order");

    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    res.status(200).json(plan);
  } catch (error) {
    console.error("Error fetching devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get user's devotion plans (requires auth)
const getUserDevotionPlans = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;

    const query = { userId };
    if (status) {
      query.status = status;
    }

    const userPlans = await UserDevotionPlan.find(query)
      .populate("planId")
      .sort({ createdAt: -1 });

    const plansWithProgress = await Promise.all(
      userPlans.map(async (userPlan) => {
        const plan = await DevotionPlan.findById(userPlan.planId).populate("items");
        const totalItems = plan?.items?.length || 0;
        const completedItems = userPlan.itemsCompleted?.length || 0;
        const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

        return {
          ...userPlan.toObject(),
          plan: plan?.toObject(),
          progress: {
            completed: completedItems,
            total: totalItems,
            percent,
          },
        };
      })
    );

    res.status(200).json(plansWithProgress);
  } catch (error) {
    console.error("Error fetching user devotion plans:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get progress for a specific plan
const getDevotionPlanProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const userPlan = await UserDevotionPlan.findOne({ userId, planId: id });
    if (!userPlan) {
      return res.status(404).json({ error: "Plan not started by user" });
    }

    const plan = await DevotionPlan.findById(id).populate("items");
    const totalItems = plan?.items?.length || 0;
    const completedItems = userPlan.itemsCompleted?.length || 0;
    const percent = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    res.status(200).json({
      plan: plan?.toObject(),
      progress: {
        completed: completedItems,
        total: totalItems,
        percent,
      },
      status: userPlan.status,
      startedAt: userPlan.startedAt,
      completedAt: userPlan.completedAt,
    });
  } catch (error) {
    console.error("Error fetching devotion plan progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Start a devotion plan
const startDevotionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if plan exists
    const plan = await DevotionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    // Check if user already started this plan
    const existing = await UserDevotionPlan.findOne({ userId, planId: id });
    if (existing) {
      return res.status(200).json({
        message: "Plan already started",
        userPlan: existing,
      });
    }

    // Create new user plan entry
    const userPlan = new UserDevotionPlan({
      userId,
      planId: id,
      status: "in_progress",
      itemsCompleted: [],
    });

    await userPlan.save();

    res.status(201).json({
      message: "Plan started successfully",
      userPlan,
    });
  } catch (error) {
    console.error("Error starting devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Update progress
const updateDevotionPlanProgress = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { devotionId, completed } = req.body;

    const userPlan = await UserDevotionPlan.findOne({ userId, planId: id });
    if (!userPlan) {
      return res.status(404).json({ error: "Plan not started by user" });
    }

    // Verify devotion belongs to this plan
    const plan = await DevotionPlan.findById(id);
    if (!plan.items.includes(devotionId)) {
      return res.status(400).json({ error: "Devotion does not belong to this plan" });
    }

    if (completed) {
      // Add to completed if not already there
      if (!userPlan.itemsCompleted.includes(devotionId)) {
        userPlan.itemsCompleted.push(devotionId);
      }
    } else {
      // Remove from completed
      userPlan.itemsCompleted = userPlan.itemsCompleted.filter(
        (itemId) => itemId.toString() !== devotionId.toString()
      );
    }

    // Check if all items are completed
    const planWithItems = await DevotionPlan.findById(id).populate("items");
    const totalItems = planWithItems?.items?.length || 0;
    if (userPlan.itemsCompleted.length >= totalItems && totalItems > 0) {
      userPlan.status = "completed";
      userPlan.completedAt = new Date();
    } else {
      userPlan.status = "in_progress";
      userPlan.completedAt = undefined;
    }

    await userPlan.save();

    res.status(200).json({
      message: "Progress updated",
      userPlan,
    });
  } catch (error) {
    console.error("Error updating devotion plan progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Complete a devotion plan
const completeDevotionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const userPlan = await UserDevotionPlan.findOne({ userId, planId: id });
    if (!userPlan) {
      return res.status(404).json({ error: "Plan not started by user" });
    }

    userPlan.status = "completed";
    userPlan.completedAt = new Date();

    await userPlan.save();

    res.status(200).json({
      message: "Plan completed",
      userPlan,
    });
  } catch (error) {
    console.error("Error completing devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: Create devotion plan
const createDevotionPlan = async (req, res) => {
  try {
    const { title, description } = req.body;

    let image = null;
    if (req.file) {
      image = await uploadImage(req.file);
    }

    const plan = new DevotionPlan({
      title,
      description: description || "",
      image,
      items: [],
      published: true,
    });

    await plan.save();

    res.status(201).json(plan);
  } catch (error) {
    console.error("Error creating devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: Update devotion plan
const updateDevotionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, published } = req.body;

    const plan = await DevotionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    if (title) plan.title = title;
    if (description !== undefined) plan.description = description;
    if (published !== undefined) plan.published = published === "true" || published === true;

    if (req.file) {
      plan.image = await uploadImage(req.file);
    }

    await plan.save();

    res.status(200).json(plan);
  } catch (error) {
    console.error("Error updating devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: Delete devotion plan
const deleteDevotionPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await DevotionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    // Delete all user progress for this plan
    await UserDevotionPlan.deleteMany({ planId: id });

    // Delete the plan
    await DevotionPlan.findByIdAndDelete(id);

    res.status(200).json({ message: "Devotion plan deleted successfully" });
  } catch (error) {
    console.error("Error deleting devotion plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: List plan devotions
const listPlanDevotions = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await DevotionPlan.findById(id).populate({
      path: "items",
      options: { sort: { order: 1 } },
    });

    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    res.status(200).json({
      items: plan.items || [],
      total: plan.items?.length || 0,
    });
  } catch (error) {
    console.error("Error listing plan devotions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: Create devotion in plan
const createPlanDevotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, day, title, chapter, verse, prayer } = req.body;

    const plan = await DevotionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    // Extract paragraphs
    const paragraphs = Object.keys(req.body)
      .filter((key) => key.startsWith("paragraph"))
      .map((key) => req.body[key]);

    let image = null;
    if (req.file) {
      image = await uploadImage(req.file);
    }

    // Get max order in plan
    const existingDevotions = await Devotion.find({ planId: id }).sort({ order: -1 }).limit(1);
    const maxOrder = existingDevotions.length > 0 ? existingDevotions[0].order : -1;

    const devotion = new Devotion({
      month,
      day,
      title,
      chapter,
      verse,
      body: paragraphs,
      prayer,
      image,
      planId: id,
      order: maxOrder + 1,
    });

    await devotion.save();

    // Add to plan items
    plan.items.push(devotion._id);
    await plan.save();

    res.status(201).json(devotion);
  } catch (error) {
    console.error("Error creating plan devotion:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: Update devotion in plan
const updatePlanDevotion = async (req, res) => {
  try {
    const { id, devotionId } = req.params;
    const { month, day, title, chapter, verse, prayer } = req.body;

    const plan = await DevotionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    if (!plan.items.includes(devotionId)) {
      return res.status(400).json({ error: "Devotion does not belong to this plan" });
    }

    const devotion = await Devotion.findById(devotionId);
    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    if (month !== undefined) devotion.month = month;
    if (day !== undefined) devotion.day = day;
    if (title !== undefined) devotion.title = title;
    if (chapter !== undefined) devotion.chapter = chapter;
    if (verse !== undefined) devotion.verse = verse;
    if (prayer !== undefined) devotion.prayer = prayer;

    // Extract paragraphs
    const paragraphs = Object.keys(req.body)
      .filter((key) => key.startsWith("paragraph"))
      .map((key) => req.body[key]);
    if (paragraphs.length > 0) {
      devotion.body = paragraphs;
    }

    if (req.file) {
      devotion.image = await uploadImage(req.file);
    }

    await devotion.save();

    res.status(200).json(devotion);
  } catch (error) {
    console.error("Error updating plan devotion:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: Delete devotion from plan
const deletePlanDevotion = async (req, res) => {
  try {
    const { id, devotionId } = req.params;

    const plan = await DevotionPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    if (!plan.items.includes(devotionId)) {
      return res.status(400).json({ error: "Devotion does not belong to this plan" });
    }

    // Remove from plan items
    plan.items = plan.items.filter((itemId) => itemId.toString() !== devotionId.toString());
    await plan.save();

    // Remove from all user progress
    await UserDevotionPlan.updateMany(
      { planId: id },
      { $pull: { itemsCompleted: devotionId } }
    );

    // Delete the devotion
    await Devotion.findByIdAndDelete(devotionId);

    res.status(200).json({ message: "Devotion deleted from plan successfully" });
  } catch (error) {
    console.error("Error deleting plan devotion:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: Reorder devotion in plan
const reorderPlanDevotion = async (req, res) => {
  try {
    const { id, devotionId } = req.params;
    const { direction } = req.body;

    const plan = await DevotionPlan.findById(id).populate("items");
    if (!plan) {
      return res.status(404).json({ error: "Devotion plan not found" });
    }

    const devotion = await Devotion.findById(devotionId);
    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    // Get all devotions in order
    const devotions = await Devotion.find({ planId: id }).sort({ order: 1 });
    const currentIndex = devotions.findIndex((d) => d._id.toString() === devotionId);

    if (currentIndex === -1) {
      return res.status(400).json({ error: "Devotion not found in plan" });
    }

    if (direction === "up" && currentIndex > 0) {
      // Swap with previous
      const prevDevotion = devotions[currentIndex - 1];
      const tempOrder = devotion.order;
      devotion.order = prevDevotion.order;
      prevDevotion.order = tempOrder;
      await devotion.save();
      await prevDevotion.save();
    } else if (direction === "down" && currentIndex < devotions.length - 1) {
      // Swap with next
      const nextDevotion = devotions[currentIndex + 1];
      const tempOrder = devotion.order;
      devotion.order = nextDevotion.order;
      nextDevotion.order = tempOrder;
      await devotion.save();
      await nextDevotion.save();
    }

    res.status(200).json({ message: "Devotion reordered successfully" });
  } catch (error) {
    console.error("Error reordering plan devotion:", error);
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
  createDevotionPlan,
  updateDevotionPlan,
  deleteDevotionPlan,
  listPlanDevotions,
  createPlanDevotion,
  updatePlanDevotion,
  deletePlanDevotion,
  reorderPlanDevotion,
};

