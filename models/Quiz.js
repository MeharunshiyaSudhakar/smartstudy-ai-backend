const mongoose = require('mongoose');

const quizSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        subject: {
            type: String,
            required: true,
        },
        questions: [
            {
                questionText: String,
                options: [String],
                correctAnswer: String,
                userAnswer: String,
            },
        ],
        score: {
            type: Number,
            required: true,
        },
        total: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Quiz', quizSchema);
