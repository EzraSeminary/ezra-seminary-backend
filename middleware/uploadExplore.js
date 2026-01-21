const multer = require("multer");

const storage = multer.memoryStorage();

const allowedFileMimes = new Set([
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

const allowedImageMimes = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
]);

const fileFilter = (req, file, cb) => {
  const fieldName = file.fieldname;
  if (fieldName === "file") {
    if (allowedFileMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF and PowerPoint files are allowed (pdf, ppt, pptx)."
        ),
        false
      );
    }
  } else if (fieldName === "image") {
    if (allowedImageMimes.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files are allowed (jpg, png, webp)."
        ),
        false
      );
    }
  } else {
    cb(null, true);
  }
};

const uploadExplore = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

module.exports = uploadExplore;

