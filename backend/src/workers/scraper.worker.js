const inngest = require('../config/inngest');
const logger = require('../utils/logger');
const { scrapeAllBoards } = require('../services/job.service');

/**
 * Inngest worker: greenhouse-scraper
 * Runs every hour on a cron schedule.
 * Delegates all scraping logic to job.service.js.
 */
const scraperWorker = inngest.createFunction(
    {
        id: 'greenhouse-scraper',
        name: 'Greenhouse Job Scraper',
        triggers: [{ cron: '0 * * * *' }]
    },
    async ({ step }) => {
        logger.info('Greenhouse Scraper Worker triggered.');

        // Step 1: Scrape all configured boards
        const results = await step.run('Scrape All Boards', async () => {
            return await scrapeAllBoards();
        });

        // Step 2: Notify matcher to re-evaluate all users against new jobs
        // Uses step.sendEvent so this trigger is part of the durable step graph
        await step.sendEvent('Trigger Matcher', {
            name: 'app/scrape.completed',
            data: {}
        });

        logger.info('Scrape cycle complete.', results);
        return { status: 'success', results };
    }
);

module.exports = { scraperWorker };
