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
} = require("../controllers/usersController");
const contactController = require("../controllers/contactController");
const requireAuth = require("../middleware/requireAuth");
const { cloudinary, uploadImage } = require("../cloudinary");

//login route
router.post("/login", loginUser);
//signup route
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const file = req.files?.avatar;

    const avatarPublicId = file ? await uploadImage(file) : null;

    const newUser = new User({
      name,
      email,
      password,
      avatar: avatarPublicId,
    });

    await newUser.save();
    res.status(201).json(newUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.route("/profile/:id").put(requireAuth, async (req, res) => {
  try {
    const userId = req.params.id;
    const { name, email, bio } = req.body;
    const file = req.files?.avatar;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const avatarPublicId = file ? await uploadImage(file) : user.avatar;

    user.name = name || user.name;
    user.email = email || user.email;
    user.bio = bio || user.bio;
    user.avatar = avatarPublicId;

    await user.save();
    res.status(200).json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/get/:id", getUserById);
router.put("/progress", requireAuth, updateUserProgress);
router.get("/current", requireAuth, getCurrentUser);
router.get("/", getUsers); // Add this line
router.delete("/:id", deleteUser);

router.post("/contact", contactController.sendContactMessage);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

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
