const express = require('express');
const router = express.Router();
const Patient = require('../middleware/model/Patient.model');
const Appointment = require('../middleware/model/Appointment.model');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * GET /api/patients
 * Get all patients (Doctor only)
 */
router.get('/', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const patients = await Patient.find()
            .select('-password')
            .sort({ createdAt: -1 });

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
 * GET /api/patients/:id
 * Get patient details by ID (Doctor or own patient)
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check authorization - doctor can view any patient, patient can only view self
        if (req.user.role === 'patient' && req.user.userId !== id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const patient = await Patient.findById(id).select('-password');

        if (!patient) {
            return res.status(404).json({
                success: false,
                message: 'Patient not found'
            });
        }

        res.status(200).json({
            success: true,
            patient
        });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching patient details'
        });
    }
});

/**
 * GET /api/patients/:id/appointments
 * Get all appointments for a patient
 */
router.get('/:id/appointments', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Check authorization
        if (req.user.role === 'patient' && req.user.userId !== id) {
            return res.status(403).json({
                success: false,
                message: 'Access denied'
            });
        }

        const appointments = await Appointment.find({ patientId: id })
            .populate('doctorId', 'fullName email')
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
 * POST /api/patients/appointments
 * Book a new appointment (Patient only)
 */
router.post('/appointments', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const { doctorId, appointmentDate, appointmentTime, reason, notes } = req.body;

        // Validate required fields
        if (!doctorId || !appointmentDate || !appointmentTime || !reason) {
            return res.status(400).json({
                success: false,
                message: 'Doctor, date, time, and reason are required'
            });
        }

        // Get patient and doctor info
        const patient = await Patient.findById(req.user.userId);
        const Doctor = require('../middleware/model/Doctor.model');
        const doctor = await Doctor.findById(doctorId);

        if (!doctor) {
            return res.status(404).json({
                success: false,
                message: 'Doctor not found'
            });
        }

        // Create appointment
        const appointment = new Appointment({
            patientId: req.user.userId,
            doctorId,
            patientName: patient.fullName,
            doctorName: doctor.fullName,
            appointmentDate,
            appointmentTime,
            reason,
            notes: notes || ''
        });

        await appointment.save();

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment
        });
    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({
            success: false,
            message: 'Error booking appointment'
        });
    }
});

/**
 * PUT /api/patients/profile
 * Update patient profile
 */
router.put('/profile', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const { fullName, email } = req.body;
        
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email.toLowerCase();

        const patient = await Patient.findByIdAndUpdate(
            req.user.userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            patient
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
