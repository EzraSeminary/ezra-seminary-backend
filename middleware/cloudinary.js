// cloudinary configuration

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dy233t3yl",
  api_key: "737799364788289",
  api_secret: "vnIYVSSiA5D3PVtRL22gt8i9zjE",
});

const uploadImage = async (file) => {
  try {
    // Note: file.buffer will contain the contents when using memoryStorage
    const result = await cloudinary.uploader.upload(file.buffer, {
      resource_type: "auto",
    });
    return result.secure_url; // Return the secure URL for the uploaded image
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
};
