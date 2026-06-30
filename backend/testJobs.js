const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const jobCount = await prisma.job.count();
    console.log('Total Jobs in DB:', jobCount);
    
    // Also trigger the scraper to run manually!
    const { Inngest } = require('inngest');
    const inngest = new Inngest({ id: 'tsenta-backend' });
    await inngest.send({ name: 'app/jobs.scrape' });
    console.log('Triggered Job Scraper in the background!');
}

main().finally(() => prisma.$disconnect());
