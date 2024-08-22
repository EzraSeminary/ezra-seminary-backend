const express = require("express");
const router = express.Router();
const devotionController = require("../controllers/devotionController");
const verifyJWT = require("../middleware/requireAuth");
const requireAdmin = require("../middleware/requireAdmin");
const { cloudinary, uploadImage } = require("../cloudinary");

const { createDevotion, getDevotions, deleteDevotion, updateDevotion } =
  devotionController;

// router.use(verifyJWT);

router.route("/create").post(async (req, res) => {
  try {
    const { title, content } = req.body;
    const file = req.files?.image;

    const imagePublicId = file ? await uploadImage(file) : null;

    const newDevotion = new Devotion({
      title,
      content,
      image: imagePublicId,
    });

    await newDevotion.save();
    res.status(201).json(newDevotion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.route("/show").get(getDevotions);

router.route("/:id").delete(verifyJWT, requireAdmin, deleteDevotion);

router.route("/:id").put(async (req, res) => {
  try {
    const devotionId = req.params.id;
    const { title, content } = req.body;
    const file = req.files?.image;

    const devotion = await Devotion.findById(devotionId);
    if (!devotion) {
      return res.status(404).json({ message: "Devotion not found" });
    }

    const imagePublicId = file ? await uploadImage(file) : devotion.image;

    devotion.title = title || devotion.title;
    devotion.content = content || devotion.content;
    devotion.image = imagePublicId;

    await devotion.save();
    res.status(200).json(devotion);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
