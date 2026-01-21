const express = require("express");
const router = express.Router();

const exploreController = require("../controllers/exploreController");
const requireAuth = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const uploadExplore = require("../middleware/uploadExplore");

// Public
router.get("/categories", exploreController.listCategories);
router.get("/items", exploreController.listItems); // ?categoryId=
router.get("/items/:id", exploreController.getItem);

// Admin
router.get("/admin/categories", requireAuth, requireAdmin, exploreController.adminListCategories);
router.get("/admin/items", requireAuth, requireAdmin, exploreController.adminListItems); // optional ?categoryId=
router.post("/admin/categories", requireAuth, requireAdmin, exploreController.createCategory);
router.put("/admin/categories/:id", requireAuth, requireAdmin, exploreController.updateCategory);
router.delete("/admin/categories/:id", requireAuth, requireAdmin, exploreController.deleteCategory);

router.post(
  "/admin/items",
  requireAuth,
  requireAdmin,
  uploadExplore.fields([
    { name: "file", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  exploreController.createItem
);
router.put(
  "/admin/items/:id",
  requireAuth,
  requireAdmin,
  uploadExplore.fields([{ name: "image", maxCount: 1 }]),
  exploreController.updateItem
);
router.delete("/admin/items/:id", requireAuth, requireAdmin, exploreController.deleteItem);

module.exports = router;

