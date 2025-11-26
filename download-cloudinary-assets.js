// download-cloudinary-assets.js
import fs from "fs";
import path from "path";
import https from "https";

const assets = JSON.parse(fs.readFileSync("cloudinary_assets.json", "utf8"));

const DOWNLOAD_DIR = "./cloudinary_backup";

// Ensure folder exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const fileStream = fs.createWriteStream(filepath);
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          return reject(
            new Error(
              `Failed to download ${url}, status: ${response.statusCode}`
            )
          );
        }
        response.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close(resolve);
        });
      })
      .on("error", (err) => {
        fs.unlink(filepath, () => {});
        reject(err);
      });
  });
}

async function main() {
  for (const [index, asset] of assets.entries()) {
    const ext = asset.format ? `.${asset.format}` : "";
    // Keep folder structure if you like:
    const safePublicId = asset.public_id.replace(/[:*?"<>|]/g, "_"); // avoid invalid filename chars
    const filePath = path.join(DOWNLOAD_DIR, `${safePublicId}${ext}`);

    // Ensure nested dirs if you keep folders in public_id
    const dirName = path.dirname(filePath);
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName, { recursive: true });
    }

    console.log(
      `(${index + 1}/${assets.length}) Downloading ${
        asset.secure_url
      } → ${filePath}`
    );
    try {
      await downloadFile(asset.secure_url, filePath);
    } catch (err) {
      console.error("Error downloading", asset.secure_url, err.message);
    }
  }

  console.log("Download completed.");
}

main();
