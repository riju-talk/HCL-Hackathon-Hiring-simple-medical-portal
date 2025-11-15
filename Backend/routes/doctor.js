const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const Appointment = require('../models/Appointment.model');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * GET /api/doctors - Get all doctors
 */
router.get('/', async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor', isActive: true })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: doctors.length, doctors });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({ success: false, message: 'Error fetching doctors' });
    }
});

/**
 * GET /api/doctors/:id - Get doctor by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const doctor = await User.findOne({ _id: req.params.id, role: 'doctor' }).select('-password');

        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found' });
        }

        res.status(200).json({ success: true, doctor });
    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({ success: false, message: 'Error fetching doctor details' });
    }
});

/**
 * GET /api/doctors/:id/appointments - Get doctor's appointments
 */
router.get('/:id/appointments', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        if (req.user.userId !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const appointments = await Appointment.find({ doctorId: req.params.id })
            .populate('patientId', 'fullName email phoneNumber')
            .sort({ appointmentDateTime: -1 });

        res.status(200).json({ success: true, count: appointments.length, appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Error fetching appointments' });
    }
});

/**
 * GET /api/doctors/:id/patients - Get doctor's patients
 */
router.get('/:id/patients', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        if (req.user.userId !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const appointments = await Appointment.find({ doctorId: req.params.id })
            .populate('patientId', 'fullName email phoneNumber createdAt')
            .sort({ appointmentDateTime: -1 });

        const uniquePatients = {};
        appointments.forEach(apt => {
            if (apt.patientId && !uniquePatients[apt.patientId._id]) {
                uniquePatients[apt.patientId._id] = apt.patientId;
            }
        });

        const patients = Object.values(uniquePatients);
        res.status(200).json({ success: true, count: patients.length, patients });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ success: false, message: 'Error fetching patients' });
    }
});

/**
 * PUT /api/doctors/appointments/:appointmentId - Update appointment
 */
router.put('/appointments/:appointmentId', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { status, notes } = req.body;

        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const appointment = await Appointment.findById(req.params.appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.doctorId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (status) appointment.status = status;
        if (notes !== undefined) appointment.notes = notes;

        await appointment.save();

        res.status(200).json({ success: true, message: 'Appointment updated successfully', appointment });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({ success: false, message: 'Error updating appointment' });
    }
});

/**
 * PUT /api/doctors/profile - Update doctor profile
 */
router.put('/profile', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { fullName, email, phoneNumber, address, specialization } = req.body;
        
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email.toLowerCase();
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (address) updateData.address = address;
        if (specialization) updateData.specialization = specialization;

        const doctor = await User.findByIdAndUpdate(
            req.user.userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({ success: true, message: 'Profile updated successfully', doctor });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

module.exports = router;
