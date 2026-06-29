const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const prisma = require('../config/db');
const { verifyFirebaseToken } = require('../middlewares/authMiddleware'); 
const logger = require('../utils/logger');

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/auth/google/callback'
);

/**
 * Initiates the Google OAuth flow.
 */
router.get('/connect', verifyFirebaseToken, (req, res) => {
    // Generate an authorization URL
    const url = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Gets refresh token
        scope: ['https://www.googleapis.com/auth/gmail.readonly'],
        prompt: 'consent', // Force consent screen to guarantee refresh token
        state: req.firebaseUser.uid // Pass the user ID in state to link the account later
    });

    // Redirect the user to Google's consent screen
    res.redirect(url);
});

/**
 * Handles the OAuth callback.
 */
router.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) {
        logger.error(`Google Auth Error: ${error}`);
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings?error=google_auth_failed`);
    }

    try {
        const { tokens } = await oauth2Client.getToken(code);
        
        const firebaseUid = state; // We passed this in /connect
        
        // Find user by firebaseUid
        const user = await prisma.user.findUnique({
            where: { firebaseUid }
        });

        if (!user) {
            return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings?error=user_not_found`);
        }

        // Save tokens
        await prisma.user.update({
            where: { id: user.id },
            data: {
                googleAccessToken: tokens.access_token,
                ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }) // Only update if provided
            }
        });

        logger.info(`Successfully linked Gmail for user ${user.id}`);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings?success=gmail_connected`);

    } catch (err) {
        logger.error(`Error exchanging Google tokens: ${err.message}`);
        res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/settings?error=token_exchange_failed`);
    }
});

module.exports = router;
