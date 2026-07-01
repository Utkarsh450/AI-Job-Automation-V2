const logger = require('../../utils/logger');

/**
 * Fetches all jobs from a single Greenhouse board.
 * Standardizes the output format for the job orchestrator.
 */
const scrapeGreenhouse = async (board) => {
    try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
        if (!res.ok) {
            logger.warn(`Greenhouse API returned ${res.status} for board: ${board}`);
            return [];
        }
        const data = await res.json();
        
        if (!data.jobs) return [];

        // Map Greenhouse response to our standard Job format
        return data.jobs.map(job => ({
            title: job.title,
            company: board,
            location: job.location?.name || 'Remote',
            descriptionHtml: job.content,
            url: job.absolute_url,
            atsPlatform: 'greenhouse'
        }));
    } catch (err) {
        logger.error(`Failed to fetch Greenhouse board "${board}": ${err.message}`);
        return [];
    }
};

module.exports = {
    scrapeGreenhouse
};
