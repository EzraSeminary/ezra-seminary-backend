// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

// routes/devotionRoutes.js

const express = require("express");
const router = express.Router();
const devotionController = require("../controllers/devotionController");
const upload = require("../middleware/upload");
const verifyJWT = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");

const { createDevotion, getDevotions, deleteDevotion } = devotionController;

// router.use(verifyJWT);

router
  .route("/create")
  .post(upload.single("image"), verifyJWT, requireAdmin, createDevotion);

router.route("/show").get(verifyJWT, getDevotions);

router.route("/:id").delete(verifyJWT, requireAdmin, deleteDevotion);

module.exports = router;
