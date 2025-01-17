const express = require("express");
const router = express.Router();
const {
  googleLogin,
  verifyGoogleToken,
  loginUser,
  signupUser,
  updateUserProfile,
  getUserById,
  updateUserProgress,
  getCurrentUser,
  getUsers,
  deleteUser,
  forgotPassword,
  resetPassword,
  deactivateUser,
} = require("../controllers/usersController");
const contactController = require("../controllers/contactController");
const requireAuth = require("../middleware/requireAuth");
const upload = require("../middleware/upload");
const passport = require("../config/passport");

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
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.put("/deactivate/:id", deactivateUser);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  googleLogin
);

router.post("/auth/google/verify", verifyGoogleToken);

module.exports = router;
