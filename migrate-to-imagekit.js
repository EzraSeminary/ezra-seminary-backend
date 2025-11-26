// migrate-to-imagekit.js
// This script migrates all Cloudinary assets to ImageKit.io

require("dotenv").config();
const ImageKit = require("imagekit");
const fs = require("fs");
const path = require("path");
const https = require("https");

// Initialize ImageKit
const imagekit = new ImageKit({
  publicKey: "public_MF6rEfZ9WGhe2VqfsXKlvNTe1/8=",
  privateKey: "private_UsJnClgvtvRQLZcVFTPHVgNDybc=",
  urlEndpoint: "https://ik.imagekit.io/ezraimages/",
});
// Read Cloudinary assets JSON
const assets = JSON.parse(fs.readFileSync("cloudinary_assets.json", "utf8"));

// Download file from URL
function downloadFile(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(
            new Error(
              `Failed to download ${url}, status: ${response.statusCode}`
            )
          );
        }
        const chunks = [];
        response.on("data", (chunk) => chunks.push(chunk));
        response.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

// Upload to ImageKit
function uploadToImageKit(buffer, fileName, folder) {
  return new Promise((resolve, reject) => {
    imagekit.upload(
      {
        file: buffer,
        fileName: fileName,
        folder: folder,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );
  });
}

// Main migration function
async function migrateAssets() {
  console.log(`Starting migration of ${assets.length} assets...\n`);

  const migrationLog = [];
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    const publicId = asset.public_id;
    const secureUrl = asset.secure_url;
    const format = asset.format || "jpg";
    const resourceType = asset.resource_type || "image";

    // Determine folder based on Cloudinary folder structure
    let folder = "/";
    if (publicId.includes("Devotion/")) {
      folder = "/Devotion";
    } else if (publicId.includes("UserImage/")) {
      folder = "/UserImage";
    } else if (publicId.includes("Courses/")) {
      folder = "/Courses";
    }

    // Extract filename from public_id
    const fileName = publicId.split("/").pop() + `.${format}`;

    try {
      console.log(
        `[${i + 1}/${
          assets.length
        }] Migrating: ${publicId} -> ${folder}/${fileName}`
      );

      // Download from Cloudinary
      const fileBuffer = await downloadFile(secureUrl);

      // Upload to ImageKit
      const result = await uploadToImageKit(fileBuffer, fileName, folder);

      migrationLog.push({
        cloudinaryUrl: secureUrl,
        cloudinaryPublicId: publicId,
        imagekitUrl: result.url,
        imagekitFileId: result.fileId,
        folder: folder,
        status: "success",
      });

      successCount++;
      console.log(`✓ Success: ${result.url}\n`);
    } catch (error) {
      console.error(`✗ Error migrating ${publicId}:`, error.message);
      migrationLog.push({
        cloudinaryUrl: secureUrl,
        cloudinaryPublicId: publicId,
        error: error.message,
        status: "error",
      });
      errorCount++;
    }

    // Add a small delay to avoid rate limiting
    if ((i + 1) % 10 === 0) {
      console.log(
        `\nProgress: ${i + 1}/${
          assets.length
        } (${successCount} success, ${errorCount} errors)\n`
      );
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // Save migration log
  fs.writeFileSync(
    "imagekit_migration_log.json",
    JSON.stringify(migrationLog, null, 2)
  );

  console.log("\n=== Migration Complete ===");
  console.log(`Total assets: ${assets.length}`);
  console.log(`Successful: ${successCount}`);
  console.log(`Errors: ${errorCount}`);
  console.log(`Migration log saved to: imagekit_migration_log.json`);
}

// Run migration
migrateAssets().catch((error) => {
  console.error("Migration failed:", error);
  process.exit(1);
});
