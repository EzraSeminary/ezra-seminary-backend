const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  updateUserProfile,
  getUserById,
  updateUserProgress,
  getCurrentUser,
} = require("../controllers/usersController");
const requireAuth = require("../middleware/requireAuth");
const upload = require("../middleware/upload"); // Add this line

//login route
router.post("/login", loginUser);
//signup route
router.post("/signup", signupUser);
router
  .route("/profile")
  .put(requireAuth, upload.single("avatar"), updateUserProfile);
router.get("/get/:id", getUserById);
router.put("/progress", requireAuth, updateUserProgress);
router.get("/current", requireAuth, getCurrentUser);

module.exports = router;
