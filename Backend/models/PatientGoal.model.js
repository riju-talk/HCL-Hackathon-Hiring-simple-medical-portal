const mongoose = require('mongoose');

const patientGoalSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function(v) {
                const user = await mongoose.model('User').findById(v);
                return user && user.role === 'patient';
            },
            message: 'patientId must reference a user with role "patient"'
        }
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    targetDate: {
        type: Date,
        required: true
    },
    category: {
        type: String,
        enum: ['medication', 'exercise', 'nutrition', 'hydration', 'sleep', 'appointment', 'other'],
        default: 'other'
    },
    targetValue: {
        type: Number
    },
    currentValue: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        default: 'count'
    },
    frequency: {
        type: String,
        enum: ['once', 'daily', 'weekly', 'custom'],
        default: 'once'
    },
    reminderTime: {
        type: String // HH:MM format
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled'],
        default: 'active'
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});

// Indexes
patientGoalSchema.index({ patientId: 1, targetDate: 1 });
patientGoalSchema.index({ patientId: 1, status: 1 });
patientGoalSchema.index({ patientId: 1, category: 1 });

// Instance method to mark goal as completed
patientGoalSchema.methods.complete = function() {
    this.isCompleted = true;
    this.status = 'completed';
    this.completedAt = new Date();
    if (this.targetValue) {
        this.currentValue = this.targetValue;
    }
    return this.save();
};

// Instance method to update progress
patientGoalSchema.methods.updateProgress = function(value) {
    this.currentValue = value;
    if (this.targetValue && this.currentValue >= this.targetValue) {
        this.isCompleted = true;
        this.status = 'completed';
        this.completedAt = new Date();
    }
    return this.save();
};

// Static method to get today's goals for a patient
patientGoalSchema.statics.getTodaysGoals = async function(patientId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return this.find({
        patientId,
        targetDate: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).sort({ createdAt: -1 });
};

const PatientGoal = mongoose.model('PatientGoal', patientGoalSchema);

module.exports = PatientGoal;
