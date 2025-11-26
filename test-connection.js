// test-connection.js
// Simple script to test MongoDB connection and diagnose issues

require("dotenv").config();
const connectDb = require("./config/connectDb");
const mongoose = require("mongoose");

async function testConnection() {
  console.log("=== MongoDB Connection Test ===\n");

  // Check if MONGODB_KEY is set
  if (!process.env.MONGODB_KEY) {
    console.error("❌ ERROR: MONGODB_KEY environment variable is not set!");
    console.error("Please check your .env file.");
    process.exit(1);
  }

  console.log("✓ MONGODB_KEY is set");
  
  // Extract hostname for display
  const urlMatch = process.env.MONGODB_KEY.match(/mongodb\+srv:\/\/(?:[^@]+@)?([^/]+)/);
  if (urlMatch) {
    console.log(`✓ Hostname: ${urlMatch[1]}\n`);
  }

  // Test MongoDB connection using the improved connectDb function
  try {
    const connect = await connectDb();
    
    console.log("\n✓ MongoDB connection successful!");
    console.log(`  Host: ${connect.connection.host}`);
    console.log(`  Database: ${connect.connection.name}`);
    console.log(`  Ready state: ${connect.connection.readyState}`);
    
    // Test a simple query
    const adminDb = connect.connection.db.admin();
    const serverStatus = await adminDb.command({ ping: 1 });
    console.log("✓ Database ping successful");
    
    await mongoose.connection.close();
    console.log("\n✅ All tests passed! Your MongoDB connection is working.");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ MongoDB connection failed!");
    // Error details are already logged by connectDb
    process.exit(1);
  }
}

testConnection();

