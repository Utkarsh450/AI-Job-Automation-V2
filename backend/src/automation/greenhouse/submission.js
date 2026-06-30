const logger = require('../../utils/logger');
const { fetchGreenhouseOtp } = require('../../services/gmail.service');
const path = require('path');
const os = require('os');

const handleOTP = async (page, userId) => {
    logger.info('Waiting for submission confirmation or OTP challenge...');

    try {
        await Promise.race([
            page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }),
            page.waitForSelector('.error-message, #error_message', { state: 'visible', timeout: 15000 })
        ]);
    } catch (e) {
        logger.warn('Timeout waiting for navigation, checking page state...');
    }

    const urlAfterSubmit = page.url();
    const pageText = await page.content();

    if (pageText.includes('verify your email') || pageText.includes('verification code') || urlAfterSubmit.includes('verify')) {
        logger.warn('🚨 OTP Verification Wall Detected!');
        logger.info('Polling Gmail API for the 6-digit code...');

        let otpCode = null;
        for (let i = 0; i < 12; i++) {
            await page.waitForTimeout(5000);
            otpCode = await fetchGreenhouseOtp(userId);
            if (otpCode) break;
            logger.info(`Still waiting for OTP... (${(i + 1) * 5}s)`);
        }

        if (otpCode) {
            logger.info(`✅ OTP Found: ${otpCode}. Filling it in...`);
            const otpInput = await page.$('input[name="verification_code"], input[type="number"], input[name="token"]');
            if (otpInput) {
                await otpInput.fill(otpCode);
                await page.click('button[type="submit"], button:has-text("Verify")');
                await page.waitForNavigation({ waitUntil: 'networkidle' });
            } else {
                logger.error('Found OTP but could not find the input box on the page.');
                return { success: false, error: 'Failed to find OTP input box.' };
            }
        } else {
            logger.error('Failed to receive OTP within 60 seconds.');
            return { success: false, error: 'OTP Timeout' };
        }
    }
    return null;
};

const verifySubmission = async (page) => {
    const finalUrl = page.url();
    if (finalUrl.includes('confirmation') || finalUrl.includes('thanks') || (await page.content()).includes('Application submitted')) {
        logger.info('Application submitted successfully.');
        return { success: true, message: 'Successfully applied via Greenhouse' };
    } else {
        const screenshotPath = path.join(os.tmpdir(), `error-${Date.now()}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        logger.info(`Saved error screenshot to ${screenshotPath}`);

        const errorText = await page.evaluate(() => {
            const errs = Array.from(document.querySelectorAll('.error-message, #error_message, .error, .invalid-feedback'));
            return errs.map(e => e.innerText).join(' | ') || 'Unknown validation error';
        });
        logger.error(`Failed to submit. Error on page: ${errorText}. See screenshot at ${screenshotPath}`);
        return { success: false, error: `Failed to submit: ${errorText}` };
    }
};

module.exports = {
    handleOTP,
    verifySubmission
};
