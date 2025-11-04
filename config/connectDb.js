const mongoose = require("mongoose");

const connectDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_KEY, {
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 15000,
    });
    console.log(
      "Database connected:",
      connect.connection.host,
      connect.connection.name
    );
  } catch (err) {
    console.error("MongoDB connection error:", err?.message || err);
    process.exit(1);
  }
};

module.exports = connectDb;
