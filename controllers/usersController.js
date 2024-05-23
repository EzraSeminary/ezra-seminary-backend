const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { getAnalytics } = require("../controllers/analyticsController");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// Create JWT
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

// Login Controller
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.login(email, password);

    // Update the lastLogin field~
    user.lastLogin = new Date();
    await user.save();

    // create token
    const token = createToken(user._id);

    res.status(200).json({
      _id: user._id,
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
      user.role = req.body.role || user.role; // Update the role if provided in the request

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

      // Update the analytics data
      await getAnalytics();
    } else {
      res.status(404).json({ error: "User not found" });
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

    // Update the analytics data
    await getAnalytics(req);
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
    user.deletedAt = new Date();
    await user.save();
    res.json({ message: "User marked as deleted successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Email not found" });
    }

    // Generate a reset token
    const token = crypto.randomBytes(20).toString("hex");

    // Set the token and expiry time on the user document
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Send the email
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const mailOptions = {
      from: process.env.EMAIL,
      to: user.email,
      subject: "Password Reset Request",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
        Please click on the following link, or paste this into your browser to complete the process:\n
        http://${req.headers.host}/reset-password/${token}\n\n
        If you did not request this, please ignore this email and your password will remain unchanged.\n`,
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Email sent" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const resetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Password reset token is invalid or has expired" });
    }

    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset" });
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
  getUsers,
  deleteUser,
  forgotPassword,
  resetPassword,
};
