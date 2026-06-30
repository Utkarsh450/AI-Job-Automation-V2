const { chromium } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth');
chromium.use(stealthPlugin());
const logger = require('../utils/logger');
const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const { generateFormAnswer } = require('../services/tailor.service');
const { fetchGreenhouseOtp } = require('../services/gmail.service');

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

        browser = await chromium.launch({ headless: false }); // Set to false so you can watch it!
        const context = await browser.newContext({
            // Grant geolocation permission so "Locate me" works
            permissions: ['geolocation'],
            geolocation: { latitude: 28.6139, longitude: 77.2090 }, // Default: New Delhi, India
        });
        const page = await context.newPage();

        // 1. Navigate to the job URL
        await page.goto(jobUrl, { waitUntil: 'networkidle' });

        // 2. Fill basic info
        logger.info('Filling basic information...');
        
        // We use a try-catch for each to ensure if one fails, it tries a fallback
        const fillField = async (fallbackSelector, value) => {
            if (!value) return;
            try {
                await page.locator(fallbackSelector).first().fill(value, { timeout: 2000 });
            } catch (e) {
                logger.warn(`Could not fill field: ${fallbackSelector}`);
            }
        };

        await fillField('input[id*="first_name"], input[name*="first_name"]', userInfo.firstName || 'Applicant');
        await fillField('input[id*="last_name"], input[name*="last_name"]', userInfo.lastName || 'Name');
        await fillField('input[id*="email"], input[name*="email"]', userInfo.email || 'test@example.com');
        await fillField('input[id*="phone"], input[name*="phone"]', userInfo.phone || '+12345678901'); 
        
        // Location: Click "Locate me" link if available, otherwise type the location
        try {
            const locateMe = page.locator('a:has-text("Locate me"), button:has-text("Locate me"), [class*="locate"]');
            if (await locateMe.isVisible({ timeout: 2000 })) {
                logger.info('Found "Locate me" link — clicking it');
                await locateMe.click();
                // Wait for the geolocation to resolve and fill the field
                await page.waitForTimeout(3000);
                logger.info('Location auto-filled via geolocation');
            } else {
                // Fallback: type the location manually
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

        // 3. Upload Resume
        logger.info('Uploading resume...');
        // In Greenhouse, there is usually a button that says "Attach" next to Resume, which triggers a hidden input.
        // We can target the input directly if it exists.
        const fileInputs = await page.$$('input[type="file"]');
        if (fileInputs.length > 0) {
            // Usually the first file input is the resume, the second is the cover letter.
            await fileInputs[0].setInputFiles(tempResumePath);
        } else {
            logger.warn('Could not find file input for resume upload.');
        }

        // Wait a bit for the upload to process (Greenhouse shows a little progress bar)
        await page.waitForTimeout(4000);

        // 4. Fill custom questions
        logger.info('Filling custom questions...');
        
        // Handle dropdown selects first (standard and react-selects)
        const selects = await page.$$('select, input[role="combobox"]');
        for (const select of selects) {
            const tagName = await select.evaluate(el => el.tagName.toLowerCase());
            
            const labelText = await page.evaluate(el => {
                const label = el.closest('.custom_question, .field, .field-wrapper');
                return label ? label.innerText.split('\n')[0].trim().toLowerCase() : '';
            }, select);
            
            // Skip these native/plugin dropdowns that shouldn't be touched by the custom questions loop
            if (!labelText || labelText === 'country' || labelText.includes('country code') || labelText.includes('location') || labelText.includes('school') || labelText.includes('degree') || labelText.includes('discipline')) {
                continue;
            }
            
            const chooseOption = async (text) => {
                try {
                    if (tagName === 'select') {
                        await select.selectOption({ label: text }, { force: true }).catch(() => select.selectOption({ index: 1 }, { force: true }));
                    } else {
                        // React-select combobox (or other combobox)
                        await select.click({ force: true });
                        await page.waitForTimeout(500);
                        
                        try {
                            let found = false;
                            let lastActiveId = null;
                            for (let i = 0; i < 20; i++) {
                                await select.press('ArrowDown');
                                await page.waitForTimeout(150);
                                
                                const activeId = await select.getAttribute('aria-activedescendant');
                                if (activeId && activeId !== lastActiveId) {
                                    lastActiveId = activeId;
                                    const activeElement = page.locator(`#${activeId}`);
                                    if (await activeElement.isVisible().catch(() => false)) {
                                        const activeText = (await activeElement.innerText()).trim();
                                        
                                        if (text === 'Decline' && activeText.match(/decline|don't wish|prefer not/i)) {
                                            found = true;
                                            break;
                                        } else if (text === 'index:1' && !activeText.includes('Select')) {
                                            found = true;
                                            break;
                                        } else if (text !== 'Decline' && text !== 'index:1' && activeText.toLowerCase() === text.toLowerCase()) {
                                            found = true;
                                            break;
                                        }
                                    }
                                } else if (!activeId) {
                                    // Fallback if aria-activedescendant is not used: check for focused class
                                    const focusedOpt = page.locator('div[class*="option"][class*="focused"], div[class*="option"][class*="isFocused"]').last();
                                    if (await focusedOpt.isVisible().catch(() => false)) {
                                        const activeText = (await focusedOpt.innerText()).trim();
                                        if (text === 'Decline' && activeText.match(/decline|don't wish|prefer not/i)) {
                                            found = true;
                                            break;
                                        } else if (text === 'index:1' && !activeText.includes('Select')) {
                                            found = true;
                                            break;
                                        } else if (text !== 'Decline' && text !== 'index:1' && activeText.toLowerCase() === text.toLowerCase()) {
                                            found = true;
                                            break;
                                        }
                                    }
                                }
                            }
                            
                            if (found) {
                                await select.press('Enter');
                                await page.waitForTimeout(150);
                                await select.press('Tab');
                            } else {
                                logger.warn(`Could not find matching option for ${text} via keyboard loop`);
                            }
                        } catch (e) {
                            logger.warn('Combobox keyboard loop failed:', e);
                        }
                        await page.waitForTimeout(200);
                    }
                } catch(e) {}
            };
            
            // Basic heuristic for common dropdowns
            if (labelText.includes('sponsorship')) {
                await chooseOption('No');
            } else if (labelText.includes('authorized')) {
                await chooseOption('Yes');
            } else if (labelText.includes('gender') && !labelText.includes('identity')) {
                await chooseOption(userInfo.demographics?.gender || 'Decline');
            } else if (labelText.includes('gender identity') || labelText.includes('lgbtq')) {
                await chooseOption('Decline');
            } else if (labelText.includes('veteran')) {
                await chooseOption(userInfo.demographics?.veteranStatus || 'Decline');
            } else if (labelText.includes('disability')) {
                await chooseOption(userInfo.demographics?.disabilityStatus || 'Decline');
            } else if (labelText.includes('race') || labelText.includes('ethnicity') || labelText.includes('hispanic')) {
                await chooseOption(userInfo.demographics?.race || 'Decline');
            } else if (labelText.includes('located in the us') || labelText.includes('bay area')) {
                await chooseOption('Yes');
            } else {
                await chooseOption('index:1');
            }
        }

        const customInputs = await page.$$('.custom_question input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([id^="react-select"]):not([aria-autocomplete="list"]), .custom_question textarea, .field input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([id^="react-select"]):not([aria-autocomplete="list"]), .field textarea, .field-wrapper input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([role="combobox"]):not([id^="react-select"]):not([aria-autocomplete="list"]), .field-wrapper textarea');
        for (const input of customInputs) {
            const isVisible = await input.isVisible();
            if (!isVisible) continue;

            const isReactSelect = await page.evaluate(el => !!el.closest('div[class*="select__control"], div[class*="-control"]'), input);
            if (isReactSelect) continue;

            const labelText = await page.evaluate(el => {
                const label = el.closest('.custom_question, .field, .field-wrapper');
                return label ? label.innerText.split('\n')[0].trim() : '';
            }, input);
            const lowerLabel = labelText.toLowerCase();
            
            if (!lowerLabel || lowerLabel.includes('first name') || lowerLabel.includes('last name') || lowerLabel.includes('email') || lowerLabel.includes('phone') || lowerLabel.includes('location')) continue;

            if (lowerLabel.includes('linkedin') && userInfo.linkedin && userInfo.linkedin.toLowerCase() !== 'linkedin') {
                const url = userInfo.linkedin.startsWith('http') ? userInfo.linkedin : `https://${userInfo.linkedin}`;
                if (url.includes('.')) await input.fill(url);
            } else if ((lowerLabel.includes('github') || lowerLabel.includes('portfolio') || lowerLabel.includes('website')) && userInfo.github && userInfo.github.toLowerCase() !== 'github') {
                const url = userInfo.github.startsWith('http') ? userInfo.github : `https://${userInfo.github}`;
                if (url.includes('.')) await input.fill(url);
            } else if ((lowerLabel.includes('salary') || lowerLabel.includes('compensation') || lowerLabel.includes('pay')) && userInfo.preferences?.targetSalary) {
                await input.fill(userInfo.preferences.targetSalary.toString());
            } else if (lowerLabel.includes('where do you intend to work') || lowerLabel.includes('city and state')) {
                await input.fill(userInfo.location || '');
            } else {
                // Use AI to answer unknown custom questions!
                logger.info(`Generating AI answer for question: "${labelText}"`);
                const answer = await generateFormAnswer(labelText, tailoredResume, userInfo);
                await input.fill(answer);
                logger.info(`AI Answered: ${answer}`);
                // Small delay to simulate human typing
                await page.waitForTimeout(500);
            }
        }

        // 4b. Handle demographic / self-identification dropdowns separately
        // These live outside .custom_question / .field wrappers and are React-Select widgets
        logger.info('Filling demographic / self-identification fields...');
        
        // Scroll to the bottom of the page first to make sure everything is loaded
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1000);
        
        // Strategy: find ALL react-select containers on the page, read their label, and fill
        const reactSelectContainers = await page.$$('div[class*="select__control"], div[class*="-control"]');
        logger.info(`Found ${reactSelectContainers.length} react-select containers on page`);
        
        for (const container of reactSelectContainers) {
            try {
                // Check if this select already has a value (not "Select...")
                const currentValue = await container.evaluate(el => {
                    const singleValue = el.querySelector('div[class*="single-value"], div[class*="singleValue"]');
                    const placeholder = el.querySelector('div[class*="placeholder"]');
                    if (singleValue && singleValue.innerText.trim() !== '') return singleValue.innerText.trim();
                    if (placeholder) return 'placeholder';
                    return '';
                });
                
                // Skip if already selected (has a real value, not placeholder)
                if (currentValue && currentValue !== 'placeholder' && currentValue !== 'Select...') {
                    continue;
                }
                
                // Get the label text by looking at parent/sibling elements
                const labelText = await container.evaluate(el => {
                    // Walk up to find the parent wrapper
                    let parent = el.closest('div[class*="select__container"], div[class*="-container"]');
                    if (!parent) parent = el.parentElement;
                    // Now walk further up to the question wrapper
                    let wrapper = parent;
                    for (let i = 0; i < 5; i++) {
                        if (!wrapper) break;
                        wrapper = wrapper.parentElement;
                    }
                    if (!wrapper) return '';
                    
                    // Look for label elements
                    const label = wrapper.querySelector('label, legend, h3, h4, p, span[class*="label"]');
                    if (label) return label.innerText.trim().toLowerCase();
                    
                    // Fallback: get the first line of text from the wrapper
                    const text = wrapper.innerText.split('\n')[0].trim().toLowerCase();
                    return text;
                });
                
                logger.info(`Demographic dropdown label: "${labelText}", current: "${currentValue}"`);
                
                // Skip country code, school, degree, location, etc.
                if (!labelText || labelText.includes('country') || labelText.includes('phone') || 
                    labelText.includes('school') || labelText.includes('degree') || 
                    labelText.includes('discipline') || labelText.includes('location')) {
                    continue;
                }
                
                // Determine what to select based on user preferences
                let desiredText = null;
                if (labelText.includes('gender') && !labelText.includes('identity')) {
                    desiredText = (userInfo.demographics?.gender || "decline").toLowerCase();
                } else if (labelText.includes('veteran')) {
                    const vet = userInfo.demographics?.veteranStatus || "Decline";
                    if (vet === "I am not a protected veteran") desiredText = "not a protected";
                    else if (vet === "I am a protected veteran") desiredText = "identify as";
                    else desiredText = "decline";
                } else if (labelText.includes('disability')) {
                    const dis = userInfo.demographics?.disabilityStatus || "Decline";
                    if (dis === "No") desiredText = "don't have";
                    else if (dis === "Yes") desiredText = "yes, i have";
                    else desiredText = "don't wish";
                } else if (labelText.includes('race') || labelText.includes('ethnicity') || labelText.includes('hispanic')) {
                    desiredText = (userInfo.demographics?.race || "decline").toLowerCase();
                } else if (labelText.includes('gender identity') || labelText.includes('lgbtq')) {
                    desiredText = "don't wish";
                } else if (labelText.includes('authorized')) {
                    desiredText = 'yes';
                } else if (labelText.includes('sponsorship')) {
                    desiredText = 'no';
                } else {
                    // For unknown dropdowns, just pick the first real option
                    desiredText = null;
                }
                
                // Click to open the dropdown
                await container.click({ force: true });
                await page.waitForTimeout(500);
                
                // Now find the menu and pick the right option
                const menu = page.locator('div[class*="select__menu"], div[class*="-menu"]').last();
                if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
                    const options = menu.locator('div[class*="option"]');
                    const optCount = await options.count();
                    logger.info(`  Menu opened with ${optCount} options`);
                    
                    let selected = false;
                    if (desiredText) {
                        for (let i = 0; i < optCount; i++) {
                            const optText = (await options.nth(i).innerText()).trim().toLowerCase();
                            if (optText.includes(desiredText.toLowerCase())) {
                                await options.nth(i).click({ force: true });
                                logger.info(`  Selected: "${optText}"`);
                                selected = true;
                                break;
                            }
                        }
                    }
                    
                    if (!selected && optCount > 0) {
                        // Only use the 'pick the last option' fallback for actual demographic fields (where the last option is usually "I decline to state")
                        const isDemographic = labelText.includes('veteran') || labelText.includes('disability') || labelText.includes('race') || labelText.includes('gender') || labelText.includes('sex') || labelText.includes('ethnicity') || labelText.includes('sponsorship') || labelText.includes('authorized');
                        
                        if (isDemographic) {
                            const lastOptText = (await options.nth(optCount - 1).innerText()).trim();
                            await options.nth(optCount - 1).click({ force: true });
                            logger.info(`  Fallback selected last option: "${lastOptText}"`);
                        } else {
                            logger.info(`  Unknown dropdown "${labelText}". Extracting options to infer type...`);
                            const optionTexts = [];
                            const lowerOptionTexts = [];
                            for (let i = 0; i < optCount; i++) {
                                const t = await options.nth(i).innerText().then(t => t.trim());
                                optionTexts.push(t);
                                lowerOptionTexts.push(t.toLowerCase());
                            }
                            
                            // 1. Direct Inference: Check if options array reveals it's a demographic question
                            const optionsString = lowerOptionTexts.join(' ');
                            let inferredDirectText = null;
                            
                            if (optionsString.includes('male') && optionsString.includes('female')) {
                                inferredDirectText = (userInfo.demographics?.gender || "decline").toLowerCase();
                                logger.info(`  Inferred this is a Gender dropdown based on options.`);
                            } else if (optionsString.includes('hispanic') || optionsString.includes('asian') || optionsString.includes('white')) {
                                inferredDirectText = (userInfo.demographics?.race || "decline").toLowerCase();
                                logger.info(`  Inferred this is a Race dropdown based on options.`);
                            } else if (optionsString.includes('veteran')) {
                                const vet = userInfo.demographics?.veteranStatus || "Decline";
                                if (vet === "I am not a protected veteran") inferredDirectText = "not a protected";
                                else if (vet === "I am a protected veteran") inferredDirectText = "identify as";
                                else inferredDirectText = "decline";
                                logger.info(`  Inferred this is a Veteran dropdown based on options.`);
                            } else if (optionsString.includes('disability') || optionsString.includes('impairment')) {
                                const dis = userInfo.demographics?.disabilityStatus || "Decline";
                                if (dis === "No") inferredDirectText = "don't have";
                                else if (dis === "Yes") inferredDirectText = "yes, i have";
                                else inferredDirectText = "don't wish";
                                logger.info(`  Inferred this is a Disability dropdown based on options.`);
                            } else if (optionsString.includes('she/her') || optionsString.includes('he/him') || optionsString.includes('they/them')) {
                                inferredDirectText = (userInfo.preferences?.pronouns || "decline").toLowerCase();
                                // Match specific formats if needed (e.g. "she/her/hers" just contains "she/her")
                                if (inferredDirectText.includes('she')) inferredDirectText = 'she/her';
                                else if (inferredDirectText.includes('he')) inferredDirectText = 'he/him';
                                else if (inferredDirectText.includes('they')) inferredDirectText = 'they/them';
                                logger.info(`  Inferred this is a Pronouns dropdown based on options.`);
                            } else if ((optionsString.includes('remote') || optionsString.includes('hybrid') || optionsString.includes('on-site')) && userInfo.preferences?.remotePreference && userInfo.preferences.remotePreference !== 'Any') {
                                inferredDirectText = userInfo.preferences.remotePreference.toLowerCase();
                                logger.info(`  Inferred this is a Work Style dropdown based on options.`);
                            } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.includes('authorized')) {
                                inferredDirectText = userInfo.preferences?.authorizedToWork !== false ? "yes" : "no";
                                logger.info(`  Inferred this is an Authorization dropdown based on options.`);
                            } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.includes('sponsorship')) {
                                inferredDirectText = userInfo.preferences?.requiresVisaSponsorship === true ? "yes" : "no";
                                logger.info(`  Inferred this is a Sponsorship dropdown based on options.`);
                            } else if (optionsString.includes('yes') && optionsString.includes('no') && (labelText.toLowerCase().includes('worked for') && labelText.toLowerCase().includes('before'))) {
                                inferredDirectText = userInfo.preferences?.previouslyEmployed === true ? "yes" : "no";
                                logger.info(`  Inferred Previous Employment question.`);
                            } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.toLowerCase().includes('ph.d')) {
                                inferredDirectText = userInfo.preferences?.enrolledInPhD === true ? "yes" : "no";
                                logger.info(`  Inferred Ph.D question.`);
                            } else if (labelText.toLowerCase().includes('how many years') && labelText.toLowerCase().includes('ph.d')) {
                                inferredDirectText = (userInfo.preferences?.yearsInPhD || "decline").toLowerCase();
                                logger.info(`  Inferred Ph.D Years question.`);
                            } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.toLowerCase().includes('located in the us')) {
                                inferredDirectText = userInfo.preferences?.locatedInUS === false ? "no" : "yes";
                                logger.info(`  Inferred US Location question.`);
                            } else if (optionsString.includes('yes') && optionsString.includes('no') && labelText.toLowerCase().includes('bay area')) {
                                inferredDirectText = userInfo.preferences?.willingToRelocate === true ? "yes" : "no";
                                logger.info(`  Inferred Bay Area Relocation question.`);
                            } else if (optionsString.includes('lgbtq')) {
                                inferredDirectText = (userInfo.preferences?.lgbtqStatus || "decline").toLowerCase();
                                logger.info(`  Inferred LGBTQ+ Status question.`);
                            }
                            
                            if (inferredDirectText) {
                                // We found a direct demographic match! Just click it, no AI needed!
                                let matched = false;
                                for (let i = 0; i < optCount; i++) {
                                    if (lowerOptionTexts[i].includes(inferredDirectText)) {
                                        await options.nth(i).click({ force: true });
                                        logger.info(`  Directly Selected Onboarding Data: "${optionTexts[i]}"`);
                                        matched = true;
                                        break;
                                    }
                                }
                                if (!matched) {
                                    const lastOptText = optionTexts[optCount - 1];
                                    await options.nth(optCount - 1).click({ force: true });
                                    logger.info(`  Fallback selected last option: "${lastOptText}"`);
                                }
                            } else {
                                // 2. True Unknown Dropdown: Call AI (e.g. "How did you hear about us?")
                                logger.info(`  Using AI to select option for custom dropdown...`);
                                const aiPrompt = `Which of these options is the most accurate for the candidate based on their resume? 
Question/Label: "${labelText}"
Options: ${JSON.stringify(optionTexts)}

Return EXACTLY the text of the chosen option, nothing else. Do not add markdown or quotes. If you cannot decide or there is no good match, return exactly the last option in the array.`;
                                
                                const aiSelectedText = await generateFormAnswer(aiPrompt, tailoredResume, userInfo);
                                logger.info(`  AI suggested: "${aiSelectedText}"`);
                                
                                let aiSelected = false;
                                for (let i = 0; i < optCount; i++) {
                                    if (lowerOptionTexts[i].includes(aiSelectedText.toLowerCase())) {
                                        await options.nth(i).click({ force: true });
                                        logger.info(`  AI Selected: "${optionTexts[i]}"`);
                                        aiSelected = true;
                                        break;
                                    }
                                }
                                
                                if (!aiSelected) {
                                    const lastOptText = optionTexts[optCount - 1];
                                    await options.nth(optCount - 1).click({ force: true });
                                    logger.info(`  AI Failed to match. Fallback selected last option: "${lastOptText}"`);
                                }
                            }
                        }
                    }
                } else {
                    // Menu didn't open via click, try keyboard
                    logger.warn('  Menu did not open, trying keyboard fallback');
                    const comboInput = await container.$('input');
                    if (comboInput) {
                        await comboInput.press('ArrowDown');
                        await page.waitForTimeout(200);
                        await comboInput.press('ArrowDown');
                        await page.waitForTimeout(200);
                        await comboInput.press('Enter');
                    }
                }
                
                await page.waitForTimeout(300);
            } catch (e) {
                logger.warn(`Failed to fill a demographic dropdown: ${e.message}`);
            }
        }

        // Re-fill First and Last name just in case a React state change wiped them during custom questions
        await fillField('input[id*="first_name"], input[name*="first_name"]', userInfo.firstName || 'Applicant');
        await fillField('input[id*="last_name"], input[name*="last_name"]', userInfo.lastName || 'Name');

        // 5. Submit the application
        logger.info('Submitting application...');
        // We find the submit button. Usually id="submit_app" (can be an input type="submit" or a button)
        await page.click('#submit_app, button[type="submit"], input[type="submit"]', { force: true });

        // 6. Wait for success page, OTP page, or error message
        logger.info('Waiting for submission confirmation or OTP challenge...');
        
        // Wait up to 10 seconds for one of the three states
        try {
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 }), // Success or OTP page
                page.waitForSelector('.error-message, #error_message', { state: 'visible', timeout: 15000 }) // Validation error
            ]);
        } catch (e) {
            logger.warn('Timeout waiting for navigation, checking page state...');
        }

        const urlAfterSubmit = page.url();
        const pageText = await page.content();
        
        // OTP Detection
        if (pageText.includes('verify your email') || pageText.includes('verification code') || urlAfterSubmit.includes('verify')) {
            logger.warn('🚨 OTP Verification Wall Detected!');
            logger.info('Polling Gmail API for the 6-digit code...');
            
            let otpCode = null;
            // Poll every 5 seconds for up to 60 seconds
            for (let i = 0; i < 12; i++) {
                await page.waitForTimeout(5000);
                otpCode = await fetchGreenhouseOtp(userId);
                if (otpCode) break;
                logger.info(`Still waiting for OTP... (${(i + 1) * 5}s)`);
            }

            if (otpCode) {
                logger.info(`✅ OTP Found: ${otpCode}. Filling it in...`);
                // Assume the input is a text box for the code. Sometimes it's 6 individual boxes, but we'll try the common patterns
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

        const finalUrl = page.url();
        if (finalUrl.includes('confirmation') || finalUrl.includes('thanks') || (await page.content()).includes('Application submitted')) {
            logger.info('Application submitted successfully.');
            return { success: true, message: 'Successfully applied via Greenhouse' };
        } else {
            // Take a screenshot to help debug what field is failing
            const screenshotPath = path.join(os.tmpdir(), `error-${Date.now()}.png`);
            await page.screenshot({ path: screenshotPath, fullPage: true });
            logger.info(`Saved error screenshot to ${screenshotPath}`);

            // Try to find error messages
            const errorText = await page.evaluate(() => {
                const errs = Array.from(document.querySelectorAll('.error-message, #error_message, .error, .invalid-feedback'));
                return errs.map(e => e.innerText).join(' | ') || 'Unknown validation error';
            });
            logger.error(`Failed to submit. Error on page: ${errorText}. See screenshot at ${screenshotPath}`);
            return { success: false, error: `Failed to submit: ${errorText}` };
        }

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
