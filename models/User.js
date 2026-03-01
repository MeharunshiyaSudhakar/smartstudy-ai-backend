const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        googleId: {
            type: String, // Optional, for OAuth
        },
        password: {
            type: String,
            // Not required if logging in via Google
        },
        studyPreferences: {
            type: [String],
            default: [],
        },
        resumeText: {
            type: String,
            default: null,
        },
        progressStats: {
            studyHours: { type: Number, default: 0 },
            quizzesCompleted: { type: Number, default: 0 },
            completionRate: { type: Number, default: 0 },
            weakSubjects: { type: [String], default: [] },
            interviewReadiness: { type: Number, default: 0 },
            dsaMastery: { type: Number, default: 0 },
            mockInterviewAverage: { type: Number, default: 0 },
            behavioralScore: { type: Number, default: 0 },
            designThinkingScore: { type: Number, default: 0 },
            totalMocks: { type: Number, default: 0 }
        },
        subscription: {
            plan: { type: String, enum: ['free', 'pro'], default: 'free' },
            stripeCustomerId: { type: String },
            stripeSubscriptionId: { type: String },
            validUntil: { type: Date },
        },
        usage: {
            aiTokensUsed: { type: Number, default: 0 },
            quizzesGeneratedToday: { type: Number, default: 0 },
            interviewQuestionsToday: { type: Number, default: 0 },
            mockInterviewsThisWeek: { type: Number, default: 0 },
            lastResetDate: { type: Date, default: Date.now },
            lastWeeklyResetDate: { type: Date, default: Date.now }
        }
    },
    { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    if (this.password) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
    } else {
        next();
    }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false;
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
