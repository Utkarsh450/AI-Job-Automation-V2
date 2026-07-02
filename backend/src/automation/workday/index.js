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

        // Dynamic Step Navigation
        let reachedReview = false;
        let maxSteps = 15; // fail-safe to prevent infinite loops
        let lastStepHeader = '';
        let sameStepCount = 0;

        while (!reachedReview && maxSteps > 0) {
            maxSteps--;
            await page.waitForTimeout(3000); // Wait for page load

            const headerText = await page.evaluate(() => {
                // 1. Prioritize active step in progress bar
                const activeStep = document.querySelector('[aria-current="step"], [aria-current="true"], [data-automation-id="activeStep"]');
                if (activeStep && activeStep.innerText.trim().length > 0) {
                    return activeStep.innerText.trim();
                }
                
                // 2. Check all h2 and h3 elements for known step keywords
                const headings = Array.from(document.querySelectorAll('h2, h3'));
                const knownSteps = ['My Information', 'My Experience', 'Application Questions', 'Voluntary Disclosures', 'Self Identify', 'Review'];
                for (const h of headings) {
                    const text = h.innerText.trim();
                    if (knownSteps.some(step => text.includes(step))) {
                        return text;
                    }
                }
                
                return '';
            });

            logger.info(`Detected current step: ${headerText}`);

            // Track if we're stuck on the same step
            if (headerText === lastStepHeader) {
                sameStepCount++;
                logger.warn(`Same step "${headerText}" detected ${sameStepCount} time(s) in a row.`);
                if (sameStepCount >= 3) {
                    logger.error(`🚫 STUCK on "${headerText}" for 3 iterations. Force-skipping to prevent infinite loop.`);
                    // Take error screenshot
                    const stuckScreenshot = path.join(os.tmpdir(), `stuck-${headerText.replace(/\s/g, '_')}-${Date.now()}.png`);
                    await page.screenshot({ path: stuckScreenshot, fullPage: true }).catch(()=>{});
                    logger.error(`Stuck screenshot saved: ${stuckScreenshot}`);
                    
                    // Force click next to try to move past
                    const nextBtn = page.locator('button[data-automation-id="bottom-navigation-next-button"], button:has-text("Next"), button:has-text("Save and Continue")').first();
                    if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await nextBtn.click();
                        await page.waitForTimeout(3000);
                    }
                    // If still stuck after 4 tries, bail out
                    if (sameStepCount >= 4) {
                        throw new Error(`Stuck on "${headerText}" - could not fill required fields. Check debug screenshots in temp folder.`);
                    }
                    continue;
                }
            } else {
                sameStepCount = 0;
                lastStepHeader = headerText;
            }

            if (headerText.includes('My Information')) {
                await fillMyInformation(page, userInfo);
            } else if (headerText.includes('My Experience')) {
                await handleMyExperience(page, userInfo, tailoredResume, tempResumePath);
            } else if (headerText.includes('Application Questions')) {
                await fillApplicationQuestions(page, userInfo, tailoredResume);
            } else if (headerText.includes('Voluntary Disclosures') || headerText.includes('Self Identify') || headerText.includes('Disclosures')) {
                await fillVoluntaryDisclosures(page, userInfo);
            } else if (headerText.includes('Review')) {
                reachedReview = true;
                break;
            } else if (headerText === '') {
                logger.warn('Could not detect step header. Trying to click Next if available...');
                const nextBtn = page.locator('button[data-automation-id="bottom-navigation-next-button"], button:has-text("Next"), button:has-text("Save and Continue")').first();
                if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await nextBtn.click();
                } else {
                    // Check if Review page loaded without a clear header
                    if (await page.locator('button:has-text("Submit")').isVisible().catch(()=>false)) {
                        reachedReview = true;
                        break;
                    }
                }
            } else {
                logger.warn(`Unknown step: ${headerText}. Attempting to just click Next.`);
                const nextBtn = page.locator('button[data-automation-id="bottom-navigation-next-button"], button:has-text("Next"), button:has-text("Save and Continue")').first();
                if (await nextBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await nextBtn.click();
                }
            }
        }

        if (!reachedReview) {
            throw new Error('Failed to reach Review page after 15 steps.');
        }

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
