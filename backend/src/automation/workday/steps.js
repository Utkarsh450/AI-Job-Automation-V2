const logger = require('../../utils/logger');
const path = require('path');
const { generateFormAnswer } = require('../../services/tailor.service');
const { mapWorkdayDemographics } = require('./demographics-mapper');

const clickNext = async (page) => {
    const nextBtn = page.locator('button[data-automation-id="bottom-navigation-next-button"], button:has-text("Next"), button:has-text("Save and Continue")').first();
    if (await nextBtn.isVisible({ timeout: 5000 })) {
        await nextBtn.click();
        await page.waitForTimeout(3000);
    }
};

const uploadResume = async (page, tempResumePath) => {
    logger.info('Uploading Resume for Autofill...');
    const fileInput = page.locator('input[type="file"][data-automation-id="file-upload-input-ref"]');
    if (await fileInput.isVisible({ timeout: 5000 }).catch(() => false)) {
        await fileInput.setInputFiles(tempResumePath);
        logger.info('Resume uploaded. Waiting for Workday to parse (can take up to 15s)...');
        // Wait for the "Continue" or "Next" button to become enabled or a specific loading overlay to disappear
        await page.waitForTimeout(10000); // Give it plenty of time to parse
        await clickNext(page);
    } else {
        logger.warn('No resume upload field found. It might be already uploaded.');
    }
};

const fillMyInformation = async (page, userInfo) => {
    logger.info('Handling "My Information" step...');
    await page.waitForTimeout(2000);

    // 1. How did you hear about us?
    const sourceDropdown = page.locator('[data-automation-id="sourceDropdown"], button:has-text("Select"), [role="combobox"]').first();
    if (await sourceDropdown.isVisible({ timeout: 2000 }).catch(() => false)) {
        logger.info('Filling How Did You Hear About Us...');
        await sourceDropdown.click({ force: true }).catch(() => {});
        await page.waitForTimeout(1000);
        
        // Workday dropdowns use promptOption. Click the first one.
        const firstOption = page.locator('[data-automation-id="promptOption"]').first();
        if (await firstOption.isVisible().catch(() => false)) {
            await firstOption.click({ force: true });
            await page.waitForTimeout(500);
            // If it was a folder (like "Social Media"), click the first item inside it
            if (await firstOption.isVisible().catch(() => false)) {
                await firstOption.click({ force: true }).catch(() => {});
            }
        } else {
            await page.keyboard.press('ArrowDown');
            await page.keyboard.press('Enter');
        }
        await page.waitForTimeout(500);
    }
    
    // 2. Previously worked for company? (Radio button NO)
    const noRadio = page.locator('[data-automation-id="previouslyEmployed-no"], input[type="radio"][value="No"]').first();
    if (await noRadio.isVisible().catch(() => false)) {
        logger.info('Filling Previously Employed...');
        await noRadio.click({ force: true }).catch(() => {});
    } else {
        const prevEmployedLabel = page.locator('label:has-text("previously worked"), label:has-text("previously employed")');
        if (await prevEmployedLabel.isVisible().catch(() => false)) {
            logger.info('Filling Previously Employed (Fallback)...');
            const fallbackRadio = prevEmployedLabel.locator('..').locator('label:has-text("No"), label:has-text("NO")').first();
            await fallbackRadio.click({ force: true }).catch(() => {});
        }
    }

    // 3. Legal Name Fallbacks
    const givenName = page.getByLabel('Given Name', { exact: false }).first();
    if (await givenName.isVisible().catch(() => false) && (await givenName.inputValue().catch(()=>'')) === '') {
        await givenName.fill(userInfo.firstName || 'Applicant');
    }
    const familyName = page.getByLabel('Family Name', { exact: false }).first();
    if (await familyName.isVisible().catch(() => false) && (await familyName.inputValue().catch(()=>'')) === '') {
        await familyName.fill(userInfo.lastName || 'Name');
    }

    // 4. Address Fallbacks (if parsed empty)
    const addressLine = page.getByLabel('Address Line 1', { exact: false }).first();
    if (await addressLine.isVisible().catch(() => false) && (await addressLine.inputValue().catch(()=>'')) === '') {
        await addressLine.fill('123 Tech Lane');
    }
    const city = page.getByLabel('City', { exact: false }).first();
    if (await city.isVisible().catch(() => false) && (await city.inputValue().catch(()=>'')) === '') {
        await city.fill('New Delhi');
    }
    const postal = page.getByLabel('Postal Code', { exact: false }).first();
    if (await postal.isVisible().catch(() => false) && (await postal.inputValue().catch(()=>'')) === '') {
        await postal.fill('110001');
    }

    // 5. Phone Fallbacks (Device Type and Number)
    const phoneTypeLabel = page.locator('label:has-text("Phone Device Type")');
    if (await phoneTypeLabel.isVisible().catch(() => false)) {
        // Dropdowns don't always work with getByLabel if they are custom divs. We try to click the combobox nearby.
        const phoneDropdown = page.locator('[data-automation-id="phoneDeviceDropdown"], [data-automation-id="deviceType"]').first();
        if (await phoneDropdown.isVisible().catch(() => false)) {
            await phoneDropdown.click({ force: true }).catch(() => {});
        } else {
            const fallbackDropdown = phoneTypeLabel.locator('..').locator('button, [role="combobox"]').first();
            await fallbackDropdown.click({ force: true }).catch(() => {});
        }
        await page.waitForTimeout(1000);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown'); // Second option is usually Mobile
        await page.keyboard.press('Enter');
    }
    
    const phoneInput = page.getByLabel('Phone Number', { exact: false }).first();
    if (await phoneInput.isVisible().catch(() => false) && (await phoneInput.inputValue().catch(()=>'')) === '') {
        await phoneInput.fill(userInfo.phone || '9876543210');
    }

    await clickNext(page);
};


