import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  category: {
    type: String,
    default: 'General'
  },
  progress: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['ongoing', 'completed'],
    default: 'ongoing'
  },
  url: {
    type: String,
    default: ''
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  deadline: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Force model refresh if schema changes in development
if (mongoose.models.Course && !mongoose.models.Course.schema.paths.user) {
  delete mongoose.models.Course;
}

export default mongoose.models.Course || mongoose.model('Course', courseSchema);
