const ExploreCategory = require("../models/ExploreCategory");
const ExploreItem = require("../models/ExploreItem");
const { uploadFile } = require("../middleware/imagekit");

function detectFileType(mimeType, fileName) {
  const lower = String(fileName || "").toLowerCase();
  if (mimeType === "application/pdf" || lower.endsWith(".pdf")) return "pdf";
  if (mimeType === "application/vnd.ms-powerpoint" || lower.endsWith(".ppt"))
    return "ppt";
  if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.presentationml.presentation" ||
    lower.endsWith(".pptx")
  )
    return "pptx";
  return "file";
}

// Public: list categories (published only)
const listCategories = async (req, res) => {
  try {
    const categories = await ExploreCategory.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error listing explore categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Public: list items by category (published only)
const listItems = async (req, res) => {
  try {
    const { categoryId } = req.query;
    if (!categoryId) {
      return res.status(400).json({ error: "categoryId is required" });
    }
    const items = await ExploreItem.find({ categoryId, isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.status(200).json(items);
  } catch (error) {
    console.error("Error listing explore items:", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

// Public: get item
const getItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ExploreItem.findById(id).lean();
    if (!item || item.isPublished === false) {
      return res.status(404).json({ error: "Item not found" });
    }
    res.status(200).json(item);
  } catch (error) {
    console.error("Error getting explore item:", error);
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

// Admin: create category
const createCategory = async (req, res) => {
  try {
    const { title, description = "", order = 0, isPublished = true } = req.body;
    if (!title) return res.status(400).json({ error: "title is required" });
    const cat = await ExploreCategory.create({
      title,
      description,
      order: Number(order) || 0,
      isPublished: Boolean(isPublished),
    });
    res.status(201).json(cat);
  } catch (error) {
    console.error("Error creating explore category:", error);
    res.status(500).json({ error: "Failed to create category" });
  }
};

// Admin: update category
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, isPublished } = req.body;
    const update = {};
    if (typeof title !== "undefined") update.title = title;
    if (typeof description !== "undefined") update.description = description;
    if (typeof order !== "undefined") update.order = Number(order) || 0;
    if (typeof isPublished !== "undefined")
      update.isPublished = Boolean(isPublished);

    const cat = await ExploreCategory.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
    if (!cat) return res.status(404).json({ error: "Category not found" });
    res.status(200).json(cat);
  } catch (error) {
    console.error("Error updating explore category:", error);
    res.status(500).json({ error: "Failed to update category" });
  }
};

// Admin: create item (multipart with file and optional image)
const createItem = async (req, res) => {
  try {
    const {
      categoryId,
      title,
      description = "",
      order = 0,
      isPublished = true,
    } = req.body;
    if (!categoryId)
      return res.status(400).json({ error: "categoryId is required" });
    if (!title) return res.status(400).json({ error: "title is required" });

    // uploadExplore.fields(...) (used in the route) populates req.files as an object
    // with arrays for each field (e.g. req.files.file = [ ... ]). Older code used
    // req.file which is only present when using single-file middleware. Check
    // req.files.file[0] instead.
    const uploadedFile = req.files && req.files.file && req.files.file[0];
    if (!uploadedFile)
      return res.status(400).json({ error: "file is required" });

    const fileUrl = await uploadFile(uploadedFile, "/Explore");
    const fileType = detectFileType(
      uploadedFile.mimetype,
      uploadedFile.originalname
    );

    let imageUrl = "";
    if (req.files && req.files.image && req.files.image[0]) {
      imageUrl = await uploadFile(req.files.image[0], "/Explore/Images");
    }

    const item = await ExploreItem.create({
      categoryId,
      title,
      description,
      imageUrl,
      fileUrl,
      fileName: uploadedFile.originalname,
      mimeType: uploadedFile.mimetype,
      fileType,
      order: Number(order) || 0,
      isPublished: Boolean(isPublished),
    });

    res.status(201).json(item);
  } catch (error) {
    console.error("Error creating explore item:", error);
    res.status(500).json({ error: "Failed to create item" });
  }
};

// Admin: list all categories
const adminListCategories = async (_req, res) => {
  try {
    const categories = await ExploreCategory.find({})
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.status(200).json(categories);
  } catch (error) {
    console.error("Error listing explore categories (admin):", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Admin: list all items (optional filter by categoryId)
const adminListItems = async (req, res) => {
  try {
    const { categoryId } = req.query;
    const query = {};
    if (categoryId) query.categoryId = categoryId;
    const items = await ExploreItem.find(query)
      .sort({ order: 1, createdAt: -1 })
      .lean();
    res.status(200).json(items);
  } catch (error) {
    console.error("Error listing explore items (admin):", error);
    res.status(500).json({ error: "Failed to fetch items" });
  }
};

// Admin: update item (title/desc/order/published/category/image)
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, order, isPublished, categoryId } = req.body;
    const update = {};
    if (typeof title !== "undefined") update.title = title;
    if (typeof description !== "undefined") update.description = description;
    if (typeof order !== "undefined") update.order = Number(order) || 0;
    if (typeof isPublished !== "undefined")
      update.isPublished = Boolean(isPublished);
    if (typeof categoryId !== "undefined") update.categoryId = categoryId;

    // Handle image upload if provided
    if (req.files && req.files.image && req.files.image[0]) {
      update.imageUrl = await uploadFile(req.files.image[0], "/Explore/Images");
    }

    const item = await ExploreItem.findByIdAndUpdate(id, update, {
      new: true,
    }).lean();
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json(item);
  } catch (error) {
    console.error("Error updating explore item:", error);
    res.status(500).json({ error: "Failed to update item" });
  }
};

// Admin: delete item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await ExploreItem.findByIdAndDelete(id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting explore item:", error);
    res.status(500).json({ error: "Failed to delete item" });
  }
};

// Admin: delete category (and its items)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await ExploreItem.deleteMany({ categoryId: id });
    const cat = await ExploreCategory.findByIdAndDelete(id);
    if (!cat) return res.status(404).json({ error: "Category not found" });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    console.error("Error deleting explore category:", error);
    res.status(500).json({ error: "Failed to delete category" });
  }
};

module.exports = {
  listCategories,
  listItems,
  getItem,
  createCategory,
  updateCategory,
  createItem,
  adminListCategories,
  adminListItems,
  updateItem,
  deleteItem,
  deleteCategory,
};
