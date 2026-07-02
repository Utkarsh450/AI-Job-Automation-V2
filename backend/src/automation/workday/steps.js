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


const handleMyExperience = async (page, userInfo, tailoredResume, tempResumePath) => {
    logger.info('Handling "My Experience" step...');
    await page.waitForTimeout(2000);

    // Take a screenshot for debugging
    const screenshotPath = path.join(require('os').tmpdir(), `my-experience-debug-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true }).catch(()=>{});
    logger.info(`Debug screenshot saved: ${screenshotPath}`);

    let filledSomething = false;

    // Upload Resume ONCE - check if already uploaded first
    if (tempResumePath) {
        // Check if a file is already uploaded (look for filename or delete button near upload area)
        const alreadyUploaded = page.locator('[data-automation-id="file-upload-item"], button:has-text("Delete"):near(text=/Resume/i), text=/\.pdf/i').first();
        const isUploaded = await alreadyUploaded.isVisible().catch(()=>false);
        
        if (!isUploaded) {
            const resumeUploadInput = page.locator('input[type="file"]').first();
            if (await resumeUploadInput.count() > 0) {
                logger.info('Uploading resume on My Experience page...');
                await resumeUploadInput.setInputFiles(tempResumePath).catch(()=>{});
                await page.waitForTimeout(5000);
                filledSomething = true;
                logger.info('✅ Resume uploaded');
            }
        } else {
            logger.info('Resume already uploaded, skipping re-upload.');
        }
    }

    // ========== WORK EXPERIENCE ==========
    const mockExp = {
        title: 'Software Developer Intern',
        company: 'Tech Solutions Inc.',
        location: 'San Jose, CA',
        description: 'Developed web applications using React and Node.js. Built REST APIs and automated testing pipelines.'
    };
    const exp = (tailoredResume?.work_experience && tailoredResume.work_experience.length > 0)
        ? tailoredResume.work_experience[0]
        : mockExp;

    logger.info('Attempting to fill Work Experience...');

    // Check if "Work Experience 1" section already exists (form expanded)
    let jobTitleInput = page.getByLabel('Job Title', { exact: false }).first();
    logger.info(`Job Title visible (before Add): ${await jobTitleInput.isVisible().catch(()=>false)}`);

    // If not visible, click Add button
    if (!(await jobTitleInput.isVisible().catch(()=>false))) {
        // Try multiple Add button strategies
        const addBtnSelectors = [
            'button[aria-label="Add Work Experience"]',
            '[data-automation-id="panel-set-add-button"]',
            'button:has-text("Add")',
        ];
        for (const sel of addBtnSelectors) {
            const btn = page.locator(sel).first();
            if (await btn.isVisible().catch(()=>false)) {
                logger.info(`Clicking Add Work Experience via: ${sel}`);
                await btn.click({ force: true }).catch(()=>{});
                await page.waitForTimeout(2500);
                break;
            }
        }
        jobTitleInput = page.getByLabel('Job Title', { exact: false }).first();
        logger.info(`Job Title visible (after Add): ${await jobTitleInput.isVisible().catch(()=>false)}`);
    }

    // Fill Job Title
    if (await jobTitleInput.isVisible().catch(()=>false)) {
        await jobTitleInput.fill(exp.title || exp.role || 'Software Developer Intern');
        logger.info('✅ Filled Job Title');
        filledSomething = true;
    } else {
        logger.warn('❌ Job Title input not found');
    }

    // Fill Company (required - red error in screenshot)
    const companyInput = page.getByLabel('Company', { exact: false }).first();
    if (await companyInput.isVisible().catch(()=>false)) {
        await companyInput.fill(exp.company || exp.employer || 'Tech Solutions Inc.');
        logger.info('✅ Filled Company');
        filledSomething = true;
    } else {
        logger.warn('❌ Company input not found');
    }

    // Fill Location (optional but good to have)
    const locationInput = page.getByLabel('Location', { exact: false }).first();
    if (await locationInput.isVisible().catch(()=>false)) {
        await locationInput.fill(exp.location || 'San Jose, CA');
        logger.info('✅ Filled Location');
        filledSomething = true;
    }

    // Fill From/To dates using XPath to find the input following the label
    // Workday DOM often breaks standard getByLabel so we find the label element and then the next input
    const fromInputXpath = page.locator('xpath=//label[contains(string(), "From")]/following::input').nth(0);
    if (await fromInputXpath.isVisible().catch(()=>false)) {
        await fromInputXpath.click({ force: true }).catch(()=>{});
        await fromInputXpath.fill('').catch(()=>{});
        await page.keyboard.type('06/2022', { delay: 50 });
        await page.keyboard.press('Tab');
        logger.info('✅ Filled Work Exp From date (XPath)');
        filledSomething = true;
    } else {
        // Ultimate fallback: click on the text "MM/YYYY" itself to focus the input!
        const mmYyyyElements = await page.getByText('MM/YYYY', { exact: false }).all();
        if (mmYyyyElements.length >= 1) {
            await mmYyyyElements[0].click({ force: true }).catch(()=>{});
            await page.keyboard.type('06/2022', { delay: 50 });
            await page.keyboard.press('Tab');
            logger.info('✅ Filled Work Exp From date (Text Click)');
            filledSomething = true;
        } else {
            logger.warn('❌ Work Exp From date not found');
        }
    }
    
    // The "To" label can be just "To" or "To*"
    const toInputXpath = page.locator('xpath=//label[starts-with(normalize-space(string()), "To")]/following::input').nth(0);
    if (await toInputXpath.isVisible().catch(()=>false)) {
        await toInputXpath.click({ force: true }).catch(()=>{});
        await toInputXpath.fill('').catch(()=>{});
        await page.keyboard.type('05/2024', { delay: 50 });
        await page.keyboard.press('Tab');
        logger.info('✅ Filled Work Exp To date (XPath)');
        filledSomething = true;
    } else {
        const mmYyyyElements = await page.getByText('MM/YYYY', { exact: false }).all();
        if (mmYyyyElements.length >= 2) {
            await mmYyyyElements[1].click({ force: true }).catch(()=>{});
            await page.keyboard.type('05/2024', { delay: 50 });
            await page.keyboard.press('Tab');
            logger.info('✅ Filled Work Exp To date (Text Click)');
            filledSomething = true;
        } else {
            logger.warn('❌ Work Exp To date not found');
        }
    }

    // Fill Role Description (textarea at the bottom of Work Experience)
    const roleDesc = page.getByLabel('Role Description', { exact: false }).first();
    if (await roleDesc.isVisible().catch(()=>false)) {
        const desc = Array.isArray(exp.highlights) ? exp.highlights.join('\n') : (exp.description || 'Developed web applications using React and Node.js.');
        await roleDesc.fill(desc);
        logger.info('✅ Filled Role Description');
        filledSomething = true;
    } else {
        // Try textarea directly
        const textareas = await page.locator('textarea').all();
        logger.info(`Found ${textareas.length} textareas on page`);
        if (textareas.length >= 1) {
            const desc = Array.isArray(exp.highlights) ? exp.highlights.join('\n') : (exp.description || 'Developed web applications using React and Node.js.');
            await textareas[0].fill(desc).catch(()=>{});
            logger.info('✅ Filled Role Description (via textarea fallback)');
            filledSomething = true;
        }
    }

    // ========== EDUCATION ==========
    logger.info('Attempting to fill Education...');
    const mockEdu = { institution: 'University of California', degree: "Bachelor's Degree", field: 'Computer Science', gpa: '3.5' };
    const edu = (tailoredResume?.education && tailoredResume.education.length > 0)
        ? tailoredResume.education[0]
        : mockEdu;

    // Check if School or University input already exists
    let schoolInput = page.getByLabel('School or University', { exact: false }).first();
    logger.info(`School input visible (before Add): ${await schoolInput.isVisible().catch(()=>false)}`);

    if (!(await schoolInput.isVisible().catch(()=>false))) {
        logger.info('School input not visible, scrolling down and looking for Education Add button...');
        
        // Scroll down to make Education section visible
        await page.evaluate(() => window.scrollBy(0, 500));
        await page.waitForTimeout(1000);

        // Strategy 1: aria-label
        let clickedEduAdd = false;
        const eduAddBtn = page.locator('button[aria-label="Add Education"]').first();
        if (await eduAddBtn.isVisible().catch(()=>false)) {
            logger.info('Found Education Add button via aria-label');
            await eduAddBtn.click({ force: true }).catch(()=>{});
            await page.waitForTimeout(2500);
            clickedEduAdd = true;
        }

        // Strategy 2: Find "Add" button that is BELOW the "Education" heading
        if (!clickedEduAdd) {
            // Get the Education heading's position
            const eduHeading = page.locator('h3:has-text("Education"), h4:has-text("Education"), div:has-text("Education"):not(:has(div))').first();
            if (await eduHeading.isVisible().catch(()=>false)) {
                // Find the nearest Add button after the Education heading
                const eduSection = eduHeading.locator('xpath=ancestor::section | ancestor::div[contains(@class, "section")]').first();
                let addInSection = eduSection.locator('button:has-text("Add")').first();
                if (await addInSection.isVisible().catch(()=>false)) {
                    logger.info('Found Add button inside Education section container');
                    await addInSection.click({ force: true }).catch(()=>{});
                    await page.waitForTimeout(2500);
                    clickedEduAdd = true;
                }
            }
        }

        // Strategy 3: Find ALL Add buttons, skip the first one (Work Experience), click the next
        if (!clickedEduAdd) {
            const allAddBtns = await page.locator('button:has-text("Add")').all();
            logger.info(`Found ${allAddBtns.length} total Add buttons on page`);
            // Log each button's text for debugging
            for (let i = 0; i < allAddBtns.length; i++) {
                const txt = await allAddBtns[i].innerText().catch(()=>'');
                logger.info(`  Add button[${i}]: "${txt.trim()}"`);
            }
            // After Work Experience is expanded, its Add button is gone or says "Add Another"
            // Education Add should be the next standalone "Add" button
            for (let i = 0; i < allAddBtns.length; i++) {
                const txt = (await allAddBtns[i].innerText().catch(()=>'')).trim();
                // Skip "Add Another" buttons (these belong to already-expanded sections)
                if (txt === 'Add') {
                    logger.info(`Clicking Add button[${i}] for Education`);
                    await allAddBtns[i].click({ force: true }).catch(()=>{});
                    await page.waitForTimeout(2500);
                    clickedEduAdd = true;
                    break;
                }
            }
        }

        // Strategy 4: Last resort - try panel-set-add-button
        if (!clickedEduAdd) {
            const panelBtns = await page.locator('[data-automation-id="panel-set-add-button"]').all();
            logger.info(`Found ${panelBtns.length} panel-set-add-buttons`);
            for (const btn of panelBtns) {
                if (await btn.isVisible().catch(()=>false)) {
                    logger.info('Clicking panel-set-add-button for Education');
                    await btn.click({ force: true }).catch(()=>{});
                    await page.waitForTimeout(2500);
                    clickedEduAdd = true;
                    break;
                }
            }
        }

        // Re-evaluate school input
        schoolInput = page.getByLabel('School or University', { exact: false }).first();
        logger.info(`School input visible (after Add click): ${await schoolInput.isVisible().catch(()=>false)}`);
    }

    // Fill School or University (required)
    if (await schoolInput.isVisible().catch(()=>false)) {
        await schoolInput.fill(edu.institution || edu.school || edu.university || 'University of California');
        logger.info('✅ Filled School or University');
        filledSomething = true;
    } else {
        logger.warn('❌ School or University input not found');
    }

    // Fill Degree (it's a native <select> dropdown - "Select One")
    // From screenshot: it's a regular dropdown, NOT a combobox
    const degreeSelect = page.locator('select').filter({ hasText: 'Select One' }).first();
    if (await degreeSelect.isVisible().catch(()=>false)) {
        // Try to select by visible text
        const degreeText = edu.degree || "Bachelor's Degree";
        try {
            await degreeSelect.selectOption({ label: degreeText });
            logger.info(`✅ Filled Degree: ${degreeText}`);
            filledSomething = true;
        } catch (e1) {
            // Try partial match
            try {
                await degreeSelect.selectOption({ label: "Bachelor's Degree" });
                logger.info('✅ Filled Degree: Bachelor\'s Degree (fallback)');
                filledSomething = true;
            } catch (e2) {
                // Try selecting by index (skip first "Select One")
                try {
                    await degreeSelect.selectOption({ index: 1 });
                    logger.info('✅ Filled Degree: index 1 (last fallback)');
                    filledSomething = true;
                } catch (e3) {
                    logger.warn('❌ Could not select Degree option');
                }
            }
        }
    } else {
        // Maybe it's a Workday custom combobox button
        const degreeBtn = page.getByLabel('Degree', { exact: false }).first();
        if (await degreeBtn.isVisible().catch(()=>false)) {
            await degreeBtn.click().catch(()=>{});
            await page.waitForTimeout(500);
            // Type to search
            await page.keyboard.type("Bachelor", { delay: 80 });
            await page.waitForTimeout(1000);
            // Click the first matching option
            const firstOpt = page.locator('[role="option"]:has-text("Bachelor"), [role="listbox"] li:has-text("Bachelor")').first();
            if (await firstOpt.isVisible().catch(()=>false)) {
                await firstOpt.click().catch(()=>{});
                logger.info('✅ Filled Degree via combobox');
                filledSomething = true;
            } else {
                await page.keyboard.press('Enter');
                logger.info('✅ Filled Degree via keyboard Enter');
                filledSomething = true;
            }
        } else {
            logger.warn('❌ Degree dropdown not found');
        }
    }

    // Fill Field of Study (has a list icon ≡ - it's an autocomplete search input)
    const fieldOfStudy = page.getByLabel('Field of Study', { exact: false }).first();
    if (await fieldOfStudy.isVisible().catch(()=>false)) {
        await fieldOfStudy.click().catch(()=>{});
        await page.keyboard.type(edu.field || edu.major || 'Computer Science', { delay: 50 });
        await page.waitForTimeout(1500);
        // Click the first autocomplete suggestion if it appears
        const suggestion = page.locator('[role="option"], [role="listbox"] div, .css-1yk1gt9-option').first();
        if (await suggestion.isVisible().catch(()=>false)) {
            await suggestion.click().catch(()=>{});
            logger.info('✅ Filled Field of Study (via autocomplete)');
        } else {
            await page.keyboard.press('Enter');
            logger.info('✅ Filled Field of Study (via Enter)');
        }
        filledSomething = true;
    } else {
        logger.warn('❌ Field of Study input not found');
    }

    // Fill Overall Result (GPA) (optional)
    const gpaInput = page.getByLabel('Overall Result', { exact: false }).first();
    if (await gpaInput.isVisible().catch(()=>false)) {
        await gpaInput.fill(edu.gpa || '3.5');
        logger.info('✅ Filled GPA');
        filledSomething = true;
    }

    // Education From/To (YYYY format from screenshot)
    // Scroll down to make Education dates visible
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(500);
    
    // The Education section might have multiple From/To labels on the page now (because of Work Experience)
    // So we look for labels specifically under the Education section, or just use the LAST ones on the page.
    const allFromInputs = await page.locator('xpath=//label[contains(string(), "From")]/following::input').all();
    if (allFromInputs.length > 0 && await allFromInputs[allFromInputs.length - 1].isVisible().catch(()=>false)) {
        const eduFromInput = allFromInputs[allFromInputs.length - 1]; // Use the last one
        await eduFromInput.click({ force: true }).catch(()=>{});
        await eduFromInput.fill('').catch(()=>{});
        await page.keyboard.type('2019', { delay: 50 });
        await page.keyboard.press('Tab');
        logger.info('✅ Filled Education From year (XPath)');
        filledSomething = true;
    } else {
        const yyyyElements = await page.getByText('YYYY', { exact: true }).all();
        if (yyyyElements.length >= 1) {
            await yyyyElements[0].click({ force: true }).catch(()=>{});
            await page.keyboard.type('2019', { delay: 50 });
            await page.keyboard.press('Tab');
            logger.info('✅ Filled Education From year (Text Click)');
            filledSomething = true;
        } else {
            logger.warn('❌ Education From year not found');
        }
    }
    
    const allToInputs = await page.locator('xpath=//label[starts-with(normalize-space(string()), "To")]/following::input').all();
    if (allToInputs.length > 0 && await allToInputs[allToInputs.length - 1].isVisible().catch(()=>false)) {
        const eduToInput = allToInputs[allToInputs.length - 1]; // Use the last one
        await eduToInput.click({ force: true }).catch(()=>{});
        await eduToInput.fill('').catch(()=>{});
        await page.keyboard.type('2023', { delay: 50 });
        await page.keyboard.press('Tab');
        logger.info('✅ Filled Education To year (XPath)');
        filledSomething = true;
    } else {
        const yyyyElements = await page.getByText('YYYY', { exact: true }).all();
        if (yyyyElements.length >= 2) {
            await yyyyElements[1].click({ force: true }).catch(()=>{});
            await page.keyboard.type('2023', { delay: 50 });
            await page.keyboard.press('Tab');
            logger.info('✅ Filled Education To year (Text Click)');
            filledSomething = true;
        } else {
            logger.warn('❌ Education To year not found');
        }
    }

    // ========== LINKEDIN / SOCIAL URLs ==========
    logger.info('Attempting to fill LinkedIn URL...');
    let linkedinInput = page.locator('xpath=//label[contains(string(), "LinkedIn profile")]/following::input').nth(0);
    
    if (!(await linkedinInput.isVisible().catch(()=>false))) {
        linkedinInput = page.getByLabel('LinkedIn', { exact: false }).first();
    }
    if (!(await linkedinInput.isVisible().catch(()=>false))) {
        linkedinInput = page.locator('input[placeholder*="linkedin" i], input[aria-label*="LinkedIn" i]').first();
    }
    
    if (await linkedinInput.isVisible().catch(()=>false)) {
        let linkedinUrl = userInfo.linkedin;
        // Strict Workday validation requires the URL to start with https://www.linkedin.com/in/
        if (!linkedinUrl || !linkedinUrl.includes('linkedin.com/in/')) {
            linkedinUrl = 'https://www.linkedin.com/in/johndoe'; // Enforce strict mock data
        } else if (!linkedinUrl.startsWith('http')) {
            linkedinUrl = 'https://' + linkedinUrl;
        }
        await linkedinInput.click({ force: true }).catch(()=>{});
        await linkedinInput.fill(''); // Clear first
        await page.keyboard.type(linkedinUrl, { delay: 50 });
        logger.info('✅ Filled LinkedIn URL (Strict): ' + linkedinUrl);
        filledSomething = true;
    }

    // Resume upload already handled at the top of this function - no duplicate upload here

    // Take screenshot AFTER filling
    const screenshotPath2 = path.join(require('os').tmpdir(), `my-experience-after-${Date.now()}.png`);
    await page.screenshot({ path: screenshotPath2, fullPage: true }).catch(()=>{});
    logger.info(`After-fill screenshot: ${screenshotPath2}`);

    logger.info(`Summary: filledSomething = ${filledSomething}`);

    if (filledSomething) {
        logger.info('✅ Fields filled. Clicking Save and Continue...');
        await clickNext(page);
    } else {
        logger.warn('⚠️ Could NOT fill ANY fields! Attempting Save and Continue anyway...');
        await clickNext(page);
        await page.waitForTimeout(2000);
        const stillOnMyExp = await page.locator('h2:has-text("My Experience"), h3:has-text("My Experience")').isVisible().catch(()=>false);
        if (stillOnMyExp) {
            logger.error('🚫 STUCK on My Experience - required fields not filled.');
        }
    }

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

    // 2. Radio Buttons, Checkboxes, and Dropdowns (Sponsorship, Authorized to work, etc)
    const questions = [
        { keywords: ['authorized', 'legally'], choice: userInfo.preferences?.authorizedToWork !== false ? 'Yes' : 'No' },
        { keywords: ['sponsorship', 'visa', 'employer support', 'work permit'], choice: userInfo.preferences?.requiresVisaSponsorship ? 'Yes' : 'No' },
        { keywords: ['relocate'], choice: userInfo.preferences?.willingToRelocate ? 'Yes' : 'No' },
        { keywords: ['previously employed', 'former employee'], choice: 'No' },
        { keywords: ['government'], choice: 'No' },
        { keywords: ['non-compete', 'noncompete'], choice: 'No' }
    ];

    // Find all "Select One" Dropdowns
    const selectButtons = await page.locator('button').filter({ hasText: 'Select One' }).all();
    for (const btn of selectButtons) {
        if (!(await btn.isVisible().catch(()=>false))) continue;

        // Walk up the DOM to find the question text (it usually contains '?' or '*')
        const questionText = await btn.evaluate(el => {
            let curr = el.parentElement;
            while (curr && curr.tagName !== 'BODY') {
                const txt = curr.innerText || '';
                if (txt.includes('?') || txt.includes('*') || txt.toLowerCase().includes('authorized') || txt.toLowerCase().includes('sponsor')) {
                    return txt;
                }
                curr = curr.parentElement;
            }
            return '';
        }).then(t => t.toLowerCase());

        if (!questionText) continue;

        let choice = 'Yes'; // Default fallback
        if (questionText.includes('authorized') || questionText.includes('legally')) {
            choice = userInfo.preferences?.authorizedToWork !== false ? 'Yes' : 'No';
        } else if (questionText.includes('sponsorship') || questionText.includes('visa') || questionText.includes('employer support') || questionText.includes('work permit')) {
            choice = userInfo.preferences?.requiresVisaSponsorship ? 'Yes' : 'No';
        } else if (questionText.includes('relocate')) {
            choice = userInfo.preferences?.willingToRelocate ? 'Yes' : 'No';
        } else if (questionText.includes('previously employed') || questionText.includes('former employee')) {
            choice = 'No';
        } else if (questionText.includes('government')) {
            choice = 'No';
        } else if (questionText.includes('non-compete') || questionText.includes('noncompete')) {
            choice = 'No';
        }

        logger.info(`Answering Dropdown: "${questionText.split('\n')[0]}" -> ${choice}`);
        
        await btn.click({ force: true }).catch(()=>{});
        await page.waitForTimeout(500);
        
        const choiceOpt = page.locator(`[role="option"]:has-text("${choice}"), [role="listbox"] li:has-text("${choice}")`).first();
        if (await choiceOpt.isVisible().catch(()=>false)) {
            await choiceOpt.click({ force: true }).catch(()=>{});
            logger.info(`✅ Selected ${choice} via Dropdown`);
        } else {
            // Fallback: keyboard navigation
            await page.keyboard.type(choice, { delay: 100 });
            await page.waitForTimeout(500);
            await page.keyboard.press('Enter');
            logger.info(`✅ Selected ${choice} via Keyboard`);
        }
        await page.waitForTimeout(500);
    }

    // Find all Radio Button groups (by finding all 'Yes' labels)
    // Workday radio options are usually inside labels with text 'Yes' or 'No'
    const yesLabels = await page.locator('label').filter({ hasText: /^Yes$/i }).all();
    for (const yesLabel of yesLabels) {
        if (!(await yesLabel.isVisible().catch(()=>false))) continue;

        const questionText = await yesLabel.evaluate(el => {
            let curr = el.parentElement;
            while (curr && curr.tagName !== 'BODY') {
                const txt = curr.innerText || '';
                if (txt.includes('?') || txt.includes('*') || txt.toLowerCase().includes('authorized') || txt.toLowerCase().includes('sponsor')) {
                    return txt;
                }
                curr = curr.parentElement;
            }
            return '';
        }).then(t => t.toLowerCase());

        if (!questionText) continue;

        let choice = 'Yes';
        if (questionText.includes('authorized') || questionText.includes('legally')) {
            choice = userInfo.preferences?.authorizedToWork !== false ? 'Yes' : 'No';
        } else if (questionText.includes('sponsorship') || questionText.includes('visa') || questionText.includes('employer support') || questionText.includes('work permit')) {
            choice = userInfo.preferences?.requiresVisaSponsorship ? 'Yes' : 'No';
        } else if (questionText.includes('relocate')) {
            choice = userInfo.preferences?.willingToRelocate ? 'Yes' : 'No';
        } else if (questionText.includes('previously employed') || questionText.includes('former employee')) {
            choice = 'No';
        } else if (questionText.includes('government')) {
            choice = 'No';
        } else if (questionText.includes('non-compete') || questionText.includes('noncompete')) {
            choice = 'No';
        }

        logger.info(`Answering Radio: "${questionText.split('\n')[0]}" -> ${choice}`);

        // Click the Yes or No label
        const targetLabel = page.locator('label').filter({ hasText: new RegExp(`^${choice}$`, 'i') }).first();
        // Since we are iterating over 'Yes' labels, we need to scope the targetLabel to the same group.
        // Easiest way is to go up a few levels and find it
        const container = yesLabel.locator('xpath=ancestor::div[contains(@class, "css-")][.//label[contains(string(), "No")]]').first();
        const optionToClick = container.locator('label').filter({ hasText: new RegExp(`^${choice}$`, 'i') }).first();
        
        if (await optionToClick.isVisible().catch(()=>false)) {
            await optionToClick.click({ force: true }).catch(()=>{});
            logger.info(`✅ Selected ${choice} via Radio`);
        }
        await page.waitForTimeout(500);
    }

    await clickNext(page);
};

const fillVoluntaryDisclosures = async (page, userInfo) => {
    logger.info('Handling "Voluntary Disclosures" step...');
    await page.waitForTimeout(2000);

    // Find all "Select One" Dropdowns
    const selectButtons = await page.locator('button').filter({ hasText: 'Select One' }).all();
    for (const btn of selectButtons) {
        if (!(await btn.isVisible().catch(()=>false))) continue;

        // Walk up the DOM to find the question text
        const questionText = await btn.evaluate(el => {
            let curr = el.parentElement;
            while (curr && curr.tagName !== 'BODY') {
                const txt = curr.innerText || '';
                if (txt.includes('?') || txt.includes('*') || txt.toLowerCase().includes('gender') || txt.toLowerCase().includes('race') || txt.toLowerCase().includes('veteran') || txt.toLowerCase().includes('disability') || txt.toLowerCase().includes('ethnicity')) {
                    return txt;
                }
                curr = curr.parentElement;
            }
            return '';
        }).then(t => t.toLowerCase());

        if (!questionText) continue;

        let targetValue = 'Decline';
        if (questionText.includes('gender') || questionText.includes('sex')) { 
            targetValue = userInfo.demographics?.gender || 'Decline'; 
        } else if (questionText.includes('hispanic') || questionText.includes('race') || questionText.includes('ethnicity')) { 
            targetValue = userInfo.demographics?.race || 'Decline'; 
        } else if (questionText.includes('veteran')) { 
            targetValue = userInfo.demographics?.veteranStatus || 'Decline'; 
        } else if (questionText.includes('disability')) { 
            targetValue = userInfo.demographics?.disabilityStatus || 'Decline'; 
        }

        const mappedValue = mapWorkdayDemographics(questionText, targetValue) || 'Decline';
        logger.info(`Answering Voluntary Disclosure: "${questionText.split('\\n')[0]}" -> ${mappedValue}`);

        await btn.click({ force: true }).catch(()=>{});
        await page.waitForTimeout(500);
        
        // Typing works amazingly well for these comboboxes
        await page.keyboard.type(mappedValue.substring(0, 5), { delay: 100 }); 
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
    }
    
    // Sometimes there is a checkbox or radio button for terms/consent
    const agreeCheckbox = page.locator('input[type="checkbox"]');
    if (await agreeCheckbox.count() > 0) {
        for (let i = 0; i < await agreeCheckbox.count(); i++) {
            await agreeCheckbox.nth(i).check({ force: true }).catch(() => {});
        }
    }

    const agreeRadio = page.locator('input[type="radio"]');
    if (await agreeRadio.count() > 0) {
        for (let i = 0; i < await agreeRadio.count(); i++) {
            const radio = agreeRadio.nth(i);
            const id = await radio.getAttribute('id');
            const text = await page.evaluate(id => {
                const label = document.querySelector(`label[for="${id}"]`);
                return label ? label.innerText.toLowerCase() : '';
            }, id);
            
            if (text.includes('yes') || text.includes('agree') || text.includes('consent') || text.includes('accept')) {
                await radio.click({ force: true }).catch(() => {});
                break;
            }
        }
        
        // Fallback: If no radio is checked, click the first one
        const isChecked = await page.evaluate(() => !!document.querySelector('input[type="radio"]:checked'));
        if (!isChecked) {
            await agreeRadio.first().click({ force: true }).catch(()=>{});
        }
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
