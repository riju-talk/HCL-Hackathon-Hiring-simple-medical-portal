const express = require('express');
const router = express.Router();
const Patient = require('../middleware/model/Patient.model');
const Doctor = require('../middleware/model/Doctor.model');
const { generateToken } = require('../middleware/jwt.utils');
const { authMiddleware } = require('../middleware/auth.middleware');

/**
 * POST /auth/register
 * Register a new user (Patient or Doctor)
 * Body: { fullName, email, password, role }
 */
router.post('/register', async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Validate required fields
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required: fullName, email, password, role'
            });
        }

        // Validate role
        if (!['patient', 'doctor'].includes(role.toLowerCase())) {
            return res.status(400).json({
                success: false,
                message: 'Role must be either "patient" or "doctor"'
            });
        }

        const normalizedRole = role.toLowerCase();

        // Check if user already exists
        const Model = normalizedRole === 'patient' ? Patient : Doctor;
        const existingUser = await Model.findOne({ email: email.toLowerCase() });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create new user
        const newUser = new Model({
            fullName,
            email: email.toLowerCase(),
            password,
            role: normalizedRole
        });

        await newUser.save();

        // Generate JWT token
        const token = generateToken({
            fullName: newUser.fullName,
            email: newUser.email,
            role: newUser.role,
            userId: newUser._id.toString()
        });

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Use HTTPS in production
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error registering user'
        });
    }
});

/**
 * POST /auth/login
 * Login user with email and password
 * Body: { email, password }
 */
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate required fields
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Try to find user in both Patient and Doctor collections
        let user = await Patient.findOne({ email: email.toLowerCase() });
        let role = 'patient';

        if (!user) {
            user = await Doctor.findOne({ email: email.toLowerCase() });
            role = 'doctor';
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Verify password
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Generate JWT token
        const token = generateToken({
            fullName: user.fullName,
            email: user.email,
            role: user.role,
            userId: user._id.toString()
        });

        // Set HTTP-only cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
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
            message: error.message || 'Error logging in'
        });
    }
});

/**
 * POST /auth/logout
 * Logout user by clearing the token cookie
 */
router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

/**
 * GET /auth/me
 * Get current user information (requires authentication)
 */
router.get('/me', authMiddleware, (req, res) => {
    res.status(200).json({
        success: true,
        user: req.user
    });
});

module.exports = router;
