require('dotenv').config();
const { scrapeAllBoards } = require('./src/services/job.service');

(async () => {
    try {
        console.log('Starting test scrape...');
        const results = await scrapeAllBoards();
        console.log('Scrape Results:', JSON.stringify(results, null, 2));
    } catch (e) {
        console.error('Test failed:', e);
    } finally {
        process.exit(0);
    }
})();
