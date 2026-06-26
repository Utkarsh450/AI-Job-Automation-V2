const inngest = require('../config/inngest');
const logger = require('../utils/logger');
const emailService = require('../services/email.service');

/**
 * Inngest worker: send-welcome-email
 * Triggered when a new user registers. Delegates to email.service.js.
 */
const sendWelcomeEmail = inngest.createFunction(
    {
        id: 'send-welcome-email',
        name: 'Send Welcome Email',
        triggers: [{ event: 'app/user.registered' }]
    },
    async ({ event, step }) => {
        const { email } = event.data;
        await step.run('Send Welcome Email', async () => {
            await emailService.sendWelcomeEmail(email);
        });
        return { message: 'Welcome email processed' };
    }
);

/**
 * Inngest worker: send-match-alert-email
 * Triggered when high-scoring job matches are found. Delegates to email.service.js.
 */
const sendMatchAlertEmail = inngest.createFunction(
    {
        id: 'send-match-alert-email',
        name: 'Send Match Alert Email',
        triggers: [{ event: 'app/matches.found' }]
    },
    async ({ event, step }) => {
        const { email, count } = event.data;
        await step.run('Send Match Alert Email', async () => {
            await emailService.sendMatchAlertEmail(email, count);
        });
        return { message: 'Match alert email processed' };
    }
);

module.exports = { sendWelcomeEmail, sendMatchAlertEmail };
