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

    res
      .status(200)
      .json({ email, token, firstName: user.firstName, role: user.role });
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
  console.log(req.body);
};

module.exports = {
  loginUser,
  signupUser,
  updateUserProfile,
};
