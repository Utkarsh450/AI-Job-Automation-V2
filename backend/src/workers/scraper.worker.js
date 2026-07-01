const inngest = require('../config/inngest');
const logger = require('../utils/logger');
const { scrapeAllBoards } = require('../services/job.service');

/**
 * Inngest worker: universal-scraper
 * Runs every hour on a cron schedule.
 * Delegates all scraping logic to job.service.js.
 */
const scraperWorker = inngest.createFunction(
    {
        id: 'universal-scraper',
        name: 'Universal Job Scraper',
        triggers: [
            { cron: '*/30 * * * *' }
        ],
        concurrency: 1 // Prevent multiple concurrent scrapers
    },
    async ({ event, step }) => {
        logger.info('Universal Scraper Worker triggered.');

        // Step 1: Scrape all configured boards
        const results = await step.run('Scrape All Boards', async () => {
            return await scrapeAllBoards();
        });

        // Step 2: Notify matcher to evaluate all new jobs globally
        await step.sendEvent('Trigger Matcher', {
            name: 'app/scrape.completed',
            data: {}
        });

        logger.info('Scrape cycle complete.', results);
        return { status: 'success', results };
    }
);

module.exports = { scraperWorker };
