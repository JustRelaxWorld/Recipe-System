const jwt = require('jsonwebtoken');
const JWT_SECRET = 'your_jwt_secret'; // Use your existing JWT secret

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('Token:', token);
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }

        req.user = user; // Attach the user payload to the request object
        next(); // Continue to the next middleware or route handler
    });
}

module.exports = authenticateToken;
