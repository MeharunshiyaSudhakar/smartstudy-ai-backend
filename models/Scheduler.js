const mongoose = require('mongoose');

const schedulerSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        subject: {
            type: String,
            required: true,
        },
        topic: {
            type: String,
            required: true,
        },
        date: {
            type: String, // 'YYYY-MM-DD'
            required: true,
        },
        time: {
            type: String, // 'HH:MM'
            required: true,
        },
        duration: {
            type: Number, // in minutes
            required: true,
        },
        completed: {
            type: Boolean,
            default: false,
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Scheduler', schedulerSchema);