const handleMyExperience = async (page, userInfo, tailoredResume) => {
    logger.info('Handling "My Experience" step...');
    // The resume parser should have filled this out. 
    // Sometimes Workday throws validation errors if a required field like "Title" or "Company" is empty due to bad parsing.
    // We try to click Next. If there is an error, we might have to delete the faulty experience blocks.
    await clickNext(page);

    const errorSummary = page.locator('[data-automation-id="errorBanner"]');
    if (await errorSummary.isVisible({ timeout: 2000 }).catch(() => false)) {
        logger.warn('Validation error on My Experience page. Attempting to clear mandatory fields or delete blocks...');
        // For MVP, if it fails validation here, we will just delete all experience/education blocks and let them rely on the PDF.
        const deleteButtons = await page.$$('[data-automation-id="panel-set-delete-button"]');
        for (const btn of deleteButtons) {
            await btn.click({ force: true });
            await page.waitForTimeout(500);
        }
        await clickNext(page);
    }
};

const fillApplicationQuestions = async (page, userInfo, tailoredResume) => {
    logger.info('Handling "Application Questions" step...');
    // Wait for the page to load
    await page.waitForTimeout(2000);

    // This page has custom text inputs, radio buttons, and dropdowns.
    // For text areas (e.g., "Why do you want to work here?"), we use the AI tailor service.
    // For Yes/No radios (Visa sponsorship), we use userInfo.

    // 1. Text Inputs / Textareas
    const textInputs = await page.$$('textarea, input[type="text"]:not([readonly])');
    for (const input of textInputs) {
        const isVisible = await input.isVisible().catch(() => false);
        if (!isVisible) continue;
        
        const labelText = await page.evaluate(el => {
            const label = el.closest('[data-automation-id="formField"]');
            return label ? label.innerText.split('\n')[0].trim() : '';
        }, input);

        if (labelText && labelText.length > 10) {
            logger.info(`Answering: ${labelText}`);
            const answer = await generateFormAnswer(labelText, tailoredResume, userInfo);
            await input.fill(answer);
            await page.waitForTimeout(500);
        }
    }

    // 2. Radio Buttons (Sponsorship, Authorized to work, etc)
    const fieldSets = await page.$$('[data-automation-id="formField"]');
    for (const field of fieldSets) {
        const labelText = await field.innerText().then(t => t.split('\n')[0].toLowerCase());
        const radios = await field.$$('input[type="radio"]');
        if (radios.length > 0) {
            let choice = 'Yes';
            if (labelText.includes('sponsorship') || labelText.includes('visa')) {
                choice = userInfo.preferences?.requiresVisaSponsorship ? 'Yes' : 'No';
            } else if (labelText.includes('authorized') || labelText.includes('legally')) {
                choice = userInfo.preferences?.authorizedToWork !== false ? 'Yes' : 'No';
            } else if (labelText.includes('relocate')) {
                choice = userInfo.preferences?.willingToRelocate ? 'Yes' : 'No';
            }

            // Find the radio that matches the choice
            for (const radio of radios) {
                const radioId = await radio.getAttribute('id');
                const radioLabel = await page.evaluate(id => {
                    const l = document.querySelector(`label[for="${id}"]`);
                    return l ? l.innerText : '';
                }, radioId);

                if (radioLabel.includes(choice)) {
                    await radio.click({ force: true });
                    break;
                }
            }
        }
    }

    await clickNext(page);
};

