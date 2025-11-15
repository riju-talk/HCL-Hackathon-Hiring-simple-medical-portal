const express = require('express');
const router = express.Router();
const Doctor = require('../middleware/model/Doctor.model');
const Patient = require('../middleware/model/Patient.model');
const Appointment = require('../middleware/model/Appointment.model');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * GET /api/doctors
 * Get all doctors (Public or authenticated)
 */
router.get('/', async (req, res) => {
    try {
        const doctors = await Doctor.find()
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: doctors.length,
            doctors
        });
    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching doctors'
        });
    }
});

/**
 * GET /api/doctors/:id
 * Get doctor details by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const doctor = await Doctor.findById(id).select('-password');

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        res.status(200).json({
            success: true,
            doctor
        });
    } catch (error) {
        console.error('Error fetching doctor:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching doctor details'
        });
    }
});

/**
 * GET /api/doctors/:id/appointments
 * Get all appointments for a doctor (Doctor only)
 */
router.get('/:id/appointments', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if doctor is accessing their own appointments
        if (req.user.userId !== id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const appointments = await Appointment.find({ doctorId: id })
            .populate('patientId', 'fullName email')
            .sort({ appointmentDate: -1 });

        res.status(200).json({
            success: true,
            count: appointments.length,
            appointments
        });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching appointments'
        });
    }
});

/**
 * GET /api/doctors/:id/patients
 * Get all patients for a doctor (Doctor only)
 */
router.get('/:id/patients', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { id } = req.params;

        // Check if doctor is accessing their own patients
        if (req.user.userId !== id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Find all unique patients who have appointments with this doctor
        const appointments = await Appointment.find({ doctorId: id })
            .populate('patientId', 'fullName email createdAt')
            .sort({ appointmentDate: -1 });

        // Extract unique patients
        const uniquePatients = {};
        appointments.forEach(apt => {
            if (apt.patientId && !uniquePatients[apt.patientId._id]) {
                uniquePatients[apt.patientId._id] = apt.patientId;
            }
        });

        const patients = Object.values(uniquePatients);

        res.status(200).json({
            success: true,
            count: patients.length,
            patients
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching patients'
        });
    }
});

/**
 * PUT /api/doctors/appointments/:appointmentId
 * Update appointment status (Doctor only)
 */
router.put('/appointments/:appointmentId', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const { status, notes } = req.body;

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (status && !validStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status'
            });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({
                success: false,
                message: 'Appointment not found'
            });
        }

        // Check if doctor owns this appointment
        if (appointment.doctorId.toString() !== req.user.userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        // Update appointment
        if (status) appointment.status = status;
        if (notes !== undefined) appointment.notes = notes;

        await appointment.save();

        res.status(200).json({
            success: true,
            message: 'Appointment updated successfully',
            appointment
        });
    } catch (error) {
        console.error('Error updating appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating appointment'
        });
    }
});

/**
 * PUT /api/doctors/profile
 * Update doctor profile
 */
router.put('/profile', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { fullName, email } = req.body;
        
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email.toLowerCase();

        const doctor = await Doctor.findByIdAndUpdate(
            req.user.userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            doctor
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating profile'
        });
    }
});

module.exports = router;
