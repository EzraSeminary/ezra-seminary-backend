const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  updateUserProfile,
  getUsers, // Add this line
} = require("../controllers/usersController");
const requireAuth = require("../middleware/requireAuth");
const upload = require("../middleware/upload");

//login route
router.post("/login", loginUser);
//signup route
router.post("/signup", signupUser);
router
  .route("/profile")
  .put(requireAuth, upload.single("avatar"), updateUserProfile);
router.get("/", getUsers); // Add this line

module.exports = router;
