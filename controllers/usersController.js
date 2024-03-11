const User = require("../models/User");
const jwt = require("jsonwebtoken");

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

    if (req.body.password) {
      user.password = req.body.password;
      user.markModified("password");
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      token: generateToken(updatedUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
};

module.exports = {
  loginUser,
  signupUser,
  updateUserProfile,
};
