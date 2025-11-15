const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const Appointment = require('../models/Appointment.model');
const PatientProfile = require('../models/PatientProfile.model');
const PatientGoal = require('../models/PatientGoal.model');
const { authMiddleware, authorizeRoles } = require('../middleware/auth.middleware');

/**
 * GET /api/patients - Get all patients
 */
router.get('/', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const patients = await User.find({ role: 'patient', isActive: true })
            .select('-password')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, count: patients.length, patients });
    } catch (error) {
        console.error('Error fetching patients:', error);
        res.status(500).json({ success: false, message: 'Error fetching patients' });
    }
});

/**
 * GET /api/patients/:id - Get patient by ID
 */
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const patient = await User.findOne({ _id: req.params.id, role: 'patient' }).select('-password');

        if (!patient) {
            return res.status(404).json({ success: false, message: 'Patient not found' });
        }

        // Get patient profile if exists
        const profile = await PatientProfile.findOne({ userId: req.params.id });

        res.status(200).json({ success: true, patient, profile });
    } catch (error) {
        console.error('Error fetching patient:', error);
        res.status(500).json({ success: false, message: 'Error fetching patient details' });
    }
});

/**
 * GET /api/patients/:id/appointments - Get patient's appointments
 */
router.get('/:id/appointments', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        if (req.user.userId !== req.params.id) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const appointments = await Appointment.find({ patientId: req.params.id })
            .populate('doctorId', 'fullName email specialization phoneNumber')
            .sort({ appointmentDateTime: -1 });

        res.status(200).json({ success: true, count: appointments.length, appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Error fetching appointments' });
    }
});

/**
 * GET /api/patients/appointments/me - Get current patient's appointments (from JWT)
 */
router.get('/appointments/me', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const appointments = await Appointment.find({ patientId: req.user.userId })
            .populate('doctorId', 'fullName email specialization phoneNumber')
            .sort({ appointmentDateTime: -1 });

        res.status(200).json({ success: true, count: appointments.length, appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Error fetching appointments' });
    }
});

/**
 * POST /api/patients/appointments - Book new appointment with race condition protection
 */
router.post('/appointments', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const { doctorId, appointmentDate, appointmentTime, reasonForVisit } = req.body;

        if (!doctorId || !appointmentDate || !appointmentTime || !reasonForVisit) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: doctorId, appointmentDate, appointmentTime, reasonForVisit'
            });
        }

        // Verify doctor exists and is active
        const doctor = await User.findOne({ _id: doctorId, role: 'doctor', isActive: true });
        if (!doctor) {
            return res.status(404).json({ success: false, message: 'Doctor not found or inactive' });
        }

        // Compute appointmentDateTime for conflict checking
        const dateStr = new Date(appointmentDate).toISOString().split('T')[0];
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        const appointmentDateTime = new Date(appointmentDate);
        appointmentDateTime.setHours(hours, minutes, 0, 0);

        const appointmentData = {
            patientId: req.user.userId,
            doctorId,
            appointmentDate,
            appointmentTime,
            appointmentDateTime,
            reason: reasonForVisit,
            status: 'pending',
            duration: 30
        };

        const appointment = await Appointment.bookWithLock(appointmentData);

        res.status(201).json({
            success: true,
            message: 'Appointment booked successfully',
            appointment
        });
    } catch (error) {
        console.error('Error booking appointment:', error);
        
        if (error.message === 'Time slot is no longer available') {
            return res.status(409).json({ success: false, message: error.message });
        }

        res.status(500).json({ success: false, message: 'Error booking appointment' });
    }
});


