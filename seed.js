const mongoose = require('mongoose');

// Because we are running this as a simple node script outside Next.js, 
// we'll define simple mongoose schemas inline to seed data.
const uri = process.env.MONGODB_URI || "mongodb+srv://edutrackUser:Edutrack%40123@cluster0.0fiqkoj.mongodb.net/?appName=Cluster0";

const CourseSchema = new mongoose.Schema({
  title: String,
  category: { type: String, default: 'General' },
  progress: { type: Number, default: 0 },
  status: { type: String, enum: ['ongoing', 'completed'], default: 'ongoing' }
}, { timestamps: true });

const Course = mongoose.models.Course || mongoose.model('Course', CourseSchema);

const seedCourses = [
  {
    title: 'Introduction to React Next.js',
    category: 'Web Development',
    progress: 40,
    status: 'ongoing'
  },
  {
    title: 'Advanced State Management',
    category: 'Web Development',
    progress: 100,
    status: 'completed'
  },
  {
    title: 'UI/UX Fundamentals',
    category: 'Design',
    progress: 10,
    status: 'ongoing'
  },
  {
    title: 'MongoDB Aggregations',
    category: 'Database',
    progress: 0,
    status: 'ongoing'
  },
  {
    title: 'Python for Data Science',
    category: 'Data Science',
    progress: 75,
    status: 'ongoing'
  }
];

async function seedDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(uri);
    console.log("Connected successfully!");

    // Clear existing data (optional)
    await Course.deleteMany({});
    console.log("Cleared existing courses.");

    // Insert dummy data
    await Course.insertMany(seedCourses);
    console.log(`Successfully added ${seedCourses.length} dummy courses!`);

    await mongoose.connection.close();
    console.log("Connection closed.");
  } catch (error) {
    console.error("Error seeding the database:", error);
    process.exit(1);
  }
}

seedDB();
