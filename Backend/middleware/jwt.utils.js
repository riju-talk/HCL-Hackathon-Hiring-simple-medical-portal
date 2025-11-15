const jwt = require('jsonwebtoken');

const generateToken = (payload) => {
    const { fullName, email, role, userId } = payload;
    
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(
        {
            fullName,
            email,
            role,
            userId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: '7d' // Token expires in 7 days
        }
    );
};

const verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error('Token has expired');
        } else if (error.name === 'JsonWebTokenError') {
            throw new Error('Invalid token');
        }
        throw error;
    }
};

module.exports = {
    generateToken,
    verifyToken
};
