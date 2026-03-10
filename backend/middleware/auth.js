const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized, no token' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const defaultSecret = 'my_super_secret_access_token_key_123';
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET || defaultSecret);
        req.user = decoded; // { userId, role }
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Unauthorized, invalid token' });
    }
};

const requireRole = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden, insufficient permissions' });
        }
        next();
    };
};

module.exports = { requireAuth, requireRole };
