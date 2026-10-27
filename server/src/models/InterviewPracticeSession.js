const mongoose = require('mongoose');

const interviewPracticeSessionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    interview: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Interview',
      required: false, // Optional: might be general practice
      index: true
    },
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application',
      required: false
    },
    role: { type: String, default: 'General' },
    interviewType: { 
      type: String, 
      enum: ['Technical', 'HR', 'Mixed', 'Role-Specific'],
      default: 'Technical'
    },
    difficulty: { 
      type: String, 
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium'
    },
    mode: { 
      type: String, 
      enum: ['Mock', 'Practice'],
      default: 'Mock'
    },
    questions: [{
      question: String,
      topic: String,
      difficulty: String,
      relevance: String,
      studentAnswer: { type: String, default: '' },
      evaluation: {
        score: { type: Number, default: null }, // 0-10 or percentage
        technicalAccuracy: { type: Number, default: null },
        completeness: { type: Number, default: null },
        clarity: { type: Number, default: null },
        relevance: { type: Number, default: null },
        strengths: [{ type: String }],
        improvements: [{ type: String }],
        suggestedAnswer: { type: String, default: '' }
      }
    }],
    currentQuestionIndex: { type: Number, default: 0 },
    score: { type: Number, default: null }, // Overall mock score
    metrics: {
      technicalKnowledge: { type: Number, default: null },
      communication: { type: Number, default: null },
      completeness: { type: Number, default: null },
      relevance: { type: Number, default: null }
    },
    status: { 
      type: String, 
      enum: ['In Progress', 'Completed'], 
      default: 'In Progress' 
    },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date }
  },
  { timestamps: true }
);

interviewPracticeSessionSchema.index({ student: 1, status: 1 });
interviewPracticeSessionSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model('InterviewPracticeSession', interviewPracticeSessionSchema);
