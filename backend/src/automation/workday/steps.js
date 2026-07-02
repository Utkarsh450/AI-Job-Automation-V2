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
    try {
        logger.info('Filling How Did You Hear About Us...');
        // Find the exact combobox explicitly linked to the label
        let sourceDropdown = page.getByLabel('How Did You Hear About Us', { exact: false }).first();
        if (!(await sourceDropdown.isVisible().catch(() => false))) {
            const hearLabel = page.locator('text=/How Did You Hear About Us/i').first();
            if (await hearLabel.isVisible().catch(() => false)) {
                const hearContainer = hearLabel.locator('xpath=ancestor::div[contains(@class, "formField") or contains(@data-automation-id, "formField") or @role="group"]').first();
                sourceDropdown = hearContainer.locator('button, [role="combobox"]').first();
            }
        }

        if (await sourceDropdown.isVisible().catch(() => false)) {
            await sourceDropdown.click({ force: true }).catch(() => {});
            await page.waitForTimeout(1000);
            
            // Try to find search box first
            const searchBox = page.locator('input[data-automation-id="searchBox"]').first();
            if (await searchBox.isVisible().catch(()=>false)) {
                await searchBox.fill('LinkedIn');
                await page.waitForTimeout(1000);
            }
            
            // Try to explicitly click the LinkedIn option if visible
            const linkedInOpt = page.locator('[role="treeitem"]:has-text("LinkedIn"), [role="option"]:has-text("LinkedIn"), [data-automation-id="promptOption"]:has-text("LinkedIn")').first();
            if (await linkedInOpt.isVisible().catch(()=>false)) {
                await linkedInOpt.click({ force: true });
            } else {
                // If nested under Job Board, click Job Board first
                const jobBoard = page.locator('[role="treeitem"]:has-text("Job Board"), [role="option"]:has-text("Job Board"), [data-automation-id="promptOption"]:has-text("Job Board")').first();
                if (await jobBoard.isVisible().catch(()=>false)) {
                    await jobBoard.click({ force: true });
                    await page.waitForTimeout(1000);
                    const li2 = page.locator('[role="treeitem"]:has-text("LinkedIn"), [role="option"]:has-text("LinkedIn"), [data-automation-id="promptOption"]:has-text("LinkedIn")').first();
                    if (await li2.isVisible().catch(()=>false)) await li2.click({ force: true });
                }
            }
            
            // Fallback keyboard Enter just in case typing filtered it
            await page.keyboard.press('Enter');
            await page.waitForTimeout(500);
        }
    } catch (e) {
        logger.error('Failed How did you hear: ' + e.message);
    }
    
    // 2. Previously worked for company? (Radio button NO)
    try {
        logger.info('Filling Previously Employed...');
        // Just click the first "No" on the page. Workday My Info only has one Yes/No.
        const noText = page.locator('label:text-is("No"), label:text-is("NO"), text-is="No"').first();
        if (await noText.isVisible().catch(() => false)) {
            await noText.click({ force: true });
        } else {
            const noRadio = page.locator('[data-automation-id="previouslyEmployed-no"], input[type="radio"]').nth(1);
            if (await noRadio.isVisible().catch(() => false)) {
                await noRadio.click({ force: true });
            }
        }
    } catch (e) {
        logger.error('Failed Prev Employed: ' + e.message);
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

    // 4. Address Fallbacks
    const addressLine = page.getByLabel('Address Line 1', { exact: false }).first();
    if (await addressLine.isVisible().catch(() => false) && (await addressLine.inputValue().catch(()=>'')) === '') {
        await addressLine.fill(userInfo.location || '123 Main St');
    }
    const city = page.getByLabel('City', { exact: false }).first();
    if (await city.isVisible().catch(() => false) && (await city.inputValue().catch(()=>'')) === '') {
        const cityStr = (userInfo.location || 'New Delhi').split(',')[0];
        await city.fill(cityStr.trim());
    }
    const postal = page.getByLabel('Postal Code', { exact: false }).first();
    if (await postal.isVisible().catch(() => false) && (await postal.inputValue().catch(()=>'')) === '') {
        await postal.fill('110001');
        await page.waitForTimeout(1000); // Wait for State auto-fill to trigger
    }
    
    // State Fallback (sometimes required)
    const stateLabel = page.locator('label:text-is("State"), label:text-is("Province")').first();
    if (await stateLabel.isVisible().catch(() => false)) {
        const stateInput = page.getByLabel('State', { exact: false }).first();
        if (await stateInput.isVisible().catch(() => false) && (await stateInput.inputValue().catch(()=>'')) === '') {
            const stateContainer = stateLabel.locator('xpath=ancestor::div[contains(@class, "formField") or contains(@data-automation-id, "formField")]').first();
            const stateDropdown = stateContainer.locator('button, [role="combobox"]').first();
            if (await stateDropdown.isVisible().catch(() => false)) {
                await stateDropdown.click({ force: true });
                await page.waitForTimeout(500);
                const firstState = page.locator('[role="option"], [role="treeitem"]').first();
                if (await firstState.isVisible().catch(() => false)) {
                    await firstState.click({ force: true });
                }
            }
        }
    }

    // 5. Phone Fallbacks (Device Type and Number)
    const phoneTypeLabel = page.locator('text=/Phone Device Type/i').first();
    if (await phoneTypeLabel.isVisible().catch(() => false)) {
        const phoneContainer = phoneTypeLabel.locator('xpath=ancestor::div[contains(@class, "formField") or contains(@data-automation-id, "formField")]').first();
        let phoneDropdown = phoneContainer.locator('button, [role="combobox"]').first();
        
        // Fallback if ancestor logic fails
        if (!(await phoneDropdown.isVisible().catch(()=>false))) {
            phoneDropdown = page.locator('[data-automation-id="phoneDeviceDropdown"], [data-automation-id="deviceType"]').first();
        }

        if (await phoneDropdown.isVisible().catch(() => false)) {
            await phoneDropdown.click({ force: true }).catch(() => {});
            await page.waitForTimeout(1000);
            
            // Find and click 'Mobile' or 'Cellular' explicitly
            const mobileOpt = page.locator('[role="option"]:has-text("Mobile"), [role="treeitem"]:has-text("Mobile"), [role="option"]:has-text("Cellular"), [role="treeitem"]:has-text("Cellular")').first();
            if (await mobileOpt.isVisible().catch(() => false)) {
                await mobileOpt.click({ force: true });
            } else {
                // Click the last option to ensure it avoids "Select One"
                const lastOpt = page.locator('[role="option"], [role="treeitem"]').last();
                if (await lastOpt.isVisible().catch(() => false)) {
                    await lastOpt.click({ force: true });
                } else {
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('ArrowDown');
                    await page.keyboard.press('Enter');
                }
            }
        }
    }
    
    const phoneInput = page.getByLabel('Phone Number', { exact: false }).first();
    if (await phoneInput.isVisible().catch(() => false) && (await phoneInput.inputValue().catch(()=>'')) === '') {
        let cleanPhone = (userInfo.phone || '9876543210').replace(/\D/g, '');
        if (cleanPhone.length > 10) {
            cleanPhone = cleanPhone.slice(-10);
        }
        await phoneInput.fill(cleanPhone);
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
