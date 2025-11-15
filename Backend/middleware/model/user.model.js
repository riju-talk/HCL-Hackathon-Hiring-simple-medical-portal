const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['patient', 'provider'], // Updated role name
    required: true,
  },
  // For Patient: Link to their provider
  assignedProvider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // For Provider: List of their patients
  assignedPatients: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  consent: {
    type: Boolean,
    required: function() { return this.role === 'patient'; }, // Required for patients
    default: false,
  }
});

module.exports = mongoose.model('User', UserSchema);