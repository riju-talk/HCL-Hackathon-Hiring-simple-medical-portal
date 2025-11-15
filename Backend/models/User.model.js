const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: [true, 'Full name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters']
    },
    role: {
        type: String,
        required: [true, 'Role is required'],
        enum: ['patient', 'doctor'],
        lowercase: true
    },
    // Doctor-specific fields
    specialization: {
        type: String,
        trim: true
    },
    licenseNumber: {
        type: String,
        trim: true
    },
    yearsOfExperience: {
        type: Number,
        min: 0
    },
    // Common fields
    phoneNumber: {
        type: String,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    dateOfBirth: {
        type: Date
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

// Create compound index for better query performance
userSchema.index({ email: 1, role: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Override toJSON to exclude password
userSchema.methods.toJSON = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
