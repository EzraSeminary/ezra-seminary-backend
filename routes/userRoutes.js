const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  updateUserProfile,
  getUserById,
  updateUserProgress,
  getCurrentUser,
  getUsers,
  deleteUser, // Add this line
} = require("../controllers/usersController");
const contactController = require("../controllers/contactController");
const requireAuth = require("../middleware/requireAuth");
const upload = require("../middleware/upload");

//login route
router.post("/login", loginUser);
//signup route
router.post("/signup", upload.single("avatar"), signupUser);
router
  .route("/profile/:id")
  .put(requireAuth, upload.single("avatar"), updateUserProfile);
router.get("/get/:id", getUserById);
router.put("/progress", requireAuth, updateUserProgress);
router.get("/current", requireAuth, getCurrentUser);
router.get("/", getUsers); // Add this line
router.delete("/:id", deleteUser);

router.post("/contact", contactController.sendContactMessage);

module.exports = router;
