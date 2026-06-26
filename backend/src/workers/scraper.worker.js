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
        triggers: [
            { cron: '*/30 * * * *' },
            { event: 'app/jobs.scrape' }
        ],
        concurrency: 1 // Prevent multiple concurrent scrapers
    },
    async ({ event, step }) => {
        logger.info('Greenhouse Scraper Worker triggered.');

        // Extract userId if this was triggered manually by a specific user (e.g. on resume upload)
        const userId = event?.data?.userId;

        // Step 1: Scrape all configured boards
        const results = await step.run('Scrape All Boards', async () => {
            return await scrapeAllBoards();
        });

        // Step 2: Notify matcher
        // If userId is present, the matcher will only evaluate this specific user.
        // Otherwise, it evaluates all users against the new jobs.
        await step.sendEvent('Trigger Matcher', {
            name: 'app/scrape.completed',
            data: userId ? { userId } : {}
        });

        logger.info('Scrape cycle complete.', results);
        return { status: 'success', results };
    }
);

module.exports = { scraperWorker };
