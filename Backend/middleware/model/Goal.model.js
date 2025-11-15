const mongoose = require('mongoose');

// Goals for Patients (e.g., water intake, steps)
const GoalSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
        enum: ['Water Intake', 'Steps'], // Example goals
    },
    target: {
        type: Number,
        required: true,
    },
    currentProgress: {
        type: Number,
        default: 0,
    },
    date: {
        type: Date,
        default: () => new Date().setHours(0, 0, 0, 0) // Set to the start of the day
    }
});

GoalSchema.index({ user: 1, date: 1, title: 1 }, { unique: true }); // Ensure one goal type per user per day

module.exports = mongoose.model('Goal', GoalSchema);