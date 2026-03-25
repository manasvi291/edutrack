const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  title: String,
  category: String,
  progress: Number,
  status: String
});

module.exports = mongoose.model("Course", courseSchema);