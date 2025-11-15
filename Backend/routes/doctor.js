const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const Appointment = require('../models/Appointment.model');
const DoctorAvailability = require('../models/DoctorAvailability.model');
const Goal = require('../models/Goal.model');
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
 * GET /api/doctors/appointments/me - Get current doctor's appointments (from JWT)
 */
router.get('/appointments/me', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.user.userId })
            .populate('patientId', 'fullName email phoneNumber')
            .sort({ appointmentDateTime: -1 });

        res.status(200).json({ success: true, count: appointments.length, appointments });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: 'Error fetching appointments' });
    }
});

/**
 * GET /api/doctors/patients/me - Get current doctor's patients (from JWT)
 */
router.get('/patients/me', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const appointments = await Appointment.find({ doctorId: req.user.userId })
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

/**
 * GET /api/doctors/:id/availability - Get doctor's availability
 */
router.get('/:id/availability', async (req, res) => {
    try {
        let availability = await DoctorAvailability.findOne({ doctorId: req.params.id });
        
        if (!availability) {
            availability = { doctorId: req.params.id, slots: [] };
        }

        res.status(200).json({ success: true, availability });
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ success: false, message: 'Error fetching availability' });
    }
});

/**
 * GET /api/doctors/availability/me - Get current doctor's availability (from JWT)
 */
router.get('/availability/me', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        let availability = await DoctorAvailability.findOne({ doctorId: req.user.userId });
        
        if (!availability) {
            availability = { doctorId: req.user.userId, slots: [] };
        }

        res.status(200).json({ success: true, availability });
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ success: false, message: 'Error fetching availability' });
    }
});

/**
 * POST /api/doctors/availability - Set doctor's availability
 */
router.post('/availability', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { slots } = req.body;

        if (!slots || !Array.isArray(slots)) {
            return res.status(400).json({ success: false, message: 'Slots array is required' });
        }

        let availability = await DoctorAvailability.findOne({ doctorId: req.user.userId });

        if (availability) {
            availability.slots = slots;
            await availability.save();
        } else {
            availability = new DoctorAvailability({
                doctorId: req.user.userId,
                slots
            });
            await availability.save();
        }

        res.status(200).json({ success: true, message: 'Availability updated successfully', availability });
    } catch (error) {
        console.error('Error updating availability:', error);
        res.status(500).json({ success: false, message: 'Error updating availability' });
    }
});

/**
 * GET /api/doctors/:id/available-slots - Get available time slots for a specific date
 */
router.get('/:id/available-slots', async (req, res) => {
    try {
        const { date } = req.query; // Expected format: YYYY-MM-DD

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        const requestedDate = new Date(date);
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][requestedDate.getDay()];

        // Get doctor's availability for that day
        const availability = await DoctorAvailability.findOne({ doctorId: req.params.id });

        if (!availability) {
            return res.status(200).json({ success: true, slots: [] });
        }

        const daySlots = availability.slots.filter(slot => 
            slot.dayOfWeek === dayOfWeek && slot.isActive
        );

        // Generate all 30-minute time slots for each availability window
        const allTimeSlots = [];
        daySlots.forEach(slot => {
            const slots = DoctorAvailability.generateTimeSlots(slot.startTime, slot.endTime);
            allTimeSlots.push(...slots);
        });

        // Get existing appointments for that date
        const startOfDay = new Date(requestedDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(requestedDate);
        endOfDay.setHours(23, 59, 59, 999);

        const bookedAppointments = await Appointment.find({
            doctorId: req.params.id,
            appointmentDateTime: { $gte: startOfDay, $lte: endOfDay },
            status: { $nin: ['cancelled', 'no-show'] }
        });

        const bookedTimes = bookedAppointments.map(apt => apt.appointmentTime);

        // Filter out booked slots
        const availableSlots = allTimeSlots.filter(time => !bookedTimes.includes(time));

        res.status(200).json({ success: true, slots: availableSlots, bookedSlots: bookedTimes });
    } catch (error) {
        console.error('Error fetching available slots:', error);
        res.status(500).json({ success: false, message: 'Error fetching available slots' });
    }
});

/**
 * POST /api/doctors/goals - Create a new goal
 */
router.post('/goals', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { title, description, targetDate, category, targetValue, unit } = req.body;

        if (!title || !targetDate) {
            return res.status(400).json({ success: false, message: 'Title and target date are required' });
        }

        const goal = new Goal({
            doctorId: req.user.userId,
            title,
            description,
            targetDate: new Date(targetDate),
            category,
            targetValue,
            unit
        });

        await goal.save();

        res.status(201).json({ success: true, message: 'Goal created successfully', goal });
    } catch (error) {
        console.error('Error creating goal:', error);
        res.status(500).json({ success: false, message: 'Error creating goal' });
    }
});

/**
 * GET /api/doctors/goals - Get all goals for the doctor
 */
router.get('/goals/all', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const goals = await Goal.find({ doctorId: req.user.userId })
            .sort({ targetDate: -1, createdAt: -1 });

        res.status(200).json({ success: true, count: goals.length, goals });
    } catch (error) {
        console.error('Error fetching goals:', error);
        res.status(500).json({ success: false, message: 'Error fetching goals' });
    }
});

/**
 * GET /api/doctors/goals/today - Get today's goals
 */
router.get('/goals/today', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const goals = await Goal.getTodaysGoals(req.user.userId);

        res.status(200).json({ success: true, count: goals.length, goals });
    } catch (error) {
        console.error('Error fetching today\'s goals:', error);
        res.status(500).json({ success: false, message: 'Error fetching today\'s goals' });
    }
});

/**
 * PUT /api/doctors/goals/:goalId - Update a goal
 */
router.put('/goals/:goalId', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const { title, description, currentValue, status, notes } = req.body;

        const goal = await Goal.findById(req.params.goalId);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.doctorId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        if (title) goal.title = title;
        if (description !== undefined) goal.description = description;
        if (status) goal.status = status;
        if (notes !== undefined) goal.notes = notes;
        
        if (currentValue !== undefined) {
            await goal.updateProgress(currentValue);
        } else {
            await goal.save();
        }

        res.status(200).json({ success: true, message: 'Goal updated successfully', goal });
    } catch (error) {
        console.error('Error updating goal:', error);
        res.status(500).json({ success: false, message: 'Error updating goal' });
    }
});

/**
 * PUT /api/doctors/goals/:goalId/complete - Mark goal as completed
 */
router.put('/goals/:goalId/complete', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.doctorId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await goal.complete();

        res.status(200).json({ success: true, message: 'Goal marked as completed', goal });
    } catch (error) {
        console.error('Error completing goal:', error);
        res.status(500).json({ success: false, message: 'Error completing goal' });
    }
});

/**
 * DELETE /api/doctors/goals/:goalId - Delete a goal
 */
router.delete('/goals/:goalId', authMiddleware, authorizeRoles('doctor'), async (req, res) => {
    try {
        const goal = await Goal.findById(req.params.goalId);

        if (!goal) {
            return res.status(404).json({ success: false, message: 'Goal not found' });
        }

        if (goal.doctorId.toString() !== req.user.userId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        await Goal.findByIdAndDelete(req.params.goalId);

        res.status(200).json({ success: true, message: 'Goal deleted successfully' });
    } catch (error) {
        console.error('Error deleting goal:', error);
        res.status(500).json({ success: false, message: 'Error deleting goal' });
    }
});

module.exports = router;
