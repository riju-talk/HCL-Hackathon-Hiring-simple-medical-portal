const express = require('express');
const router = express.Router();
const User = require('../models/User.model');
const PatientProfile = require('../models/PatientProfile.model');
const { generateToken } = require('../middleware/jwt.utils');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * POST /auth/register
 */
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, role, specialization, licenseNumber, phoneNumber } = req.body;

        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: fullName, email, password, role'
            });
        }

        if (!['patient', 'doctor'].includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either "patient" or "doctor"'
            });
        }

        const normalizedRole = role.toLowerCase();
        const existingUser = await User.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const userData = {
            fullName,
            email: email.toLowerCase(),
            password,
            role: normalizedRole,
            phoneNumber
        };

        if (normalizedRole === 'doctor') {
            if (specialization) userData.specialization = specialization;
            if (licenseNumber) userData.licenseNumber = licenseNumber;
        }

        const newUser = new User(userData);
        await newUser.save();

        if (normalizedRole === 'patient') {
            const patientProfile = new PatientProfile({ userId: newUser._id });
            await patientProfile.save();
        }

        const token = generateToken({
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            userId: newUser._id.toString()
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: { id: newUser._id, fullName: newUser.fullName, email: newUser.email, role: newUser.role }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error registering user' });
    }
});

/**
 * POST /auth/login
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        // Find user and explicitly select password field (not excluded by default in queries)
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user || !user.isActive) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Compare the provided password with the hashed password
        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Role validation: 
        // - Patients cannot login as doctors
        // - Doctors cannot login as patients (must register separately)
        if (role) {
            const requestedRole = role === 'provider' ? 'doctor' : role;
            
            // If user is a patient trying to login as doctor, deny access
            if (user.role === 'patient' && requestedRole === 'doctor') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Access denied. You do not have provider privileges.' 
                });
            }
            
            // If user is a doctor trying to login as patient, deny access
            if (user.role === 'doctor' && requestedRole === 'patient') {
                return res.status(403).json({ 
                    success: false, 
                    message: 'You are registered as a healthcare provider. Please register as a patient first to access patient features.' 
                });
            }
        }

        const token = generateToken({
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            userId: user._id.toString()
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            user: { 
                id: user._id, 
                fullName: user.fullName, 
                email: user.email, 
                role: user.role 
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'An error occurred during login. Please try again.' 
        });
    }
});

/**
 * POST /auth/logout
 */
router.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    });
    res.status(200).json({ success: true, message: 'Logout successful' });
});

/**
 * GET /auth/me
 */
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user: {
                userId: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phoneNumber: user.phoneNumber,
                address: user.address,
                specialization: user.specialization
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Error fetching user information' });
    }
});

module.exports = router;
