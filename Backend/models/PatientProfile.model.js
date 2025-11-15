const mongoose = require('mongoose');

const patientProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    dateOfBirth: {
        type: Date
    },
    bloodType: {
        type: String,
        enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', '']
    },
    allergies: [{
        type: String,
        trim: true
    }],
    currentMedications: [{
        type: String,
        trim: true
    }],
    medicalHistory: [{
        type: String,
        trim: true
    }],
    emergencyContact: {
        name: String,
        relationship: String,
        phoneNumber: String
    },
    insuranceInfo: {
        provider: String,
        policyNumber: String,
        groupNumber: String
    },
    // Wellness goals
    wellnessGoals: [{
        goalType: {
            type: String,
            enum: ['steps', 'sleep', 'exercise', 'water', 'weight', 'other']
        },
        targetValue: Number,
        currentValue: Number,
        unit: String,
        startDate: Date,
        targetDate: Date
    }],
    // Preventive care reminders
    preventiveCare: [{
        careType: String,
        lastCompleted: Date,
        nextDue: Date,
        frequency: String,
        status: {
            type: String,
            enum: ['upcoming', 'overdue', 'completed']
        }
    }]
}, {
    timestamps: true
});

// Index is already created by unique: true on userId field

const PatientProfile = mongoose.model('PatientProfile', patientProfileSchema);

module.exports = PatientProfile;
