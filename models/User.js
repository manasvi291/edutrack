import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  totalXP: {
    type: Number,
    default: 0
  },
  streak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: null
  },
  weeklyActivity: [{
    day: String,
    xp: { type: Number, default: 0 }
  }]
}, {
  timestamps: true
});

export default mongoose.models.User || mongoose.model('User', userSchema);
