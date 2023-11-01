const mongoose = require('mongoose');

const devotionSchema = new mongoose.Schema({
  month: String,
  day: String,
  title: String,
  chapter: String,
  verse: String,
  body: String,
  prayer: String,
  image: String,
  paragraphs: [String],
});

const Devotion = mongoose.model('Devotion', devotionSchema);

module.exports = Devotion;
