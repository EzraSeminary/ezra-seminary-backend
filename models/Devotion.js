// models/Devotion.js

const mongoose = require('mongoose');

const devotionSchema = new mongoose.Schema({
  month: String,
  day: String,
  title: String,
  chapter: String,
  verse: String,
  body: [String],
  prayer: String,
  image: String,
});

const Devotion = mongoose.model('Devotion', devotionSchema);

module.exports = Devotion;




// body: []
// chapter:"12"
// day:"12"
// image:"data:image/jpeg;base64,/9j/4QvKRXhpZgAASUkqAAgAAA
// month:"ህዳር"
// prayer:"ሀልሎ"
// title:"hello"
// verse:"ስጡ ይሰጣችኋል"
