const { auth } = require('../config/firebase');
const prisma = require('../config/db');

// 1. Just verifies the Firebase JWT token and attaches the decoded payload
const verifyFirebaseToken = async (req, res, next) => {
    try {
        let token;
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else if (req.query.token) {
            token = req.query.token;
        }

        if (!token) {
            return res.status(401).json({ error: 'Unauthorized: No token provided' });
        }

        const decodedToken = await auth.verifyIdToken(token);
        
        req.firebaseUser = decodedToken; // Attach just the firebase payload
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Unauthorized: Invalid token', details: error.message });
    }
};

// 2. Verifies token AND fetches the user from Postgres (used for protected app routes)
const requireDbUser = async (req, res, next) => {
    try {
        await verifyFirebaseToken(req, res, async () => {
            const user = await prisma.user.findUnique({
                where: { firebaseUid: req.firebaseUser.uid }
            });
            
            if (!user) {
                return res.status(404).json({ error: 'User not found in database. Please register.' });
            }
            
            req.user = user;
            next();
        });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

module.exports = { verifyFirebaseToken, requireDbUser };
