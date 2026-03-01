const mongoose = require('mongoose');

const interviewHistorySchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        type: {
            type: String,
            enum: ['qa', 'mock', 'quiz'],
            required: true,
        },
        category: {
            type: String, // Subject or Role
            required: true,
        },
        questions: {
            type: [String],
            default: []
        },
        answers: {
            type: [String],
            default: []
        },
        conversation: [{
            role: { type: String, enum: ['user', 'assistant'] },
            message: { type: String }
        }],
        feedback: {
            type: [String], // Store AI responses or evaluations
            default: []
        },
        score: {
            type: Number,
            default: null
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('InterviewHistory', interviewHistorySchema);
