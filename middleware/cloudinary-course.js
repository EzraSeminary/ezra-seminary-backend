// utils/cloudinary.js
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: "dy233t3yl",
  api_key: "737799364788289",
  api_secret: "vnIYVSSiA5D3PVtRL22gt8i9zjE",
});

const uploadImage = (file, folder) => {
  return new Promise((resolve, reject) => {
    const originalName = file.originalname.split(".")[0];
    const publicId = `${originalName}`;

    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        public_id: publicId,
        folder: folder,
      },
      (error, result) => {
        if (error) {
          console.error("Upload failed:", error);
          return reject(error);
        }
        resolve(result.secure_url);
      }
    );

    stream.end(file.buffer);
  });
};

module.exports = uploadImage;
