const { chromium } = require('playwright');
const { handleAuth } = require('./src/automation/workday/auth');
const logger = require('./src/utils/logger'); // assuming logger exists

(async () => {
    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: false }); // headless false to see if it hangs
    const page = await browser.newPage();
    
    // Go to Nvidia Job
    console.log('Navigating to job...');
    await page.goto('https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite/job/US-CA-Santa-Clara/Senior-Software-Engineer---Agentic-AI_JR1985954');
    
    // Click Apply
    console.log('Clicking Apply...');
    await page.waitForSelector('a[data-automation-id="jobPostingApplyButton"], a:has-text("Apply")');
    await page.click('a[data-automation-id="jobPostingApplyButton"], a:has-text("Apply")');
    
    // Handle the "Autofill with Resume" or "Apply Manually" popup that might appear before auth
    try {
        const applyManuallyBtn = page.locator('a[data-automation-id="applyManually"], button:has-text("Apply Manually"), a:has-text("Apply Manually")');
        if (await applyManuallyBtn.first().waitFor({ state: 'visible', timeout: 3000 }).catch(() => false)) {
            console.log('Found Apply Manually button, clicking...');
            await applyManuallyBtn.first().click();
        }
    } catch (e) {}

    try {
        console.log('Running auth flow...');
        await handleAuth(page, { email: 'test_auto_' + Date.now() + '@example.com' });
        console.log('Auth flow completed successfully!');
    } catch (e) {
        console.error('Auth flow failed:', e);
    }
    
    await browser.close();
})();
