const User = require("../models/User");
const jwt = require("jsonwebtoken");
const upload = require("../middleware/upload");

// Create JWT
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

// Login Controller
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    // create token
    const token = createToken(user._id);

    res.status(200).json({
      email,
      token,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      avatar: user.avatar,
      progress: user.progress,
      achievement: user.achievement,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Signup Controller
const signupUser = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  try {
    const user = await User.signup(firstName, lastName, email, password);

    // create token
    const token = createToken(user._id);

    res
      .status(200)
      .json({ firstName, lastName, email, token, role: user.role });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  const user = await User.findById(req.user._id);

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    // user.avatar = req.file ? `/images/${req.file.filename}` : user.avatar; // mukera 1
    user.avatar = req.file ? req.file.filename : user.avatar;

    console.log(req.file);

    if (req.body.password) {
      user.password = req.body.password;
    }
    if (req.body.progress) {
      user.progress = req.body.progress;
    }
    if (req.body.achievement) {
      user.achievement = req.body.achievement;
    }
    const updateUser = await user.save();

    res.json({
      _id: updateUser._id,
      firstName: updateUser.firstName,
      lastName: updateUser.lastName,
      email: updateUser.email,
      avatar: updateUser.avatar,
      role: updateUser.role,
      progress: updateUser.progress,
      achievement: updateUser.achievement,
      token: createToken(updateUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id); // assuming that :id is the route parameter
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      progress: user.progress,
      achievement: user.achievement,
    });
  } catch (error) {
    // If the ID format is invalid or an error occurs
    res.status(500).json({ error: error.message });
  }
};

// Update User Progress Controller
const updateUserProgress = async (req, res) => {
  console.log("req.user:", req.user);
  if (!req.user) {
    return res.status(401).json({ error: "User must be logged in." });
  }

  const { progress } = req.body;
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.progress = progress;

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      progress: updatedUser.progress,
      achievement: updatedUser.achievement,
      token: createToken(updatedUser._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCurrentUser = async (req, res) => {
  const userId = req.user._id; // getting user id from the token

  try {
    const user = await User.findById(userId).select("-password"); // Exclude password from the result
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      progress: user.progress,
      achievement: user.achievement,
      token: createToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  loginUser,
  signupUser,
  updateUserProfile,
  getUserById,
  updateUserProgress,
  getCurrentUser,
};
