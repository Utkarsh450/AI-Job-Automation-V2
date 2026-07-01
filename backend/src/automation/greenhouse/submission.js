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

    // Only check VISIBLE text, not raw HTML which might contain hidden templates
    const visibleText = await page.evaluate(() => document.body.innerText.toLowerCase());

    if (visibleText.includes('verify your email') || visibleText.includes('verification code') || urlAfterSubmit.includes('verify')) {
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

            // First check if the specific split OTP UI is present
            const splitOtpInputs = await page.$$('.email-verification__wrapper input, input[id^="security-input-"]');

            if (splitOtpInputs.length === otpCode.length) {
                logger.info(`Detected split OTP boxes via specific selectors (${splitOtpInputs.length} boxes). Filling individually...`);
                for (let i = 0; i < otpCode.length; i++) {
                    await splitOtpInputs[i].fill(otpCode[i]);
                }
            } else {
                // Fallback to searching all visible inputs
                const inputs = await page.$$('input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="checkbox"]):not([type="radio"])');
                const visibleInputs = [];
                for (const input of inputs) {
                    if (await input.isVisible()) visibleInputs.push(input);
                }

                if (visibleInputs.length > 0) {
                    if (visibleInputs.length === otpCode.length) {
                        logger.info(`Detected split OTP boxes (${visibleInputs.length} boxes). Filling individually...`);
                        for (let i = 0; i < otpCode.length; i++) {
                            await visibleInputs[i].fill(otpCode[i]);
                        }
                    } else {
                        logger.info('Detected standard OTP box. Typing sequentially...');
                        // Prefer the first one that looks like an OTP field if there are multiple
                        let targetInput = visibleInputs[0];
                        for (const input of visibleInputs) {
                            const name = await input.getAttribute('name') || '';
                            const id = await input.getAttribute('id') || '';
                            if (name.includes('code') || name.includes('verify') || id.includes('code') || id.includes('verify') || id.includes('security')) {
                                targetInput = input;
                                break;
                            }
                        }
                        await targetInput.click();
                        await targetInput.fill('');
                        await page.keyboard.type(otpCode, { delay: 100 });
                    }
                } else {
                    logger.error('Found OTP but could not find any input boxes on the page.');
                    return { success: false, error: 'Failed to find OTP input box.' };
                }
            }
            // Click submit/verify after filling the OTP
            await page.click('button[type="submit"], button:has-text("Verify"), button:has-text("Submit"), button:has-text("Confirm")').catch(() => { });
            await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }).catch(() => { });
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
