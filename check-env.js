// check-env.js
// Check environment variables and .env file status

const fs = require("fs");
const path = require("path");

console.log("=== Environment Variable Check ===\n");

// Check if .env file exists
const envPath = path.join(__dirname, ".env");
const envExists = fs.existsSync(envPath);

console.log(`1. .env file exists: ${envExists ? "✓ YES" : "✗ NO"}`);

if (envExists) {
  try {
    const envContent = fs.readFileSync(envPath, "utf8");
    const lines = envContent.split("\n").filter(line => line.trim() && !line.startsWith("#"));
    console.log(`2. .env file lines (non-empty): ${lines.length}`);
    
    // Check for MONGODB_KEY without showing the value
    const hasMongoKey = lines.some(line => line.startsWith("MONGODB_KEY="));
    console.log(`3. MONGODB_KEY in .env: ${hasMongoKey ? "✓ YES" : "✗ NO"}`);
    
    if (hasMongoKey) {
      const mongoLine = lines.find(line => line.startsWith("MONGODB_KEY="));
      const value = mongoLine.split("=")[1];
      if (!value || value.trim() === "") {
        console.log("   ✗ MONGODB_KEY is empty!");
      } else {
        // Show only the format, not the actual value
        const isSrv = value.includes("mongodb+srv://");
        const isStandard = value.includes("mongodb://");
        console.log(`   Format: ${isSrv ? "mongodb+srv://" : isStandard ? "mongodb://" : "INVALID"}`);
        
        // Check if it has the basic structure
        const hasAt = value.includes("@");
        const hasSlash = value.includes("/");
        console.log(`   Has @ symbol: ${hasAt ? "✓" : "✗"}`);
        console.log(`   Has / after hostname: ${hasSlash ? "✓" : "✗"}`);
      }
    } else {
      console.log("\n✗ MONGODB_KEY not found in .env file!");
      console.log("\nPlease add it to your .env file:");
      console.log("MONGODB_KEY=mongodb+srv://username:password@cluster.mongodb.net/database");
    }
  } catch (error) {
    console.log(`Error reading .env: ${error.message}`);
  }
}

console.log("\n4. Loading .env with dotenv...");
require("dotenv").config();

console.log(`5. process.env.MONGODB_KEY is set: ${process.env.MONGODB_KEY ? "✓ YES" : "✗ NO"}`);

if (!process.env.MONGODB_KEY) {
  console.log("\n❌ ISSUE: dotenv failed to load MONGODB_KEY");
  console.log("\nPossible solutions:");
  console.log("1. Check .env file syntax (no spaces around =)");
  console.log("2. Make sure .env is in the ezra_backend folder");
  console.log("3. Try adding quotes: MONGODB_KEY=\"your-connection-string\"");
  console.log("4. Check for special characters that need escaping");
} else {
  console.log("\n✅ MONGODB_KEY loaded successfully!");
  console.log("\nNow testing DNS resolution...");
  
  const hostname = process.env.MONGODB_KEY.match(/mongodb(?:\+srv)?:\/\/(?:[^:]+:[^@]+@)?([^/?,]+)/);
  if (hostname && hostname[1]) {
    console.log(`Hostname: ${hostname[1]}`);
    console.log("\nRun 'node diagnose-mongodb.js' to test DNS resolution");
  }
}


