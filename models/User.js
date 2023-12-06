const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const validator = require("validator");

const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: { type: String, required: true, unique: true }, // email must be unique
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin"], // Enum to restrict the value to 'user' or 'admin'
    default: "user", // Default role assigned if none is specified
  },
});

//static signup method
userSchema.statics.signup = async function (email, password, role = "user") {
  // validation
  if (!email || !password) {
    throw Error("All fields must be filled");
  }
  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }
  if (!validator.isStrongPassword(password)) {
    throw Error("Password is not strong enough");
  }

  const exists = await this.findOne({ email });

  if (exists) {
    throw Error("Email already in use");
  }
  // use bcrypt to hash the password
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  // Ensure the role is either 'user' or 'admin'
  if (!["user", "admin"].includes(role)) {
    throw Error("Role is not valid");
  }

  const user = await this.create({ email, password: hash });

  return user;
};

// static login method
userSchema.statics.login = async function (email, password) {
  // validation
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

  // compare password
  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    throw Error("Password is incorrect");
  }

  return user;
};

module.exports = mongoose.model("User", userSchema);
