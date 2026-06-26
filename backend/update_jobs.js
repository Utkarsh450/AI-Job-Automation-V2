require('dotenv').config();
const prisma = require('./src/config/db');
const { fetchGreenhouseJobs, TARGET_BOARDS } = require('./src/services/job.service');

async function updateDescriptions() {
    console.log('Updating job descriptions from Greenhouse...');
    for (const board of TARGET_BOARDS) {
        console.log(`Fetching jobs for ${board}...`);
        const jobs = await fetchGreenhouseJobs(board);
        let updated = 0;
        for (const job of jobs) {
            const res = await prisma.job.updateMany({
                where: { url: job.absolute_url },
                data: { description: job.content }
            });
            if (res.count > 0) updated++;
        }
        console.log(`Updated ${updated} jobs for ${board}.`);
    }
    console.log('All done!');
    process.exit(0);
}

updateDescriptions();