const fillVoluntaryDisclosures = async (page, userInfo) => {
    logger.info('Handling "Voluntary Disclosures" step...');
    await page.waitForTimeout(2000);

    const dropdowns = await page.$$('[data-automation-id="selectWidget"]');
    for (const dropdown of dropdowns) {
        const labelText = await page.evaluate(el => {
            const field = el.closest('[data-automation-id="formField"]');
            return field ? field.innerText.split('\n')[0].toLowerCase() : '';
        }, dropdown);

        let targetValue = 'Decline';
        if (labelText.includes('gender')) targetValue = userInfo.demographics?.gender || 'Decline';
        else if (labelText.includes('hispanic') || labelText.includes('race') || labelText.includes('ethnicity')) targetValue = userInfo.demographics?.race || 'Decline';
        else if (labelText.includes('veteran')) targetValue = userInfo.demographics?.veteranStatus || 'Decline';
        else if (labelText.includes('disability')) targetValue = userInfo.demographics?.disabilityStatus || 'Decline';

        const mappedValue = mapWorkdayDemographics(labelText, targetValue);

        if (mappedValue) {
            await dropdown.click();
            await page.waitForTimeout(500);
            // Type the mapped value to filter Workday's select dropdown
            await page.keyboard.type(mappedValue.substring(0, 5), { delay: 100 }); 
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            await page.waitForTimeout(300);
        }
    }
    
    // Sometimes there is a checkbox for terms
    const agreeCheckbox = page.locator('input[type="checkbox"]');
    if (await agreeCheckbox.isVisible().catch(() => false)) {
        await agreeCheckbox.click({ force: true }).catch(() => {});
    }

    await clickNext(page);
};

const reviewAndSubmit = async (page) => {
    logger.info('Handling "Review" step...');
    await page.waitForTimeout(2000);

    // Final signature or acknowledgement checkbox
    const signature = page.locator('[data-automation-id="signatureInput"], [data-automation-id="legalName"]');
    if (await signature.isVisible().catch(() => false)) {
        await signature.fill('Applicant Name'); // In production, use userInfo.firstName + ' ' + userInfo.lastName
    }

    const agreeCheckbox = page.locator('input[type="checkbox"]');
    if (await agreeCheckbox.isVisible().catch(() => false)) {
        await agreeCheckbox.click({ force: true }).catch(() => {});
    }

    logger.info('Clicking Final Submit...');
    const submitBtn = page.locator('button[data-automation-id="bottom-navigation-next-button"]:has-text("Submit"), button:has-text("Submit")').first();
    if (await submitBtn.isVisible()) {
        await submitBtn.click();
        
        // Wait for confirmation page
        try {
            await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 20000 });
            if (page.url().includes('submitted') || page.url().includes('success')) {
                logger.info('Application submitted successfully to Workday!');
                return { success: true, message: 'Successfully applied via Workday' };
            }
        } catch (e) {}

        const successHeader = page.locator('h2:has-text("Congratulations"), h2:has-text("Success"), h1:has-text("Submitted")');
        if (await successHeader.isVisible({ timeout: 10000 }).catch(() => false)) {
            logger.info('Application submitted successfully to Workday!');
            return { success: true, message: 'Successfully applied via Workday' };
        }
    }

    const screenshotPath = path.join(require('os').tmpdir(), `error-workday-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    logger.error(`Workday submission failed or confirmation not detected. See screenshot at ${screenshotPath}`);
    return { success: false, error: 'Workday submission failed or stuck on Review page.' };
};

module.exports = {
    uploadResume,
    fillMyInformation,
    handleMyExperience,
    fillApplicationQuestions,
    fillVoluntaryDisclosures,
    reviewAndSubmit
};
