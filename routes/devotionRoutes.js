// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

// routes/devotionRoutes.js

const express = require("express");
const router = express.Router();
const devotionController = require("../controllers/devotionController");
const upload = require("../middleware/upload");
const verifyJWT = require("../middleware/requireAuth");
const optionalAuth = require("../middleware/optionalAuth");
const requireAdmin = require("../middleware/requireAdmin");

const {
  createDevotion,
  getDevotions,
  deleteDevotion,
  updateDevotion,
  getAvailableYears,
  getDevotionsByYear,
  createDevotionsForNewYear,
  toggleLikeDevotion,
  getDevotionLikes,
  addComment,
  getDevotionComments,
  deleteComment,
} = devotionController;

// router.use(verifyJWT);

router.route("/create").post(upload.single("image"), createDevotion);

// Old app expects this:
router.get("/show", optionalAuth, getDevotions);

// Also serve base for compatibility
router.get("/", optionalAuth, getDevotions);
router.route("/show").get(optionalAuth, getDevotions);

// Year-specific routes
router.route("/years").get(getAvailableYears);
router.route("/year/:year").get(optionalAuth, getDevotionsByYear);
router
  .route("/copy-year")
  .post(verifyJWT, requireAdmin, createDevotionsForNewYear);

// IMPORTANT: More specific routes must come BEFORE generic /:id route
// Like/Unlike routes (requires authentication)
router.route("/:id/like").post(verifyJWT, toggleLikeDevotion);
router.route("/:id/likes").get(optionalAuth, getDevotionLikes); // Public endpoint, but checks auth if token provided

// Comment routes
router.route("/:id/comments").get(getDevotionComments); // Public endpoint
router.route("/:id/comments").post(verifyJWT, addComment); // Requires authentication
router.route("/:id/comments/:commentId").delete(verifyJWT, deleteComment); // Requires authentication

// Generic /:id routes (must come AFTER more specific routes)
router.route("/:id").delete(verifyJWT, requireAdmin, deleteDevotion);
router
  .route("/:id")
  .put(upload.single("image"), verifyJWT, requireAdmin, updateDevotion); // update

module.exports = router;
