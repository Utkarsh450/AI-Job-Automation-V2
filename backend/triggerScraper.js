require('dotenv').config();
const { Inngest } = require('inngest');

const inngest = new Inngest({ id: 'tsenta-backend' });

async function main() {
    console.log('Sending event to trigger scraper...');
    // We can either trigger the cron directly if possible, or we can just send the event if the scraper listens to one.
    // But the scraper ONLY has a cron trigger: { cron: '*/30 * * * *' }.
    // So to manually trigger it, we need to use the inngest CLI or dashboard, or we can just call the service directly for testing.
    
    const { scrapeAllBoards } = require('./src/services/job.service');
    console.log('Running scrapeAllBoards manually...');
    await scrapeAllBoards();
    console.log('Scraping done! Sending app/scrape.completed event to trigger the Matcher...');
    
    await inngest.send({
        name: 'app/scrape.completed',
        data: {}
    });
    console.log('Done!');
}

main().catch(console.error).finally(() => process.exit(0));
