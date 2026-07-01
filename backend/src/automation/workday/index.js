const { chromium } = require('playwright');
const logger = require('../../utils/logger');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { handleAuth } = require('./auth');
const { 
    uploadResume, 
    fillMyInformation, 
    handleMyExperience, 
    fillApplicationQuestions, 
    fillVoluntaryDisclosures, 
    reviewAndSubmit 
} = require('./steps');

/**
 * Automates submission for Workday ATS
 */
const applyToWorkday = async (jobUrl, userInfo, pdfBuffer, tailoredResume, userId) => {
    logger.info(`Starting Workday Automation for ${jobUrl}`);

    const tempResumePath = path.join(os.tmpdir(), `resume-${Date.now()}.pdf`);
    await fs.writeFile(tempResumePath, pdfBuffer);

    let browser;
    try {
        browser = await chromium.launch({ 
            headless: false, // Easier to debug for now
            slowMo: 500, // Makes the bot move at human speed (500ms delay between actions)
            args: ['--disable-blink-features=AutomationControlled']
        });

        const context = await browser.newContext({
            viewport: { width: 1280, height: 720 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        const page = await context.newPage();

        // 1. Navigate to Job URL
        await page.goto(jobUrl, { waitUntil: 'networkidle' });
        await page.waitForTimeout(2000);

        // Accept cookies if present
        await page.click('button:has-text("Accept"), button:has-text("Agree"), [aria-label*="cookie" i] button').catch(() => {});

        // 2. Click Apply
        const applyButton = page.locator('a[data-automation-id="applyNowButton"], button[data-automation-id="applyNowButton"], a:text-is("Apply"), button:text-is("Apply")').first();
        if (await applyButton.isVisible().catch(() => false)) {
            await applyButton.click();
            await page.waitForTimeout(2000);
        }

        // 2.1 Handle "Start Your Application" popup if it appears
        const applyManuallyBtn = page.locator('a:has-text("Apply Manually"), button:has-text("Apply Manually"), [data-automation-id="applyManually"]');
        if (await applyManuallyBtn.isVisible().catch(() => false)) {
            logger.info('Popup detected, clicking "Apply Manually"...');
            await applyManuallyBtn.click();
            await page.waitForTimeout(3000);
        } else {
            // Check if there is an autofill with resume instead
            const autofillBtn = page.locator('a:has-text("Autofill with Resume"), button:has-text("Autofill with Resume"), [data-automation-id="autofillWithResume"]');
            if (await autofillBtn.isVisible().catch(() => false)) {
                logger.info('Popup detected, clicking "Autofill with Resume"...');
                await autofillBtn.click();
                await page.waitForTimeout(3000);
            }
        }

        // 3. Handle Auth (Sign In or Create Account)
        await handleAuth(page, userInfo);

        // 4. Upload Resume (if it asks for autofill)
        await uploadResume(page, tempResumePath);

        // 5. My Information Step
        await fillMyInformation(page, userInfo);

        // 6. My Experience Step
        await handleMyExperience(page, userInfo, tailoredResume);

        // 7. Application Questions Step
        await fillApplicationQuestions(page, userInfo, tailoredResume);

        // 8. Voluntary Disclosures Step
        await fillVoluntaryDisclosures(page, userInfo);

        // 9. Review and Submit
        const result = await reviewAndSubmit(page);

        return result;

    } catch (error) {
        logger.error(`Workday automation failed: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        if (browser) await browser.close();
        await fs.unlink(tempResumePath).catch(() => {});
    }
};

module.exports = {
    applyToWorkday
};
