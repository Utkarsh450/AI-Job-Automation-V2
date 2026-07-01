const { chromium } = require('playwright');
const prisma = require('./src/config/db');

(async () => {
    console.log('Fetching real Nvidia jobs...');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    await page.goto('https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite');
    
    // Wait for job list to load
    await page.waitForSelector('a.css-19uc56f', { timeout: 15000 }).catch(() => {});
    
    const jobUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a[href*="/job/"]'));
        return links.map(a => a.href).slice(0, 10); // get first 10
    });
    
    await browser.close();
    
    if (jobUrls.length === 0) {
        console.error('Could not fetch any job URLs.');
        process.exit(1);
    }
    
    console.log('Fetched', jobUrls.length, 'jobs. Seeding database...');
    
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error('No user found in DB');
        process.exit(1);
    }
    
    for (let i = 0; i < jobUrls.length; i++) {
        const job = await prisma.job.create({
            data: {
                title: 'Nvidia Automation Test Role ' + (i+1),
                company: 'Nvidia',
                location: 'Remote',
                description: 'Test description for Nvidia role',
                url: jobUrls[i],
                atsPlatform: 'workday'
            }
        });
        
        await prisma.jobMatch.create({
            data: {
                userId: user.id,
                jobId: job.id,
                fitScore: 90 + i, // High score so they show up at the top
                reason: 'Excellent match for automation testing'
            }
        });
    }
    
    console.log('Successfully seeded 10 Nvidia jobs for user', user.email);
    process.exit(0);
})();
