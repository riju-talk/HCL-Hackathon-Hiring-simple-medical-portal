const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function(v) {
                const user = await mongoose.model('User').findById(v);
                return user && user.role === 'doctor';
            },
            message: 'doctorId must reference a user with role "doctor"'
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
        enum: ['patients', 'consultations', 'learning', 'research', 'other'],
        default: 'other'
    },
    targetValue: {
        type: Number,
        min: 0
    },
    currentValue: {
        type: Number,
        default: 0,
        min: 0
    },
    unit: {
        type: String,
        default: 'count'
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

// Index for faster queries
goalSchema.index({ doctorId: 1, targetDate: 1 });
goalSchema.index({ doctorId: 1, status: 1 });

// Method to mark goal as completed
goalSchema.methods.complete = function() {
    this.isCompleted = true;
    this.status = 'completed';
    this.completedAt = new Date();
    return this.save();
};

// Method to update progress
goalSchema.methods.updateProgress = function(value) {
    this.currentValue = value;
    if (this.targetValue && this.currentValue >= this.targetValue) {
        return this.complete();
    }
    return this.save();
};

// Static method to get today's goals for a doctor
goalSchema.statics.getTodaysGoals = function(doctorId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);
    
    return this.find({
        doctorId,
        targetDate: { $gte: startOfDay, $lte: endOfDay }
    }).sort({ createdAt: -1 });
};

const Goal = mongoose.model('Goal', goalSchema);

module.exports = Goal;