router.put('/profile', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const { fullName, email, phoneNumber, address, dateOfBirth } = req.body;
        
        // Update User model
        const updateData = {};
        if (fullName) updateData.fullName = fullName;
        if (email) updateData.email = email.toLowerCase();
        if (phoneNumber) updateData.phoneNumber = phoneNumber;
        if (address) updateData.address = address;
        if (dateOfBirth) updateData.dateOfBirth = dateOfBirth;

        const patient = await User.findByIdAndUpdate(
            req.user.userId,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        // Update PatientProfile if additional fields provided
        const {
            bloodType,
            allergies,
            currentMedications,
            medicalHistory,
            emergencyContact,
            insuranceInfo,
            wellnessGoals,
            preventiveCare
        } = req.body;

        const profileUpdateData = {};
        if (bloodType) profileUpdateData.bloodType = bloodType;
        if (allergies) profileUpdateData.allergies = allergies;
        if (currentMedications) profileUpdateData.currentMedications = currentMedications;
        if (medicalHistory) profileUpdateData.medicalHistory = medicalHistory;
        if (emergencyContact) profileUpdateData.emergencyContact = emergencyContact;
        if (insuranceInfo) profileUpdateData.insuranceInfo = insuranceInfo;
        if (wellnessGoals) profileUpdateData.wellnessGoals = wellnessGoals;
        if (preventiveCare) profileUpdateData.preventiveCare = preventiveCare;

        let profile = null;
        if (Object.keys(profileUpdateData).length > 0) {
            profile = await PatientProfile.findOneAndUpdate(
                { userId: req.user.userId },
                profileUpdateData,
                { new: true, runValidators: true, upsert: true }
            );
        }

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            patient,
            profile
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

/**
 * DELETE /api/patients/appointments/:appointmentId - Cancel appointment
 */
router.delete('/appointments/:appointmentId', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.appointmentId);

        if (!appointment) {
            return res.status(404).json({ success: false, message: 'Appointment not found' });
        }

        if (appointment.patientId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({ success: true, message: 'Appointment cancelled successfully', appointment });
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        res.status(500).json({ success: false, message: 'Error cancelling appointment' });
    }
});


router.post('/goals', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const { title, description, targetDate, category, targetValue, unit, frequency, reminderTime, notes } = req.body;

        if (!title || !targetDate) {
            return res.status(400).json({ success: false, message: 'Title and target date are required' });
        }

        const goal = new PatientGoal({
            patientId: req.user.userId,
            title,
            description,
            targetDate,
            category: category || 'other',
            targetValue,
            unit: unit || 'count',
            frequency: frequency || 'once',
            reminderTime,
            notes
        });

        await goal.save();

        res.status(201).json({ success: true, message: 'Goal created successfully', goal });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ success: false, message: 'Error creating goal' });
    }
});


router.get('/goals/all', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const goals = await PatientGoal.find({ patientId: req.user.userId })
            .sort({ targetDate: -1, createdAt: -1 });

        res.status(200).json({ success: true, count: goals.length, goals });
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ success: false, message: 'Error fetching goals' });
    }
});


router.get('/goals/today', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const goals = await PatientGoal.getTodaysGoals(req.user.userId);

        res.status(200).json({ success: true, count: goals.length, goals });
    } catch (error) {
        console.error('Error fetching today\'s goals:', error);
        res.status(500).json({ success: false, message: 'Error fetching today\'s goals' });
    }
});

router.put('/goals/:goalId', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const goal = await PatientGoal.findById(req.params.goalId);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.patientId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        const { title, description, targetDate, category, targetValue, currentValue, unit, frequency, reminderTime, notes } = req.body;

        if (title) goal.title = title;
        if (description !== undefined) goal.description = description;
        if (targetDate) goal.targetDate = targetDate;
        if (category) goal.category = category;
        if (targetValue !== undefined) goal.targetValue = targetValue;
        if (currentValue !== undefined) {
            await goal.updateProgress(currentValue);
            return res.status(200).json({ success: true, message: 'Goal progress updated', goal });
        }
        if (unit) goal.unit = unit;
        if (frequency) goal.frequency = frequency;
        if (reminderTime !== undefined) goal.reminderTime = reminderTime;
        if (notes !== undefined) goal.notes = notes;

        await goal.save();

        res.status(200).json({ success: true, message: 'Goal updated successfully', goal });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ success: false, message: 'Error updating goal' });
    }
});


router.put('/goals/:goalId/complete', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const goal = await PatientGoal.findById(req.params.goalId);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.patientId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await goal.complete();

        res.status(200).json({ success: true, message: 'Goal marked as completed', goal });
    } catch (error) {
        console.error('Error completing goal:', error);
        res.status(500).json({ success: false, message: 'Error completing goal' });
    }
});

router.delete('/goals/:goalId', authMiddleware, authorizeRoles('patient'), async (req, res) => {
    try {
        const goal = await PatientGoal.findById(req.params.goalId);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.patientId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await PatientGoal.findByIdAndDelete(req.params.goalId);

        res.status(200).json({ success: true, message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ success: false, message: 'Error deleting goal' });
    }
});

module.exports = router;
