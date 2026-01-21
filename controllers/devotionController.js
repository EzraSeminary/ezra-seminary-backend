// controllers/devotionController.js

const Devotion = require("../models/Devotion");
const { uploadImage } = require("../middleware/imagekit"); // Using ImageKit instead of Cloudinary
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
    // By default, exclude plan-specific devotions from general listing
    // unless client explicitly requests to include them via includePlan=true
    const includePlan =
      String(req.query.includePlan || "").toLowerCase() === "true";
    if (!includePlan) {
      query.$or = [{ planId: { $exists: false } }, { planId: null }];
    }
    if (typeof year !== "undefined") {
      const parsedYear = parseInt(year, 10);
      // Only apply year filter if a valid number was provided
      if (!isNaN(parsedYear)) {
        // Match numeric year, string year (legacy), or docs missing year (legacy)
        const yearOr = [
          { year: parsedYear },
          { year: String(parsedYear) },
          { year: { $exists: false } },
        ];
        if (query.$or) {
          // combine with existing $or for planId exclusion
          query.$and = [{ $or: query.$or }, { $or: yearOr }];
          delete query.$or;
        } else {
          query.$or = yearOr;
        }
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
    // Also add likes and comments counts
    if (Array.isArray(devotions)) {
      const origin = `${req.protocol}://${req.get("host")}`;
      devotions = devotions.map((d) => {
        const devotion = { ...d };

        // Normalize image URL
        if (
          devotion &&
          devotion.image &&
          typeof devotion.image === "string" &&
          !devotion.image.startsWith("http")
        ) {
          devotion.image = `${origin}/images/${devotion.image}`;
        }

        // Add likes, comments, and shares counts
        devotion.likesCount = Array.isArray(devotion.likes)
          ? devotion.likes.length
          : 0;
        devotion.commentsCount = Array.isArray(devotion.comments)
          ? devotion.comments.length
          : 0;
        devotion.sharesCount = Array.isArray(devotion.shares)
          ? devotion.shares.length
          : 0;

        // Check if current user liked this devotion (if authenticated)
        if (req.user && Array.isArray(devotion.likes)) {
          devotion.isLiked = devotion.likes.some(
            (likeId) => likeId.toString() === req.user._id.toString()
          );
        } else {
          devotion.isLiked = false;
        }

        // Don't send full likes/comments/shares arrays in list view for performance
        delete devotion.likes;
        delete devotion.comments;
        delete devotion.shares;

        return devotion;
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

    let devotions = await Devotion.find({ year: yearNum })
      .sort({ createdAt: sortOrder })
      .limit(limitNum)
      .lean();

    // Add likes and comments counts, and isLiked status
    if (Array.isArray(devotions)) {
      devotions = devotions.map((d) => {
        const devotion = { ...d };

        // Add likes, comments, and shares counts
        devotion.likesCount = Array.isArray(devotion.likes)
          ? devotion.likes.length
          : 0;
        devotion.commentsCount = Array.isArray(devotion.comments)
          ? devotion.comments.length
          : 0;
        devotion.sharesCount = Array.isArray(devotion.shares)
          ? devotion.shares.length
          : 0;

        // Check if current user liked this devotion (if authenticated)
        if (req.user && Array.isArray(devotion.likes)) {
          devotion.isLiked = devotion.likes.some(
            (likeId) => likeId.toString() === req.user._id.toString()
          );
        } else {
          devotion.isLiked = false;
        }

        // Don't send full likes/comments/shares arrays in list view for performance
        delete devotion.likes;
        delete devotion.comments;
        delete devotion.shares;

        return devotion;
      });
    }

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

// Like/Unlike a devotion
const toggleLikeDevotion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const devotion = await Devotion.findById(id);
    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    // Initialize likes array if it doesn't exist
    if (!Array.isArray(devotion.likes)) {
      devotion.likes = [];
    }

    // Check if user already liked this devotion
    const likeIndex = devotion.likes.findIndex(
      (likeId) => likeId.toString() === userId.toString()
    );

    if (likeIndex > -1) {
      // User already liked, remove the like
      devotion.likes.splice(likeIndex, 1);
    } else {
      // User hasn't liked, add the like
      devotion.likes.push(userId);
    }

    await devotion.save();

    res.status(200).json({
      message: likeIndex > -1 ? "Like removed" : "Like added",
      likesCount: devotion.likes.length,
      isLiked: likeIndex === -1, // true if we just added, false if we just removed
    });
  } catch (error) {
    console.error("Error toggling like:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get likes for a devotion
const getDevotionLikes = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id; // Optional, user might not be logged in

    const devotion = await Devotion.findById(id).select("likes").lean();
    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    // Check if user liked this devotion
    let isLiked = false;
    if (userId && Array.isArray(devotion.likes)) {
      isLiked = devotion.likes.some(
        (likeId) => likeId.toString() === userId.toString()
      );
    }

    res.status(200).json({
      likesCount: Array.isArray(devotion.likes) ? devotion.likes.length : 0,
      isLiked,
    });
  } catch (error) {
    console.error("Error fetching likes:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Add a comment to a devotion
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    if (!text || text.trim() === "") {
      return res.status(400).json({ error: "Comment text is required" });
    }

    const devotion = await Devotion.findById(id);
    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    // Initialize comments array if it doesn't exist
    if (!Array.isArray(devotion.comments)) {
      devotion.comments = [];
    }

    // Add the comment
    const newComment = {
      user: userId,
      text: text.trim(),
      createdAt: new Date(),
    };

    devotion.comments.push(newComment);
    await devotion.save();

    // Populate user info for the new comment
    await devotion.populate({
      path: "comments.user",
      select: "firstName lastName avatar",
    });

    const addedComment = devotion.comments[devotion.comments.length - 1];

    res.status(201).json({
      message: "Comment added successfully",
      comment: addedComment,
    });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get comments for a devotion
const getDevotionComments = async (req, res) => {
  try {
    const { id } = req.params;

    const devotion = await Devotion.findById(id)
      .select("comments")
      .populate({
        path: "comments.user",
        select: "firstName lastName avatar",
      })
      .lean();

    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    // Handle case where comments might be undefined or null
    const comments = Array.isArray(devotion.comments) ? devotion.comments : [];

    // Sort comments by creation date (newest first)
    const sortedComments = comments.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    res.status(200).json({
      comments: sortedComments,
      count: sortedComments.length,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Delete a comment
const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const devotion = await Devotion.findById(id);
    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    // Find the comment
    const comment = devotion.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    // Check if user is the owner of the comment or is an admin/instructor
    const isOwner = comment.user.toString() === userId.toString();
    const isAdmin = req.user.role === "Admin" || req.user.role === "Instructor";

    if (!isOwner && !isAdmin) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    // Remove the comment
    devotion.comments.pull(commentId);
    await devotion.save();

    res.status(200).json({
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Track a share (add user to shares array)
const trackShare = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    if (!userId) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const devotion = await Devotion.findById(id);
    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    // Initialize shares array if it doesn't exist
    if (!Array.isArray(devotion.shares)) {
      devotion.shares = [];
    }

    // Check if user already shared this devotion (optional - you might want to allow multiple shares)
    // For now, we'll track each share, but you can modify this to prevent duplicates if needed
    const hasShared = devotion.shares.some(
      (shareId) => shareId.toString() === userId.toString()
    );

    // Add the share (even if user already shared, we count it as a new share)
    devotion.shares.push(userId);
    await devotion.save();

    res.status(200).json({
      message: "Share tracked successfully",
      sharesCount: devotion.shares.length,
    });
  } catch (error) {
    console.error("Error tracking share:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get shares count for a devotion
const getDevotionShares = async (req, res) => {
  try {
    const { id } = req.params;

    const devotion = await Devotion.findById(id).select("shares").lean();
    if (!devotion) {
      return res.status(404).json({ error: "Devotion not found" });
    }

    res.status(200).json({
      sharesCount: Array.isArray(devotion.shares) ? devotion.shares.length : 0,
    });
  } catch (error) {
    console.error("Error fetching shares:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get available months for a specific year (just month names, no data)
const getMonthsByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const yearNum = parseInt(year, 10);
    
    if (isNaN(yearNum)) {
      return res.status(400).json({ error: "Invalid year parameter" });
    }

    // Get distinct months for the given year
    const months = await Devotion.distinct("month", { 
      year: yearNum,
      month: { $exists: true, $ne: "" } // Exclude empty months
    });

    // Sort months according to Ethiopian calendar order
    const ethiopianMonths = [
      "መስከረም",
      "ጥቅምት",
      "ህዳር",
      "ታህሳስ",
      "ጥር",
      "የካቲት",
      "መጋቢት",
      "ሚያዚያ",
      "ግንቦት",
      "ሰኔ",
      "ሐምሌ",
      "ነሐሴ",
      "ጳጉሜ",
    ];

    const sortedMonths = months
      .filter(month => ethiopianMonths.includes(month))
      .sort((a, b) => {
        const indexA = ethiopianMonths.indexOf(a);
        const indexB = ethiopianMonths.indexOf(b);
        return indexA - indexB;
      });

    res.status(200).json(sortedMonths);
  } catch (error) {
    console.error("Error fetching months by year:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Batch update devotion years
const batchUpdateDevotionYears = async (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, year }
    
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: "Updates array is required and must not be empty" });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      const { id, year } = update;
      
      if (!id || !year) {
        errors.push({ id, error: "Missing id or year" });
        continue;
      }

      const yearNum = parseInt(year, 10);
      if (isNaN(yearNum)) {
        errors.push({ id, error: "Invalid year value" });
        continue;
      }

      try {
        const updatedDevotion = await Devotion.findByIdAndUpdate(
          id,
          { year: yearNum },
          { new: true }
        );

        if (!updatedDevotion) {
          errors.push({ id, error: "Devotion not found" });
        } else {
          results.push({ id, year: yearNum, success: true });
        }
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    res.status(200).json({
      message: `Updated ${results.length} devotions successfully`,
      results,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error("Error batch updating devotion years:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get devotions for a specific year and month
const getDevotionsByYearAndMonth = async (req, res) => {
  try {
    const { year, month } = req.params;
    const yearNum = parseInt(year, 10);
    
    if (isNaN(yearNum)) {
      return res.status(400).json({ error: "Invalid year parameter" });
    }

    if (!month) {
      return res.status(400).json({ error: "Month parameter is required" });
    }

    // Build query
    const query = { year: yearNum, month: month };

    // Fetch devotions for the specific year and month
    let devotions = await Devotion.find(query)
      .sort({ day: -1 }) // Sort by day descending
      .lean();

    // Add likes and comments counts, and isLiked status
    if (Array.isArray(devotions)) {
      const origin = `${req.protocol}://${req.get("host")}`;
      devotions = devotions.map((d) => {
        const devotion = { ...d };

        // Normalize image URL
        if (
          devotion &&
          devotion.image &&
          typeof devotion.image === "string" &&
          !devotion.image.startsWith("http")
        ) {
          devotion.image = `${origin}/images/${devotion.image}`;
        }

        // Add likes, comments, and shares counts
        devotion.likesCount = Array.isArray(devotion.likes)
          ? devotion.likes.length
          : 0;
        devotion.commentsCount = Array.isArray(devotion.comments)
          ? devotion.comments.length
          : 0;
        devotion.sharesCount = Array.isArray(devotion.shares)
          ? devotion.shares.length
          : 0;

        // Check if current user liked this devotion (if authenticated)
        if (req.user && Array.isArray(devotion.likes)) {
          devotion.isLiked = devotion.likes.some(
            (likeId) => likeId.toString() === req.user._id.toString()
          );
        } else {
          devotion.isLiked = false;
        }

        // Don't send full likes/comments/shares arrays in list view for performance
        delete devotion.likes;
        delete devotion.comments;
        delete devotion.shares;

        return devotion;
      });
    }

    res.status(200).json(devotions);
  } catch (error) {
    console.error("Error fetching devotions by year and month:", error);
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
  toggleLikeDevotion,
  getDevotionLikes,
  addComment,
  getDevotionComments,
  deleteComment,
  trackShare,
  getDevotionShares,
  getMonthsByYear,
  getDevotionsByYearAndMonth,
  batchUpdateDevotionYears,
};
