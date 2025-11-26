// imagekit configuration for course image/audio saving

const ImageKit = require("imagekit");
const multer = require("multer");
const path = require("path");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

// Custom multer storage for ImageKit
const storage = multer.memoryStorage();

// Configure Multer
const upload = multer({
  storage: storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB limit
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("audio/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only image & audio files are allowed"), false);
    }
  },
});

// Upload function for ImageKit
const uploadToImageKit = (file, folder = "Courses") => {
  return new Promise((resolve, reject) => {
    const originalName = path.parse(file.originalname).name;
    const extension = path.parse(file.originalname).ext.substring(1); // Remove the dot
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `${originalName}_${timestamp}_${randomId}.${extension}`;
    const folderPath = `/${folder}`;

    imagekit.upload(
      {
        file: file.buffer,
        fileName: fileName,
        folder: folderPath,
      },
      (error, result) => {
        if (error) {
          console.error("ImageKit upload failed:", error);
          return reject(error);
        }
        resolve(result.url); // Return the URL
      }
    );
  });
};

// Delete function for ImageKit
const deleteFromImageKit = (url) => {
  return new Promise((resolve, reject) => {
    if (!url || !url.includes("imagekit.io")) {
      // Not an ImageKit URL, skip deletion (might be old Cloudinary URL)
      return resolve({ message: "Not an ImageKit URL, skipping deletion" });
    }

    try {
      // ImageKit URLs format: https://ik.imagekit.io/your_imagekit_id/folder/filename
      // We need to extract the file path (everything after the imagekit_id)
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter((p) => p);
      
      if (pathParts.length > 1) {
        // Skip the first part (imagekit_id) and join the rest as file path
        // Example: pathParts = ['imagekit_id', 'Devotion', 'image.jpg']
        // filePath = 'Devotion/image.jpg'
        const filePath = pathParts.slice(1).join("/");
        
        imagekit.deleteFile(filePath, (error, result) => {
          if (error) {
            console.error("ImageKit delete failed for path:", filePath, error);
            // Don't reject - just log the error and resolve
            // This prevents course deletion from failing if file deletion fails
            return resolve({ 
              message: "Delete attempted but failed", 
              error: error.message,
              filePath: filePath 
            });
          } else {
            console.log("Successfully deleted file:", filePath);
            resolve(result);
          }
        });
      } else {
        console.warn("Could not extract file path from URL:", url);
        resolve({ message: "Could not extract file path from URL" });
      }
    } catch (err) {
      console.error("Error parsing URL for deletion:", err);
      resolve({ message: "Error parsing URL", error: err.message });
    }
  });
};

module.exports = {
  imagekit,
  upload,
  uploadToImageKit,
  deleteFromImageKit,
};

