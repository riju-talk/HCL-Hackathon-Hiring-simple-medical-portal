const mongoose = require('mongoose');

// Profile for Patients to store health info
const ProfileSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    allergies: {
        type: [String],
        default: [],
    },
    currentMedications: {
        type: [String],
        default: [],
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Profile', ProfileSchema);