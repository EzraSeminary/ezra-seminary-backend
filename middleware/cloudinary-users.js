// cloudinary configuration for user image saving

const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dy233t3yl",
  api_key: "737799364788289",
  api_secret: "vnIYVSSiA5D3PVtRL22gt8i9zjE",
});

const uploadImage = (file) => {
  return new Promise((resolve, reject) => {
    // Get the original file name without path and extension
    const originalName = file.originalname.split(".")[0]; // get the name before extension
    const extension = file.originalname.split(".").pop(); // get extension
    const publicId = `${originalName}`; // you can adjust this to include folders or timestamps if necessary

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: publicId, // Use the original file name
        folder: "UserImage", // Upload to the 'Devotion' folder
      },
      (error, result) => {
        if (error) {
          console.error("Upload failed:", error);
          return reject(error);
        }
        resolve(result.secure_url); // Return the secure URL for the uploaded image
      }
    );

    stream.end(file.buffer); // Pipe the in-memory buffer to the upload stream
  });
};

module.exports = {
  cloudinary,
  uploadImage,
};
