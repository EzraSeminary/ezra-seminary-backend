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
    const updateUser = await user.save();

    res.json({
      _id: updateUser._id,
      firstName: updateUser.firstName,
      lastName: updateUser.lastName,
      email: updateUser.email,
      avatar: updateUser.avatar,
      role: updateUser.role,
      token: createToken(updateUser._id),
    });
  } else {
    res.status(404);
    throw new Error("User not found");
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
  getUsers,
  deleteUser,
};
