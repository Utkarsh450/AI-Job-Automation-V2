const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(stealthPlugin());
const logger = require('../../utils/logger');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');

const { fillBasicInfo, uploadFiles } = require('./basic-fields');
const { fillStandardCustomQuestions } = require('./custom-questions');
const { fillDemographicDropdowns } = require('./demographics-runner');
const { handleOTP, verifySubmission } = require('./submission');

/**
 * Automates applying to a Greenhouse job board.
 * @param {string} jobUrl - The URL of the Greenhouse job posting.
 * @param {object} userInfo - User's profile data (firstName, lastName, email, phone, linkedin, github).
 * @param {Buffer} resumeBuffer - The generated PDF resume buffer.
 * @param {object} tailoredResume - The user's parsed resume JSON for AI answering.
 * @param {string} userId - The database user ID to fetch Gmail tokens.
 * @returns {object} { success: boolean, message: string, error?: string }
 */
const applyToGreenhouse = async (jobUrl, userInfo, resumeBuffer, tailoredResume, userId) => {
    logger.info(`Starting Greenhouse automation for: ${jobUrl}`);
    let browser;
    // We need to write the resume buffer to a temporary file because Playwright's file upload requires a file path
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-'));
    const tempResumePath = path.join(tempDir, 'Resume.pdf');

    try {
        await fs.writeFile(tempResumePath, resumeBuffer);

        browser = await chromium.launch({ headless: false, slowMo: 100 }); // Set to false so you can watch it!
        const context = await browser.newContext({
            permissions: ['geolocation'],
            geolocation: { latitude: 28.6139, longitude: 77.2090 },
        });
        const page = await context.newPage();

        // 1. Navigate to the job URL
        await page.goto(jobUrl, { waitUntil: 'networkidle' });

        // 2. Fill basic info
        await fillBasicInfo(page, userInfo);

        // 3. Upload Resume
        await uploadFiles(page, tempResumePath);

        // 4. Fill custom questions
        await fillStandardCustomQuestions(page, userInfo, tailoredResume);

        // 5. Fill demographic / self-identification dropdowns
        await fillDemographicDropdowns(page, userInfo, tailoredResume);

        // 6. Submit the application
        logger.info('Submitting application...');
        await page.click('#submit_app, button[type="submit"], input[type="submit"]', { force: true });

        // 7. Handle OTP if required
        const otpError = await handleOTP(page, userId);
        if (otpError) return otpError;

        // 8. Verify Submission
        return await verifySubmission(page);

    } catch (error) {
        logger.error(`Greenhouse automation failed: ${error.message}`);
        return { success: false, error: error.message };
    } finally {
        if (browser) {
            await browser.close();
        }
        // Cleanup temp file
        try {
            await fs.unlink(tempResumePath);
            await fs.rmdir(tempDir);
        } catch (cleanupError) {
            logger.error(`Failed to cleanup temp files: ${cleanupError.message}`);
        }
    }
};

module.exports = {
    applyToGreenhouse
};
