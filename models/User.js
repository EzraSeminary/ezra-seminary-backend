const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  role: {
    type: String,
    enum: ["Learner", "Admin", "Instructor"], // Ensure the role is either 'Learner', 'Instructor" or 'Admin'
    default: "Learner", // Default role is 'Learner'
  },
  avatar: { type: String, default: "default-avatar.jpg" },
  progress: [
    {
      courseId: { type: String, required: true },
      currentChapter: { type: Number, default: 0 },
      currentSlide: { type: Number, default: 0 },
    },
  ],
  achievement: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  deletedAt: { type: Date, default: null },
  lastLogin: { type: Date, default: Date.now },
  resetPasswordToken: { type: String },
  resetPasswordExpires: { type: Date },
  googleId: { type: String, unique: true, sparse: true },
});

userSchema.index({ email: 1 }, { unique: true }); // Create index for email field with unique set

userSchema.statics.signup = async function (
  firstName,
  lastName,
  email,
  password,
  role = "Learner",
  avatar = "default-avatar.jpg"
) {
  console.log("Signup data:", {
    firstName,
    lastName,
    email,
    password,
    role,
    avatar,
  });

  if (!firstName || !lastName || !email || !password) {
    throw Error("Invalid input");
  }

  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw Error("Email already in use");
  }

  const user = new this({
    firstName,
    lastName,
    email,
    password,
    role,
    avatar,
  });

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);

  await user.save();
  return user;
};

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// static login method
userSchema.statics.login = async function (email, password) {
  if (!email || !password) {
    throw Error("All fields must be filled");
  }

  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }

  const user = await this.findOne({ email });

  if (!user) {
    throw Error("Email not found");
  }

  if (!user.password) {
    throw Error("Password not set");
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw Error("Password is incorrect");
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
