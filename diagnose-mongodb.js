// diagnose-mongodb.js
// Script to diagnose MongoDB connection string issues

require("dotenv").config();
const { exec } = require("child_process");
const util = require("util");
const execPromise = util.promisify(exec);

async function diagnoseMongoDB() {
  console.log("=== MongoDB Connection String Diagnostic ===\n");

  // Check if MONGODB_KEY exists
  if (!process.env.MONGODB_KEY) {
    console.error("❌ MONGODB_KEY is not set in your .env file");
    console.error("\nPlease add MONGODB_KEY to your .env file:");
    console.error("MONGODB_KEY=mongodb+srv://username:password@hostname/database?retryWrites=true&w=majority");
    process.exit(1);
  }

  console.log("✓ MONGODB_KEY is set\n");

  // Parse connection string
  const connectionString = process.env.MONGODB_KEY;
  const isSrv = connectionString.includes("mongodb+srv://");
  const isStandard = connectionString.includes("mongodb://");

  if (!isSrv && !isStandard) {
    console.error("❌ Invalid connection string format");
    console.error("Should start with 'mongodb://' or 'mongodb+srv://'");
    process.exit(1);
  }

  console.log(`✓ Connection type: ${isSrv ? "SRV (Atlas)" : "Standard"}\n`);

  // Extract hostname
  const regex = /mongodb(?:\+srv)?:\/\/(?:[^:]+:[^@]+@)?([^/?,]+)/;
  const match = connectionString.match(regex);

  if (!match || !match[1]) {
    console.error("❌ Could not extract hostname from connection string");
    console.error("\nExpected format:");
    console.error("mongodb+srv://username:password@HOSTNAME/database?options");
    console.error("\nYour connection string appears to be malformed.");
    console.error("Please get a fresh connection string from MongoDB Atlas:");
    console.error("1. Log into https://cloud.mongodb.com");
    console.error("2. Go to Database → Connect");
    console.error("3. Choose 'Connect your application'");
    console.error("4. Copy the connection string and replace in .env");
    process.exit(1);
  }

  const hostname = match[1];
  console.log(`✓ Hostname extracted: ${hostname}\n`);

  // Test DNS resolution
  console.log("Testing DNS resolution...");
  
  try {
    // Try nslookup
    const { stdout, stderr } = await execPromise(`nslookup ${hostname}`);
    
    if (stdout.includes("can't find") || stdout.includes("No answer") || stderr) {
      console.error("❌ DNS lookup failed - hostname not found\n");
      console.error("This means:");
      console.error("1. The MongoDB Atlas cluster may have been deleted");
      console.error("2. The cluster hostname has changed");
      console.error("3. The connection string is incorrect\n");
      console.error("SOLUTION:");
      console.error("→ Log into MongoDB Atlas (https://cloud.mongodb.com)");
      console.error("→ Check if your cluster exists and is running");
      console.error("→ Get a NEW connection string:");
      console.error("  1. Click on your cluster → Connect");
      console.error("  2. Choose 'Connect your application'");
      console.error("  3. Copy the connection string");
      console.error("  4. Replace MONGODB_KEY in your .env file");
      console.error("  5. Make sure to replace <password> with your actual password\n");
      process.exit(1);
    }
    
    console.log("✓ DNS resolution successful");
    console.log("Hostname is reachable\n");
    
    console.log("✅ Connection string appears valid!");
    console.log("If you still have connection issues, check:");
    console.log("1. MongoDB Atlas IP whitelist (add 0.0.0.0/0 to allow all)");
    console.log("2. Your username and password are correct");
    console.log("3. Your network allows outbound connections to MongoDB");
    
  } catch (error) {
    console.error("❌ DNS lookup failed\n");
    console.error("Error:", error.message);
    console.error("\nThis suggests the MongoDB hostname cannot be resolved.");
    console.error("\nACTION REQUIRED:");
    console.error("→ Your MongoDB Atlas cluster may have been deleted or renamed");
    console.error("→ Get a fresh connection string from MongoDB Atlas:");
    console.error("  1. Log in to https://cloud.mongodb.com");
    console.error("  2. Go to Database");
    console.error("  3. Check if 'ezra-seminary-cluster' exists");
    console.error("  4. If not, you may need to create a new cluster or restore a backup");
    console.error("  5. Get the connection string: Cluster → Connect → Drivers");
    console.error("  6. Update MONGODB_KEY in your .env file\n");
    process.exit(1);
  }
}

diagnoseMongoDB();


