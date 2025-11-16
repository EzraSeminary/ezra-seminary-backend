const DevotionPlan = require("../models/DevotionPlan");
const UserDevotionPlan = require("../models/UserDevotionPlan");
const Devotion = require("../models/Devotion");
const upload = require("../middleware/upload");
const { uploadImage } = require("../middleware/cloudinary");

// Admin: create a devotion plan
const createPlan = async (req, res) => {
  try {
    console.log("[DevotionPlan] Create request received");
    console.log("[DevotionPlan] Headers:", req.headers);
    console.log("[DevotionPlan] Body:", req.body);
    console.log("[DevotionPlan] Body keys:", Object.keys(req.body));
    console.log("[DevotionPlan] Body values:", Object.values(req.body));
    console.log("[DevotionPlan] File:", req.file ? req.file : "none");
    
    const { title, description } = req.body;
    
    console.log("[DevotionPlan] Extracted - title:", title, "description:", description);
    
    if (!title || title.trim() === "") {
      console.log("[DevotionPlan] Missing or empty title");
      return res.status(400).json({ 
        error: "Title is required",
        received: { title, description, hasFile: !!req.file }
      });
    }
    
    let { items } = req.body;
    // items may come as JSON string or array of ids
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        items = [];
      }
    }
    if (!Array.isArray(items)) items = [];

    let image = "";
    if (req.file) {
      console.log("[DevotionPlan] Uploading image...");
      const uploadResult = await uploadImage(req.file);
      image = uploadResult;
      console.log("[DevotionPlan] Image uploaded:", image);
    }

    console.log("[DevotionPlan] Creating plan in DB...");
    const plan = await DevotionPlan.create({
      title,
      description,
      image,
      items,
    });
    console.log("[DevotionPlan] Plan created:", plan._id);

    res.status(201).json(plan);
  } catch (error) {
    console.error("[DevotionPlan] Error creating plan:", error);
    console.error("[DevotionPlan] Error stack:", error.stack);
    res.status(500).json({ 
      error: "Internal Server Error",
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Admin/User: list plans
const listPlans = async (req, res) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const limitNum = Math.min(parseInt(limit, 10) || 20, 100);
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);

    const [plans, total] = await Promise.all([
      DevotionPlan.find({})
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      DevotionPlan.countDocuments({}),
    ]);

    // Count actual devotions for each plan
    const planIds = plans.map((p) => p._id);
    const devotionCounts = await Promise.all(
      planIds.map((planId) => Devotion.countDocuments({ planId }))
    );

    // Normalize image URL if needed
    const origin = `${req.protocol}://${req.get("host")}`;
    const normalized = plans.map((p, index) => {
      let image = p.image;
      if (image && typeof image === "string" && !image.startsWith("http")) {
        image = `${origin}/images/${image}`;
      }
      return { ...p, numItems: devotionCounts[index], image };
    });

    res.status(200).json({
      items: normalized,
      total,
      page: pageNum,
      limit: limitNum,
    });
  } catch (error) {
    console.error("Error listing plans:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin/User: get plan by id (with items populated)
const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await DevotionPlan.findById(id).lean();
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    // Count actual devotions for this plan
    const numItems = await Devotion.countDocuments({ planId: id });

    const origin = `${req.protocol}://${req.get("host")}`;
    let image = plan.image;
    if (image && typeof image === "string" && !image.startsWith("http")) {
      image = `${origin}/images/${image}`;
    }

    res.status(200).json({
      ...plan,
      image,
      numItems,
    });
  } catch (error) {
    console.error("Error fetching plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: update plan
const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, published } = req.body;
    let { items } = req.body;

    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch {
        items = undefined;
      }
    }

    const update = {};
    if (typeof title !== "undefined") update.title = title;
    if (typeof description !== "undefined") update.description = description;
    if (typeof published !== "undefined") update.published = published;
    if (Array.isArray(items)) update.items = items;

    if (req.file) {
      const uploadResult = await uploadImage(req.file);
      update.image = uploadResult;
    }

    const plan = await DevotionPlan.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.status(200).json(plan);
  } catch (error) {
    console.error("Error updating plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Admin: delete plan
const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const plan = await DevotionPlan.findByIdAndDelete(id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    // Optionally, also delete user progress docs for this plan
    await UserDevotionPlan.deleteMany({ planId: id });
    res.status(200).json({ message: "Plan deleted" });
  } catch (error) {
    console.error("Error deleting plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// User: start a plan
const startPlan = async (req, res) => {
  try {
    console.log("[startPlan] Headers:", req.headers.authorization);
    console.log("[startPlan] req.user:", req.user);
    const userId = req.user?._id || req.user?.id;
    console.log("[startPlan] userId:", userId);
    const { id } = req.params; // planId
    if (!userId) {
      console.log("[startPlan] No userId - returning 401");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const existing = await UserDevotionPlan.findOne({ userId, planId: id });
    if (existing) {
      console.log("[startPlan] Existing plan found:", existing._id);
      return res.status(200).json(existing);
    }

    const created = await UserDevotionPlan.create({
      userId,
      planId: id,
      itemsCompleted: [],
      status: "in_progress",
      startedAt: new Date(),
    });
    console.log("[startPlan] Plan created:", created._id);
    res.status(201).json(created);
  } catch (error) {
    console.error("Error starting plan:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// User: record progress on a plan (counts when user opens an item)
const recordProgress = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const { id } = req.params; // planId
    const { devotionId } = req.body;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    if (!devotionId) return res.status(400).json({ error: "devotionId required" });

    const plan = await DevotionPlan.findById(id).lean();
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    let progress = await UserDevotionPlan.findOne({ userId, planId: id });
    if (!progress) {
      progress = await UserDevotionPlan.create({
        userId,
        planId: id,
        itemsCompleted: [],
        status: "in_progress",
        startedAt: new Date(),
      });
    }

    const already = progress.itemsCompleted.some(
      (d) => String(d) === String(devotionId)
    );
    if (!already) {
      progress.itemsCompleted.push(devotionId);
    }

    // Determine completion
    const total = (plan.items || []).length;
    const completed = progress.itemsCompleted.length;
    if (total > 0 && completed >= total) {
      progress.status = "completed";
      progress.completedAt = new Date();
    }
    await progress.save();
    res.status(200).json(progress);
  } catch (error) {
    console.error("Error recording progress:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// User: list my plans (optionally by status)
const getMyPlans = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const { status } = req.query;
    const query = { userId };
    if (status) query.status = status;

    const my = await UserDevotionPlan.find(query)
      .populate("planId")
      .lean();

    // Normalize and compute derived fields
    const origin = `${req.protocol}://${req.get("host")}`;
    const normalized = my.map((p) => {
      const plan = p.planId || {};
      let image = plan.image;
      if (image && typeof image === "string" && !image.startsWith("http")) {
        image = `${origin}/images/${image}`;
      }
      const numItems = Array.isArray(plan.items) ? plan.items.length : 0;
      const completed = Array.isArray(p.itemsCompleted)
        ? p.itemsCompleted.length
        : 0;
      const percent =
        numItems > 0 ? Math.round((completed / numItems) * 100) : 0;
      return {
        ...p,
        plan: {
          _id: plan._id,
          title: plan.title,
          description: plan.description,
          image,
          numItems,
        },
        progress: {
          completed,
          percent,
          status: p.status,
        },
      };
    });

    res.status(200).json(normalized);
  } catch (error) {
    console.error("Error fetching my plans:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Reorder devotion in plan
const reorderPlanDevotion = async (req, res) => {
  try {
    const { id, devotionId } = req.params;
    const { direction } = req.body; // "up" or "down"
    
    const devotion = await Devotion.findOne({ _id: devotionId, planId: id });
    if (!devotion) return res.status(404).json({ error: "Devotion not found" });
    
    const currentOrder = devotion.order || 0;
    const newOrder = direction === "up" ? currentOrder - 1 : currentOrder + 1;
    
    // Find the devotion to swap with
    const swapWith = await Devotion.findOne({
      planId: id,
      order: newOrder,
    });
    
    if (swapWith) {
      // Swap orders
      await Devotion.updateOne({ _id: devotion._id }, { order: newOrder });
      await Devotion.updateOne({ _id: swapWith._id }, { order: currentOrder });
    } else {
      // Just update the current devotion
      await Devotion.updateOne({ _id: devotion._id }, { order: newOrder });
    }
    
    res.status(200).json({ message: "Reordered successfully" });
  } catch (error) {
    console.error("Error reordering devotion:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createPlan,
  listPlans,
  getPlanById,
  updatePlan,
  deletePlan,
  startPlan,
  recordProgress,
  getMyPlans,
  reorderPlanDevotion,
  // Plan-specific devotions
  listPlanDevotions: async (req, res) => {
    try {
      const { id } = req.params; // planId
      const { limit = 50, page = 1, sort = "desc" } = req.query;
      const limitNum = Math.min(parseInt(limit, 10) || 50, 200);
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const sortOrder = String(sort).toLowerCase() === "asc" ? 1 : -1;

      const [items, total] = await Promise.all([
        Devotion.find({ planId: id })
          .sort({ order: 1, createdAt: sortOrder })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Devotion.countDocuments({ planId: id }),
      ]);

      const origin = `${req.protocol}://${req.get("host")}`;
      const normalized = items.map((d) => {
        let image = d.image;
        if (image && typeof image === "string" && !image.startsWith("http")) {
          image = `${origin}/images/${image}`;
        }
        return { ...d, image };
      });

      res.status(200).json({
        items: normalized,
        total,
        page: pageNum,
        limit: limitNum,
      });
    } catch (error) {
      console.error("Error listing plan devotions:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  createPlanDevotion: async (req, res) => {
    try {
      console.log("[createPlanDevotion] Starting...");
      const { id } = req.params; // planId
      console.log("[createPlanDevotion] Plan ID:", id);
      console.log("[createPlanDevotion] Body keys:", Object.keys(req.body));
      
      const { title, chapter, verse, prayer } = req.body;
      const paragraphs = Object.keys(req.body)
        .filter((key) => key.startsWith("paragraph"))
        .map((key) => req.body[key]);
      
      console.log("[createPlanDevotion] Paragraphs count:", paragraphs.length);
      
      let image = null;
      if (req.file) {
        console.log("[createPlanDevotion] File detected, uploading...");
        try {
          const uploadResult = await uploadImage(req.file);
          image = uploadResult;
          console.log("[createPlanDevotion] Image uploaded:", image);
        } catch (uploadError) {
          console.error("[createPlanDevotion] Image upload error:", uploadError);
          // Continue without image
        }
      }
      
      // Get next order number
      console.log("[createPlanDevotion] Getting next order number...");
      const maxOrder = await Devotion.findOne({ planId: id })
        .sort({ order: -1 })
        .select("order")
        .lean();
      const order = maxOrder ? maxOrder.order + 1 : 0;
      console.log("[createPlanDevotion] Next order:", order);
      
      const devotion = await Devotion.create({
        planId: id,
        title,
        chapter,
        verse,
        body: paragraphs,
        prayer,
        image,
        order,
      });
      console.log("[createPlanDevotion] Devotion created:", devotion._id);
      res.status(201).json(devotion);
    } catch (error) {
      console.error("[createPlanDevotion] Error:", error);
      console.error("[createPlanDevotion] Error stack:", error.stack);
      res.status(500).json({ error: "Internal Server Error", message: error.message });
    }
  },
  updatePlanDevotion: async (req, res) => {
    try {
      const { id, devotionId } = req.params;
      const { month, day, year, title, chapter, verse, prayer } = req.body;
      const paragraphs = Object.keys(req.body)
        .filter((key) => key.startsWith("paragraph"))
        .map((key) => req.body[key]);
      const update = {
        planId: id,
        month,
        day,
        year,
        title,
        chapter,
        verse,
        body: paragraphs,
        prayer,
      };
      if (req.file) {
        const uploadResult = await uploadImage(req.file);
        update.image = uploadResult;
      }
      const updated = await Devotion.findOneAndUpdate(
        { _id: devotionId, planId: id },
        update,
        { new: true }
      );
      if (!updated) return res.status(404).json({ error: "Devotion not found" });
      res.status(200).json(updated);
    } catch (error) {
      console.error("Error updating plan devotion:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  deletePlanDevotion: async (req, res) => {
    try {
      const { id, devotionId } = req.params;
      const deleted = await Devotion.findOneAndDelete({
        _id: devotionId,
        planId: id,
      });
      if (!deleted) return res.status(404).json({ error: "Devotion not found" });
      res.status(200).json({ message: "Devotion deleted" });
    } catch (error) {
      console.error("Error deleting plan devotion:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
};


