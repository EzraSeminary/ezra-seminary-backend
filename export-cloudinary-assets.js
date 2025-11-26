// export-cloudinary-assets.js
import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: "dy233t3yl",
  api_key: "737799364788289",
  api_secret: "vnIYVSSiA5D3PVtRL22gt8i9zjE",
});

// Recursively fetch all resources and save to JSON
async function fetchAllResources() {
  let nextCursor = undefined;
  const allResources = [];

  try {
    do {
      const result = await cloudinary.api.resources({
        type: "upload",
        max_results: 500,
        next_cursor: nextCursor,
      });

      allResources.push(...result.resources);
      nextCursor = result.next_cursor;
      console.log("Fetched batch, total so far:", allResources.length);
    } while (nextCursor);

    fs.writeFileSync(
      "cloudinary_assets.json",
      JSON.stringify(allResources, null, 2)
    );
    console.log("Saved to cloudinary_assets.json");
  } catch (err) {
    console.error("Error fetching resources:", err);
  }
}

fetchAllResources();
