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
  modules: [{
    id: String,
    title: String,
    description: String,
    searchKeywords: String,
    duration: String,
    lessons: Number,
    completed: {
      type: Boolean,
      default: false
    },
    subModules: [{
      title: String,
      completed: {
        type: Boolean,
        default: false
      }
    }]
  }],
  assessments: [{
    moduleId: String,
    score: Number,
    total: Number,
    date: {
      type: Date,
      default: Date.now
    }
  }],
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
