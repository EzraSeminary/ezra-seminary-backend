// imagekit configuration for file saving (images + documents)

const ImageKit = require("imagekit");

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

const uploadImage = (file) => {
  return new Promise((resolve, reject) => {
    // Get the original file name without path and extension
    const originalName = file.originalname.split(".")[0]; // get the name before extension
    const extension = file.originalname.split(".").pop(); // get extension
    const fileName = `${originalName}_${Date.now()}.${extension}`;
    const folderPath = "/Devotion"; // Upload to the 'Devotion' folder

    imagekit.upload(
      {
        file: file.buffer, // File buffer
        fileName: fileName,
        folder: folderPath,
      },
      (error, result) => {
        if (error) {
          console.error("ImageKit upload failed:", error);
          return reject(error);
        }
        resolve(result.url); // Return the URL for the uploaded image
      }
    );
  });
};

const uploadFile = (file, folderPath = "/Explore") => {
  return new Promise((resolve, reject) => {
    const originalName = file.originalname.split(".")[0];
    const extension = file.originalname.split(".").pop();
    const fileName = `${originalName}_${Date.now()}.${extension}`;

    imagekit.upload(
      {
        file: file.buffer,
        fileName,
        folder: folderPath,
      },
      (error, result) => {
        if (error) {
          console.error("ImageKit upload failed:", error);
          return reject(error);
        }
        resolve(result.url);
      }
    );
  });
};

module.exports = {
  imagekit,
  uploadImage,
  uploadFile,
};

