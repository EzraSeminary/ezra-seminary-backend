// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

// routes/devotionRoutes.js

const express = require("express");
const router = express.Router();
const devotionController = require("../controllers/devotionController");
const upload = require("../middleware/upload");
const verifyJWT = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

const {
  createDevotion,
  getDevotions,
  deleteDevotion,
  updateDevotion,
  getAvailableYears,
  getDevotionsByYear,
  createDevotionsForNewYear,
} = devotionController;

// router.use(verifyJWT);

router.route("/create").post(upload.single("image"), createDevotion);

// Old app expects this:
router.get("/show", getDevotions);

// Also serve base for compatibility
router.get("/", getDevotions);
router.route("/show").get(getDevotions);

// Year-specific routes
router.route("/years").get(getAvailableYears);
router.route("/year/:year").get(getDevotionsByYear);
router
  .route("/copy-year")
  .post(verifyJWT, requireAdmin, createDevotionsForNewYear);

router.route("/:id").delete(verifyJWT, requireAdmin, deleteDevotion);
router
  .route("/:id")
  .put(upload.single("image"), verifyJWT, requireAdmin, updateDevotion); // update

module.exports = router;
