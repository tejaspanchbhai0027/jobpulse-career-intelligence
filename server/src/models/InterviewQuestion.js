const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: false,
    },
    question: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    topic: {
      type: String,
      trim: true,
      default: 'General',
    },
    difficulty: {
      type: Number,
      min: 1,
      max: 5,
      default: 3,
    },
    myAnswer: {
      type: String,
      default: '',
    },
    betterAnswer: {
      type: String,
      default: '',
    }
  },
  { timestamps: true }
);

interviewQuestionSchema.index({ user: 1, topic: 1 });
interviewQuestionSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewQuestion', interviewQuestionSchema);
