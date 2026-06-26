const prisma = require('../config/db');
const logger = require('../utils/logger');
const inngest = require('../config/inngest');

// POST /api/auth/register
const registerUser = async (req, res) => {
    try {
        const { uid, email } = req.firebaseUser;
        
        let user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
        if (user) {
            return res.status(400).json({ error: "User already registered" });
        }
        
        // Check if email already exists but with a different/missing UID
        const existingEmail = await prisma.user.findUnique({ where: { email } });
        
        if (existingEmail) {
            // Link the new Firebase UID to the existing database user
            user = await prisma.user.update({
                where: { email },
                data: { firebaseUid: uid }
            });
            logger.info(`Linked existing user email ${email} to new Firebase UID`);
        } else {
            // Create brand new user
            user = await prisma.user.create({
                data: { email, firebaseUid: uid }
            });
            
            // Trigger welcome email — non-fatal: if Inngest is down, user still registers
            try {
                await inngest.send({
                    name: 'app/user.registered',
                    data: { email }
                });
            } catch (inngestErr) {
                logger.warn(`Welcome email event failed (non-fatal): ${inngestErr.message}`);
            }
        }
        
        logger.info(`User registered/linked: ${email}`);
        res.status(201).json({ message: "Registered successfully", user });
    } catch (err) {
        logger.error(`Register error: ${err.message}`);
        res.status(500).json({ error: "Failed to register user" });
    }
};

// POST /api/auth/login
const loginUser = async (req, res) => {
    try {
        const { uid } = req.firebaseUser;
        
        const user = await prisma.user.findUnique({ where: { firebaseUid: uid } });
        if (!user) {
            return res.status(404).json({ error: "User not found in DB" });
        }
        
        logger.info(`User logged in: ${user.email}`);
        res.status(200).json({ message: "Logged in successfully", user });
    } catch (err) {
        logger.error(`Login error: ${err.message}`);
        res.status(500).json({ error: "Failed to login user" });
    }
};

module.exports = { registerUser, loginUser };
