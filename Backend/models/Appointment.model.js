const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function(userId) {
                const User = mongoose.model('User');
                const user = await User.findById(userId);
                return user && user.role === 'patient';
            },
            message: 'Patient ID must reference a user with patient role'
        }
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        validate: {
            validator: async function(userId) {
                const User = mongoose.model('User');
                const user = await User.findById(userId);
                return user && user.role === 'doctor';
            },
            message: 'Doctor ID must reference a user with doctor role'
        }
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    appointmentTime: {
        type: String,
        required: true
    },
    // Computed datetime for easier querying and conflict detection
    appointmentDateTime: {
        type: Date,
        required: true
    },
    duration: {
        type: Number, // in minutes
        default: 30
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'],
        default: 'pending'
    },
    notes: {
        type: String,
        trim: true
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    // For optimistic locking to prevent race conditions
    version: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Compound index for conflict detection
appointmentSchema.index({ doctorId: 1, appointmentDateTime: 1 });
appointmentSchema.index({ patientId: 1, appointmentDateTime: 1 });
appointmentSchema.index({ doctorId: 1, appointmentDate: 1, status: 1 });

// Pre-save hook to compute appointmentDateTime
appointmentSchema.pre('save', function(next) {
    if (this.appointmentDate && this.appointmentTime) {
        // Parse time string (e.g., "10:00 AM" or "14:30")
        const dateStr = this.appointmentDate.toISOString().split('T')[0];
        const timeStr = this.appointmentTime;
        
        // Simple time parsing
        let hours, minutes;
        if (timeStr.includes('AM') || timeStr.includes('PM')) {
            const [time, period] = timeStr.split(' ');
            const [h, m] = time.split(':');
            hours = parseInt(h);
            minutes = parseInt(m) || 0;
            if (period === 'PM' && hours !== 12) hours += 12;
            if (period === 'AM' && hours === 12) hours = 0;
        } else {
            const [h, m] = timeStr.split(':');
            hours = parseInt(h);
            minutes = parseInt(m) || 0;
        }
        
        const datetime = new Date(this.appointmentDate);
        datetime.setHours(hours, minutes, 0, 0);
        this.appointmentDateTime = datetime;
    }
    next();
});

// Static method to check for conflicts
appointmentSchema.statics.checkConflict = async function(doctorId, appointmentDateTime, duration = 30, excludeId = null) {
    const startTime = new Date(appointmentDateTime);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    
    const query = {
        doctorId: doctorId,
        status: { $nin: ['cancelled', 'no-show'] },
        $or: [
            // New appointment starts during existing appointment
            {
                appointmentDateTime: { $lte: startTime },
                $expr: {
                    $gte: [
                        { $add: ['$appointmentDateTime', { $multiply: ['$duration', 60000] }] },
                        startTime
                    ]
                }
            },
            // New appointment ends during existing appointment
            {
                appointmentDateTime: { $lt: endTime },
                $expr: {
                    $gt: [
                        { $add: ['$appointmentDateTime', { $multiply: ['$duration', 60000] }] },
                        startTime
                    ]
                }
            },
            // Existing appointment is completely within new appointment
            {
                appointmentDateTime: { $gte: startTime, $lt: endTime }
            }
        ]
    };
    
    if (excludeId) {
        query._id = { $ne: excludeId };
    }
    
    const conflicts = await this.find(query);
    return conflicts.length > 0 ? conflicts : null;
};

// Static method to book appointment with race condition protection
appointmentSchema.statics.bookWithLock = async function(appointmentData) {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Check for conflicts within transaction
        const conflicts = await this.checkConflict(
            appointmentData.doctorId,
            appointmentData.appointmentDateTime,
            appointmentData.duration
        );
        
        if (conflicts) {
            await session.abortTransaction();
            throw new Error('Time slot is no longer available');
        }
        
        // Create appointment within transaction
        const appointment = new this(appointmentData);
        await appointment.save({ session });
        
        await session.commitTransaction();
        return appointment;
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

const Appointment = mongoose.model('Appointment', appointmentSchema);

module.exports = Appointment;
