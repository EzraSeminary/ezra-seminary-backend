const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: "dy233t3yl",
  api_key: "737799364788289",
  api_secret: "vnIYVSSiA5D3PVtRL22gt8i9zjE",
});

// Set the directory where the images are stored on the Heroku server
const imagesDirectory = path.join(__dirname, "public", "images");

// Function to upload a single file to Cloudinary
const uploadToCloudinary = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath);
    console.log(`Uploaded ${result.public_id}`);
    return result.public_id;
  } catch (error) {
    console.error(`Error uploading ${filePath}:`, error);
    throw error;
  }
};

// Function to migrate all images to Cloudinary
const migrateToCloudinary = async () => {
  const files = fs.readdirSync(imagesDirectory);
  for (const file of files) {
    const filePath = path.join(imagesDirectory, file);
    await uploadToCloudinary(filePath);
  }
};

migrateToCloudinary();
