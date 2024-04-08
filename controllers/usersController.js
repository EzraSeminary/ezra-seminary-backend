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
  const { firstName, lastName, email, password, role } = req.body;
  let avatar = "default-avatar.jpg"; // Set a default avatar

  if (req.file) {
    // File was uploaded successfully
    avatar = req.file.filename;
  }

  try {
    const user = await User.signup(
      firstName,
      lastName,
      email,
      password,
      role,
      avatar
    );

    // create token
    const token = createToken(user._id);

    res.status(200).json({
      firstName,
      lastName,
      email,
      token,
      role: user.role,
      avatar: user.avatar, // Include the avatar in the response
    });
    console.log(user.avatar);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateUserProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (user) {
      // Allow Learner to update their own profile
      if (req.user.role === "Learner" && req.user._id.toString() !== userId) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Update the user's information
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;
      user.avatar = req.file ? req.file.filename : user.avatar;

      if (req.body.password) {
        user.password = req.body.password;
      }
      if (req.body.progress) {
        user.progress = req.body.progress;
      }
      if (req.body.achievement) {
        user.achievement = req.body.achievement;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
        progress: updatedUser.progress,
        achievement: updatedUser.achievement,
        token: createToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error("User not found");
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
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

const getUsers = async (req, res) => {
  try {
    const users = await User.find({}, { password: 0 }); // Exclude the password field
    res.status(200).json(users);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  loginUser,
  signupUser,
  updateUserProfile,
  getUserById,
  updateUserProgress,
  getCurrentUser,
  getUsers,
  deleteUser,
};
