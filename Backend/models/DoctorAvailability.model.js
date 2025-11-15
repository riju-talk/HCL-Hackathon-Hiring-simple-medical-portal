const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema({
    dayOfWeek: {
        type: String,
        required: true,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    },
    startTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    endTime: {
        type: String,
        required: true,
        match: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/ // HH:MM format
    },
    isActive: {
        type: Boolean,
        default: true
    }
});

const doctorAvailabilitySchema = new mongoose.Schema({
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
    slots: [availabilitySlotSchema]
}, {
    timestamps: true
});

// Index for faster queries
doctorAvailabilitySchema.index({ doctorId: 1 });

// Method to get available time slots for a specific date
doctorAvailabilitySchema.methods.getAvailableSlotsForDate = function(date) {
    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()];
    return this.slots.filter(slot => slot.dayOfWeek === dayOfWeek && slot.isActive);
};

// Static method to generate 30-minute time slots between start and end time
doctorAvailabilitySchema.statics.generateTimeSlots = function(startTime, endTime) {
    const slots = [];
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    let currentMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    while (currentMinutes < endMinutes) {
        const hours = Math.floor(currentMinutes / 60);
        const minutes = currentMinutes % 60;
        const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        slots.push(timeString);
        currentMinutes += 30; // 30-minute slots
    }
    
    return slots;
};

const DoctorAvailability = mongoose.model('DoctorAvailability', doctorAvailabilitySchema);

module.exports = DoctorAvailability;
