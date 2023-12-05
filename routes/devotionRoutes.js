// const verifyJWT = require('../middleware/verifyJWT')

// router.use(verifyJWT)

// routes/devotionRoutes.js

const express = require('express');
const router = express.Router();
const devotionController = require('../controllers/devotionController');
const upload = require('../middleware/upload');
const verifyJWT = require('../middleware/requireAuth');

const { createDevotion, getDevotions, deleteDevotion } = devotionController;

// router.use(verifyJWT);

router.route('/create')
  .post(upload.single('image'), createDevotion);

router.route('/show')
  .get(getDevotions);

router.route("/:id")
  .delete(deleteDevotion);


module.exports = router;


