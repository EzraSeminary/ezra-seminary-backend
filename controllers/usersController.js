const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { getAnalytics } = require("./analyticsController");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { uploadImage } = require("../middleware/cloudinary-users");

// Create JWT
const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "3d" });
};

// Google Login Controller
const googleLogin = async (req, res) => {
  try {
    // The user object is already available in req.user from the passport.js configuration
    const { _id, firstName, lastName, email, avatar, role } = req.user;

    // Create JWT token
    const token = createToken(_id);

    res.status(200).json({
      _id,
      firstName,
      lastName,
      email,
      token,
      role,
      avatar,
      progress: req.user.progress,
      achievement: req.user.achievement,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Verify Google Token Controller
const verifyGoogleToken = async (req, res) => {
  try {
    const { token: reqToken } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: reqToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const userid = payload["sub"];

    // Find user by googleId or email
    let user = await User.findOne({
      $or: [{ googleId: userid }, { email: payload.email }],
    });

    if (!user) {
      user = new User({
        googleId: userid,
        firstName: payload["given_name"],
        lastName: payload["family_name"],
        email: payload["email"],
        avatar: payload["picture"],
        createdAt: Date.now(),
      });
    } else if (!user.googleId) {
      // If user exists without googleId (legacy account), update it
      user.googleId = userid;
    }

    // Update last login time
    user.lastLogin = Date.now();
    await user.save();

    // Create JWT token
    const token = createToken(user._id);

    res.status(200).json({
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      token,
      role: user.role,
      avatar: user.avatar,
      progress: user.progress,
      achievement: user.achievement,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
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
      status: user.status,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Signup Controller
const signupUser = async (req, res) => {
  const { firstName, lastName, email, password, role } = req.body;
  let avatar = "default-avatar.jpg"; // Set a default avatar

  try {
    if (req.file) {
      const uploadResult = await uploadImage(req.file, "UserImage");
      avatar = uploadResult;
    }

    const user = await User.signup(
      firstName,
      lastName,
      email,
      password,
      role,
      avatar
    );

    if (!user.status) {
      user.status = "active";
      await user.save();
    }

    // create token
    const token = createToken(user._id);

    res.status(200).json({
      firstName,
      lastName,
      email,
      token,
      role: user.role,
      avatar: user.avatar,
      status: user.status,
    });
    console.log(user.avatar);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({ message: "Invalid status value" });
  }

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;
    await user.save();
    console.log(user.status);
    res.json({ message: `User ${status} successfully`, status: user.status });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Update User Profile Controller
const updateUserProfile = async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findById(userId);

    if (user) {
      // Allow Learner and Instructor to update their own profile
      if (
        (req.user.role === "Learner" || req.user.role === "Instructor") &&
        req.user._id.toString() !== userId
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Update the user's information
      user.firstName = req.body.firstName || user.firstName;
      user.lastName = req.body.lastName || user.lastName;
      user.email = req.body.email || user.email;

      if (req.file) {
        const uploadResult = await uploadImage(req.file, "UserImage");
        user.avatar = uploadResult;
      }

      user.role = req.body.role || user.role;

      if (req.body.password) {
        user.password = req.body.password; // Set raw password
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
    await User.findByIdAndDelete(id);
    console.log("User deleted");
    res.json({ message: "User deleted successfully" });
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
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const frontendUrl = process.env.FRONTEND_URL;
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request",
      text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n
            Please click on the following link, or paste this into your browser to complete the process:\n
            ${frontendUrl}/reset-password/${token}\n\n
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

    user.password = req.body.password; // Assuming the new password is in the request body
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({ message: "Password has been reset" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  googleLogin,
  loginUser,
  signupUser,
  verifyGoogleToken,
  updateUserProfile,
  getUserById,
  updateUserProgress,
  getCurrentUser,
  getUsers,
  deleteUser,
  forgotPassword,
  resetPassword,
  updateUserStatus,
};
