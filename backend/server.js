const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const Course = require("./models/course");
const authMiddleware = require("./middleware/authMiddleware");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Connection 
mongoose
  .connect("mongodb://localhost:27017/edutrack")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

// AUTH Routes 
app.use("/api/auth", authRoutes);

// Dashboard API 
app.get("/api/dashboard", authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find();

    const enrolled = courses.length;
    const completed = courses.filter(
      (course) => course.status === "completed"
    ).length;
    const inProgress = courses.filter(
      (course) => course.status === "ongoing"
    ).length;

    res.json({
      enrolled,
      completed,
      inProgress,
      certificates: completed
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load dashboard data" });
  }
});

// Courses API 
app.get("/api/courses", authMiddleware, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch courses" });
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});