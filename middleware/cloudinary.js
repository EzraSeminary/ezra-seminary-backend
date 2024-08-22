// cloudinary configuration
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dy233t3yl",
  api_key: "737799364788289",
  api_secret: "vnIYVSSiA5D3PVtRL22gt8i9zjE",
});

const uploadImage = async (file) => {
  try {
    const result = await cloudinary.uploader.upload(file.path);
    return result.public_id;
  } catch (error) {
    console.error("Error uploading image to Cloudinary:", error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadImage,
};
