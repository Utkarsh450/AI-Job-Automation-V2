const { google } = require('googleapis');
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * Initializes a Gmail API client for a specific user using their stored refresh token.
 * @param {string} userId
 * @returns {object|null} Gmail client or null if tokens missing
 */
const getGmailClient = async (userId) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { googleRefreshToken: true, googleAccessToken: true }
    });

    if (!user || !user.googleRefreshToken) {
        logger.warn(`No Google Refresh Token found for user ${userId}`);
        return null;
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8000/api/auth/google/callback'
    );

    oauth2Client.setCredentials({
        refresh_token: user.googleRefreshToken,
        access_token: user.googleAccessToken
    });

    return google.gmail({ version: 'v1', auth: oauth2Client });
};

/**
 * Searches the user's inbox for the newest email from Greenhouse in the last 10 minutes,
 * extracts the 6-digit OTP, and returns it.
 * @param {string} userId
 * @returns {string|null} The 6-digit OTP or null if not found
 */
const fetchGreenhouseOtp = async (userId) => {
    try {
        const gmail = await getGmailClient(userId);
        if (!gmail) return null;

        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'newer_than:10m (greenhouse OR verification)',
            maxResults: 5
        });

        const messages = res.data.messages;
        if (!messages || messages.length === 0) {
            logger.info('No OTP emails found with query.');
            return null;
        }

        logger.info(`Found ${messages.length} potential OTP emails.`);

        for (const msg of messages) {
            const email = await gmail.users.messages.get({
                userId: 'me',
                id: msg.id,
                format: 'full'
            });

            let bodyData = '';
            const payload = email.data.payload;

            // Extract Subject for logging
            const subjectHeader = payload.headers?.find(h => h.name.toLowerCase() === 'subject');
            const subject = subjectHeader ? subjectHeader.value : 'No Subject';
            logger.info(`Checking email with subject: "${subject}"`);

            if (payload.parts) {
                for (const part of payload.parts) {
                    if (part.mimeType === 'text/plain' && part.body && part.body.data) {
                        bodyData = Buffer.from(part.body.data, 'base64').toString('utf8');
                        break;
                    } else if (part.mimeType === 'text/html' && part.body && part.body.data) {
                        bodyData = Buffer.from(part.body.data, 'base64').toString('utf8');
                    }
                }
            } else if (payload.body && payload.body.data) {
                bodyData = Buffer.from(payload.body.data, 'base64').toString('utf8');
            }

            // Strip basic HTML tags before regex matching
            const plainText = bodyData.replace(/<[^>]+>/g, ' ');

            const match = plainText.match(/\b\d{6}\b/);
            if (match) {
                logger.info(`Extracted OTP: ${match[0]}`);
                return match[0];
            } else {
                logger.warn(`No 6-digit code found in email body. Body preview: ${plainText.substring(0, 100).replace(/\n/g, ' ')}...`);
            }
        }

        return null;
    } catch (err) {
        logger.error(`Error fetching OTP from Gmail: ${err.message}`);
        return null;
    }
};

module.exports = {
    fetchGreenhouseOtp
};
