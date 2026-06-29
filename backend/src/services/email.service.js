const { Resend } = require('resend');
const logger = require('../utils/logger');
const prisma = require('../config/db');

/** Lazy singleton — only instantiated when first email is sent */
let resendClient = null;

const getResendClient = () => {
    if (!resendClient) {
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
};

/**
 * Sends a welcome email to a newly registered user.
 * Simulates if RESEND_API_KEY is not set.
 */
const sendWelcomeEmail = async (email) => {
    if (!process.env.RESEND_API_KEY) {
        logger.info(`[SIMULATION] Welcome email → ${email}`);
        return;
    }
    const html = `
            <h2>Welcome to Tsenta!</h2>
            <p>We are thrilled to have you on board.</p>
            <p>Upload your resume to start getting matched with the best jobs instantly using our AI pipeline.</p>
            <br/>
            <p>Best,</p>
            <p>The Tsenta Team</p>
        `;

    const subject = 'Welcome to Tsenta! 🚀';

    await getResendClient().emails.send({
        from: 'Tsenta <onboarding@resend.dev>',
        to: email,
        subject,
        html
    });

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        await prisma.email.create({
            data: {
                userId: user.id,
                fromName: 'Tsenta Onboarding',
                fromEmail: 'onboarding@resend.dev',
                subject,
                bodyHtml: html,
                bodyText: 'Welcome to Tsenta! We are thrilled to have you on board. Upload your resume to start getting matched with the best jobs instantly using our AI pipeline. Best, The Tsenta Team',
                isRead: false
            }
        });
    }

    logger.info(`Welcome email sent to ${email} and saved to inbox.`);
};

/**
 * Sends a match alert email when high-scoring jobs are found.
 * Simulates if RESEND_API_KEY is not set.
 */
const sendMatchAlertEmail = async (email, count) => {
    if (!process.env.RESEND_API_KEY) {
        logger.info(`[SIMULATION] Match alert email → ${email} (${count} high-score matches)`);
        return;
    }
    const html = `
            <h2>Great news!</h2>
            <p>Our AI pipeline just finished analyzing your resume and found <strong>${count}</strong> new roles with a fit score of 80 or higher!</p>
            <p>Check your dashboard right now to see the gap analysis and automatically apply.</p>
            <br/>
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard"
               style="padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">
               View Matches
            </a>
        `;

    const subject = `🔥 You have ${count} new high-score matches!`;

    await getResendClient().emails.send({
        from: 'Tsenta <matches@resend.dev>',
        to: email,
        subject,
        html
    });

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        await prisma.email.create({
            data: {
                userId: user.id,
                fromName: 'Tsenta AI Matches',
                fromEmail: 'matches@resend.dev',
                subject,
                bodyHtml: html,
                bodyText: `Great news! Our AI pipeline just finished analyzing your resume and found ${count} new roles with a fit score of 80 or higher! Check your dashboard right now.`,
                isRead: false
            }
        });
    }

    logger.info(`Match alert email sent to ${email} and saved to inbox.`);
};

module.exports = {
    sendWelcomeEmail,
    sendMatchAlertEmail
};
