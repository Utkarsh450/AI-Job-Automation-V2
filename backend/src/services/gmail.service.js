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
        console.log("gmail", gmail);
        
        if (!gmail) return null;

        const res = await gmail.users.messages.list({
            userId: 'me',
            q: 'newer_than:10m (greenhouse OR verification)',
            maxResults: 10
        });
        console.log("response", res);
        

        const messages = res.data.messages;
        console.log("messages", messages);
        
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

            const payload = email.data.payload;

            // Extract Subject for logging
            const subjectHeader = payload.headers?.find(h => h.name.toLowerCase() === 'subject');
            const subject = subjectHeader ? subjectHeader.value : 'No Subject';
            logger.info(`Checking email with subject: "${subject}"`);

            const extractBody = (part) => {
                if (part.mimeType === 'text/plain' && part.body && part.body.data) {
                    return Buffer.from(part.body.data, 'base64url').toString('utf8');
                }
                if (part.mimeType === 'text/html' && part.body && part.body.data) {
                    return Buffer.from(part.body.data, 'base64url').toString('utf8');
                }
                if (part.parts) {
                    for (const subPart of part.parts) {
                        const body = extractBody(subPart);
                        if (body) return body;
                    }
                }
                if (part.body && part.body.data) {
                    return Buffer.from(part.body.data, 'base64url').toString('utf8');
                }
                return '';
            };

            const bodyData = extractBody(payload);

            // Strip basic HTML tags before regex matching
            const plainText = bodyData.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
            console.log("plaintext", plainText.substring(0, 500));
            
            // Greenhouse codes can be 6-digit numbers OR alphanumeric codes (like UF8X9Z or ZbxD6nKS)
            // Strategy 1: Match directly after known phrases
            const contextMatch = plainText.match(/(?:application:|code is:?|code:)\s*([A-Za-z0-9]{6,10})\b/i);
            if (contextMatch) {
                logger.info(`Extracted OTP (Context Match): ${contextMatch[1]}`);
                return contextMatch[1];
            }

            // Strategy 2: 6 to 8 digits
            const match = plainText.match(/\b\d{6,8}\b/);
            if (match) {
                logger.info(`Extracted OTP (Digit Match): ${match[0]}`);
                return match[0];
            }
            
            // Strategy 3: 6 to 8 character alphanumeric word
            const alphaNumMatch = plainText.match(/\b[A-Za-z0-9]{6,8}\b/);
            if (alphaNumMatch && /[A-Z]/i.test(alphaNumMatch[0]) && /[0-9]/.test(alphaNumMatch[0])) {
                logger.info(`Extracted OTP (AlphaNum Match): ${alphaNumMatch[0]}`);
                return alphaNumMatch[0];
            }

            logger.warn(`No valid code found in email body. Body preview: ${plainText.substring(0, 150)}...`);
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
