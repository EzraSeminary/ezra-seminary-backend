const express = require("express");
const router = express.Router();
const {
  loginUser,
  signupUser,
  updateUserProfile,
  getUsers,
  deleteUser, // Add this line
} = require("../controllers/usersController");
const requireAuth = require("../middleware/requireAuth");
const upload = require("../middleware/upload");

//login route
router.post("/login", loginUser);
//signup route
router.post("/signup", upload.single("avatar"), signupUser);
router
  .route("/profile")
  .put(requireAuth, upload.single("avatar"), updateUserProfile);
router.get("/", getUsers); // Add this line
router.delete("/:id", deleteUser);

module.exports = router;
