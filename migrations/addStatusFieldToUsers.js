require("dotenv").config();
const mongoose = require("mongoose");
const User = require("../models/User");

const addStatusFieldToUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_KEY, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const users = await User.find({ status: { $exists: false } });

    for (const user of users) {
      user.status = "active";
      await user.save();
    }

    console.log("Migration completed: Added status field to users");
    mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed:", error);
    mongoose.disconnect();
  }
};

addStatusFieldToUsers();
