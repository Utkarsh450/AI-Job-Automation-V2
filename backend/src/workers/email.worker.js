const inngest = require('../config/inngest');
const { Resend } = require('resend');
const logger = require('../utils/logger');

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');
logger.info('Resend Email SDK configured successfully');

const sendWelcomeEmail = inngest.createFunction(
    { 
        id: "send-welcome-email", 
        name: "Send Welcome Email",
        triggers: [{ event: "app/user.registered" }]
    },
    async ({ event, step }) => {
        const { email } = event.data;

        await step.run("send-email", async () => {
            if (!process.env.RESEND_API_KEY) {
                logger.info(`[SIMULATION] Sending welcome email to ${email}`);
                return;
            }

            try {
                await resend.emails.send({
                    from: 'Tsenta <onboarding@resend.dev>', // Use a verified domain or resend.dev for testing
                    to: email,
                    subject: 'Welcome to Tsenta! 🚀',
                    html: `
                        <h2>Welcome to Tsenta!</h2>
                        <p>We are thrilled to have you on board.</p>
                        <p>Upload your resume to start getting matched with the best jobs instantly using our AI pipeline.</p>
                        <br/>
                        <p>Best,</p>
                        <p>The Tsenta Team</p>
                    `
                });
                logger.info(`Welcome email sent to ${email}`);
            } catch (err) {
                logger.error(`Failed to send welcome email to ${email}: ${err.message}`);
                throw err;
            }
        });
        
        return { message: "Welcome email processed" };
    }
);

const sendMatchAlertEmail = inngest.createFunction(
    { 
        id: "send-match-alert-email", 
        name: "Send Match Alert Email",
        triggers: [{ event: "app/matches.found" }]
    },
    async ({ event, step }) => {
        const { email, count } = event.data;

        await step.run("send-email", async () => {
            if (!process.env.RESEND_API_KEY) {
                logger.info(`[SIMULATION] Sending match alert email to ${email} for ${count} high-score jobs`);
                return;
            }

            try {
                await resend.emails.send({
                    from: 'Tsenta <matches@resend.dev>',
                    to: email,
                    subject: `🔥 You have ${count} new high-score matches!`,
                    html: `
                        <h2>Great news!</h2>
                        <p>Our AI pipeline just finished analyzing your resume and found <strong>${count}</strong> new roles with a fit score of 80 or higher!</p>
                        <p>Check your dashboard right now to see the gap analysis and automatically apply.</p>
                        <br/>
                        <a href="http://localhost:3000/dashboard" style="padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px;">View Matches</a>
                    `
                });
                logger.info(`Match alert email sent to ${email}`);
            } catch (err) {
                logger.error(`Failed to send match alert email to ${email}: ${err.message}`);
                throw err;
            }
        });
        
        return { message: "Match alert email processed" };
    }
);

module.exports = {
    sendWelcomeEmail,
    sendMatchAlertEmail
};
