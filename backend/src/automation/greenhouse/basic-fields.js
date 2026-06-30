const logger = require('../../utils/logger');

// We use a try-catch for each to ensure if one fails, it tries a fallback
const fillField = async (page, fallbackSelector, value) => {
    if (!value) return;
    try {
        await page.locator(fallbackSelector).first().fill(value, { timeout: 2000 });
    } catch (e) {
        logger.warn(`Could not fill field: ${fallbackSelector}`);
    }
};

const fillBasicInfo = async (page, userInfo) => {
    logger.info('Filling basic information...');
    await fillField(page, 'input[id*="first_name"], input[name*="first_name"]', userInfo.firstName || 'Applicant');
    await fillField(page, 'input[id*="last_name"], input[name*="last_name"]', userInfo.lastName || 'Name');
    await fillField(page, 'input[id*="email"], input[name*="email"]', userInfo.email || 'test@example.com');
    await fillField(page, 'input[id*="phone"], input[name*="phone"]', userInfo.phone || '+12345678901');

    // Location: Click "Locate me" link if available, otherwise type the location
    try {
        const locateMe = page.locator('a:has-text("Locate me"), button:has-text("Locate me"), [class*="locate"]');
        if (await locateMe.isVisible({ timeout: 2000 })) {
            logger.info('Found "Locate me" link — clicking it');
            await locateMe.click();
            await page.waitForTimeout(3000);
            logger.info('Location auto-filled via geolocation');
        } else {
            const locInput = page.locator('input[id*="location"], input[name*="location"]').first();
            if (await locInput.isVisible({ timeout: 1000 })) {
                await locInput.click();
                await locInput.fill('');
                await locInput.pressSequentially(userInfo.location || 'New Delhi, India', { delay: 100 });
                await page.waitForTimeout(4000);
                await page.keyboard.press('ArrowDown');
                await page.waitForTimeout(500);
                await page.keyboard.press('Enter');
                await page.waitForTimeout(500);
            }
        }
    } catch (e) {
        logger.warn('Failed to fill location field: ' + e.message);
    }
};

const uploadFiles = async (page, tempResumePath) => {
    logger.info('Uploading resume...');
    const fileInputs = await page.$$('input[type="file"]');
    if (fileInputs.length > 0) {
        await fileInputs[0].setInputFiles(tempResumePath);
    } else {
        logger.warn('Could not find file input for resume upload.');
    }
    await page.waitForTimeout(4000);
};

module.exports = {
    fillField,
    fillBasicInfo,
    uploadFiles
};
