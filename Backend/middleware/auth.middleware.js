const { verifyToken } = require('./jwt.utils');

/**
 * Middleware to authenticate requests using JWT from HTTP-only cookies
 * Verifies the token and attaches user information to the request object
 */
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from HTTP-only cookie
        const token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required. No token provided.'
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Attach user information to request object
        req.user = {
            userId: decoded.userId,
            fullName: decoded.fullName,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: error.message || 'Invalid or expired token'
        });
    }
};

/**
 * Middleware to check if user has specific role
 * @param {string[]} roles - Array of allowed roles
 */
const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Access denied. Required role: ${roles.join(' or ')}`
            });
        }

        next();
    };
};

module.exports = {
    authMiddleware,
    authorizeRoles
};
