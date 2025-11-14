// controllers/devotionController.js

const Devotion = require("../models/Devotion");
const { uploadImage } = require("../middleware/cloudinary"); // Make sure to require your new uploadImage function
const { getCurrentEthiopianYear } = require("../utils/devotionUtils");

const createDevotion = async (req, res) => {
  try {
    const { month, day, year, title, chapter, verse, prayer } = req.body;

    // Extract all paragraph fields from the request body
    const paragraphs = Object.keys(req.body)
      .filter((key) => key.startsWith("paragraph"))
      .map((key) => req.body[key]);

    let image = null;
    // Check if there is an image file sent in the request
    if (req.file) {
      // Upload image to Cloudinary
      const uploadResult = await uploadImage(req.file); // Pass the file to the upload function
      image = uploadResult; // Get public_id or secure_url depending on what you need
    }

    const devotion = new Devotion({
      month,
      day,
      year: year || getCurrentEthiopianYear(), // Use provided year or current Ethiopian year
      title,
      chapter,
      verse,
      body: paragraphs,
      prayer,
      image, // This will contain the Cloudinary URL
    });

    const savedDevotion = await devotion.save();

    res.status(201).json(savedDevotion);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getDevotions = async (req, res) => {
  try {
    // Destructure and set default values for query parameters
    let { limit = 0, sort = "desc", year } = req.query;

    // Validate 'limit' parameter to ensure it's a non-negative integer
    limit = parseInt(limit, 10);
    if (isNaN(limit) || limit < 0) {
      return res.status(400).json({ error: "Invalid 'limit' parameter" });
    }
    // Apply sensible defaults and caps to avoid timeouts on hosted envs
    if (limit === 0) {
      limit = 1000;
    }
    const MAX_LIMIT = 2000;
    if (limit > MAX_LIMIT) {
      limit = MAX_LIMIT;
    }

    // Validate 'sort' parameter
    const sortOrder = sort.toLowerCase() === "asc" ? 1 : -1;

    // Build query filter
    const query = {};
    if (typeof year !== "undefined") {
      const parsedYear = parseInt(year, 10);
      // Only apply year filter if a valid number was provided
      if (!isNaN(parsedYear)) {
        // Match numeric year, string year (legacy), or docs missing year (legacy)
        query.$or = [
          { year: parsedYear },
          { year: String(parsedYear) },
          { year: { $exists: false } },
        ];
      }
      // If invalid (e.g., 'all'), ignore and fetch all years for backward compatibility
    }
    // Note: If no year is specified, we fetch all devotions to maintain backward compatibility

    // Fetch devotions from the database with applied sorting and limit
    let devotions = await Devotion.find(query)
      .sort({ createdAt: sortOrder })
      .limit(limit)
      .lean();

    // Debug logging for visibility in server logs
    console.log("[Devotions] Request query params:", req.query);
    console.log("[Devotions] Mongo query:", JSON.stringify(query));
    console.log(
      "[Devotions] Result count (initial):",
      Array.isArray(devotions) ? devotions.length : 0
    );
    if (Array.isArray(devotions) && devotions.length > 0) {
      console.log("[Devotions] First devotion (initial):", {
        _id: devotions[0]._id,
        title: devotions[0].title,
        month: devotions[0].month,
        day: devotions[0].day,
        year: devotions[0].year,
      });
    }

    // If you store filenames and serve from /images, normalize to absolute URLs:
    if (Array.isArray(devotions)) {
      const origin = `${req.protocol}://${req.get("host")}`;
      devotions = devotions.map((d) => {
        if (
          d &&
          d.image &&
          typeof d.image === "string" &&
          !d.image.startsWith("http")
        ) {
          return { ...d, image: `${origin}/images/${d.image}` };
        }
        return d;
      });
    }

    // If a specific year was requested but nothing was found, fall back to latest available year
    if (devotions.length === 0 && typeof year !== "undefined") {
      const availableYears = await Devotion.distinct("year");
      if (availableYears && availableYears.length > 0) {
        // Sort years descending and pick the most recent
        const latestYear = availableYears.sort((a, b) => b - a)[0];
        console.log(
          "[Devotions] Fallback: no results for requested year. Using latest available year:",
          latestYear
        );
        devotions = await Devotion.find({ year: latestYear })
          .sort({ createdAt: sortOrder })
          .limit(limit)
          .lean();
        console.log(
          "[Devotions] Result count (fallback):",
          Array.isArray(devotions) ? devotions.length : 0
        );
        if (Array.isArray(devotions) && devotions.length > 0) {
          console.log("[Devotions] First devotion (fallback):", {
            _id: devotions[0]._id,
            title: devotions[0].title,
            month: devotions[0].month,
            day: devotions[0].day,
            year: devotions[0].year,
          });
        }
      }
    }

    res.status(200).json(devotions);
  } catch (error) {
    console.error("Error fetching devotions:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteDevotion = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDevotion = await Devotion.findByIdAndDelete(id);
    if (!deletedDevotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }
    res.status(200).json({ message: "Devotion deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateDevotion = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, day, year, title, chapter, verse, prayer } = req.body;

    // Extract all paragraph fields from the request body
    const paragraphs = Object.keys(req.body)
      .filter((key) => key.startsWith("paragraph"))
      .map((key) => req.body[key]);

    const updateData = {
      month,
      day,
      year,
      title,
      chapter,
      verse,
      body: paragraphs,
      prayer,
    };

    if (req.file) {
      const uploadResult = await uploadImage(req.file);
      updateData.image = uploadResult;
    }

    const updatedDevotion = await Devotion.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedDevotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    res.status(200).json(updatedDevotion);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get available years for devotions
const getAvailableYears = async (req, res) => {
  try {
    const years = await Devotion.distinct("year");
    res.status(200).json(years.sort((a, b) => b - a)); // Sort in descending order (newest first)
  } catch (error) {
    console.error("Error fetching available years:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get devotions for a specific year
const getDevotionsByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const { limit = 0, sort = "desc" } = req.query;

    // Validate year parameter
    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum)) {
      return res.status(400).json({ error: "Invalid year parameter" });
    }

    // Validate 'limit' parameter
    const limitNum = parseInt(limit, 10);
    if (isNaN(limitNum) || limitNum < 0) {
      return res.status(400).json({ error: "Invalid 'limit' parameter" });
    }

    // Validate 'sort' parameter
    const sortOrder = sort.toLowerCase() === "asc" ? 1 : -1;

    const devotions = await Devotion.find({ year: yearNum })
      .sort({ createdAt: sortOrder })
      .limit(limitNum);

    res.status(200).json(devotions);
  } catch (error) {
    console.error("Error fetching devotions by year:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Create devotions for a new year (copy from existing year)
const createDevotionsForNewYear = async (req, res) => {
  try {
    const { sourceYear, targetYear } = req.body;

    if (!sourceYear || !targetYear) {
      return res
        .status(400)
        .json({ error: "Source year and target year are required" });
    }

    // Check if devotions already exist for target year
    const existingDevotions = await Devotion.countDocuments({
      year: targetYear,
    });
    if (existingDevotions > 0) {
      return res.status(400).json({
        error: `Devotions already exist for year ${targetYear}. Found ${existingDevotions} devotions.`,
      });
    }

    // Get devotions from source year
    const sourceDevotions = await Devotion.find({ year: sourceYear });
    if (sourceDevotions.length === 0) {
      return res.status(404).json({
        error: `No devotions found for source year ${sourceYear}`,
      });
    }

    // Create new devotions for target year
    const newDevotions = sourceDevotions.map((devotion) => ({
      month: devotion.month,
      day: devotion.day,
      year: targetYear,
      title: devotion.title,
      chapter: devotion.chapter,
      verse: devotion.verse,
      body: devotion.body,
      prayer: devotion.prayer,
      image: devotion.image,
    }));

    const createdDevotions = await Devotion.insertMany(newDevotions);

    res.status(201).json({
      message: `Successfully created ${createdDevotions.length} devotions for year ${targetYear}`,
      count: createdDevotions.length,
      devotions: createdDevotions,
    });
  } catch (error) {
    console.error("Error creating devotions for new year:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = {
  createDevotion,
  getDevotions,
  deleteDevotion,
  updateDevotion,
  getAvailableYears,
  getDevotionsByYear,
  createDevotionsForNewYear,
};
