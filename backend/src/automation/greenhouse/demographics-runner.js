const logger = require('../../utils/logger');
const { generateFormAnswer } = require('../../services/tailor.service');
const { inferDemographicOption, getDesiredDemographicText } = require('./demographics-mapper');

const fillDemographicDropdowns = async (page, userInfo, tailoredResume) => {
    logger.info('Filling demographic / self-identification fields...');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);

    const reactSelectContainers = await page.$$('div[class*="select__control"], div[class*="-control"]');
    logger.info(`Found ${reactSelectContainers.length} react-select containers on page`);

    for (const container of reactSelectContainers) {
        try {
            const currentValue = await container.evaluate(el => {
                const singleValue = el.querySelector('div[class*="single-value"], div[class*="singleValue"]');
                const placeholder = el.querySelector('div[class*="placeholder"]');
                if (singleValue && singleValue.innerText.trim() !== '') return singleValue.innerText.trim();
                if (placeholder) return 'placeholder';
                return '';
            });

            if (currentValue && currentValue !== 'placeholder' && currentValue !== 'Select...') {
                continue;
            }

            const labelText = await container.evaluate(el => {
                let parent = el.closest('div[class*="select__container"], div[class*="-container"]');
                if (!parent) parent = el.parentElement;
                let wrapper = parent;
                for (let i = 0; i < 5; i++) {
                    if (!wrapper) break;
                    wrapper = wrapper.parentElement;
                }
                if (!wrapper) return '';
                const label = wrapper.querySelector('label, legend, h3, h4, p, span[class*="label"]');
                if (label) return label.innerText.trim().toLowerCase();
                return wrapper.innerText.split('\n')[0].trim().toLowerCase();
            });

            logger.info(`Demographic dropdown label: "${labelText}", current: "${currentValue}"`);

            if (!labelText || labelText.includes('country') || labelText.includes('phone') ||
                labelText.includes('school') || labelText.includes('degree') ||
                labelText.includes('discipline') || labelText.includes('location')) {
                continue;
            }

            // 1. Check if we have a direct mapping from the label
            const desiredText = getDesiredDemographicText(labelText, userInfo);

            await container.click({ force: true });
            await page.waitForTimeout(500);

            const menu = page.locator('div[class*="select__menu"], div[class*="-menu"]').last();
            if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
                const options = menu.locator('div[class*="option"]');
                const optCount = await options.count();
                logger.info(`  Menu opened with ${optCount} options`);

                let selected = false;
                
                // 2. Try to select the directly mapped text
                if (desiredText) {
                    for (let i = 0; i < optCount; i++) {
                        const optText = (await options.nth(i).innerText()).trim().toLowerCase();
                        if (optText.includes(desiredText)) {
                            await options.nth(i).click({ force: true });
                            logger.info(`  Selected: "${optText}"`);
                            selected = true;
                            break;
                        }
                    }
                }

                if (!selected && optCount > 0) {
                    const isDemographic = labelText.includes('veteran') || labelText.includes('disability') || labelText.includes('race') || labelText.includes('gender') || labelText.includes('sex') || labelText.includes('ethnicity') || labelText.includes('sponsorship') || labelText.includes('authorized');

                    if (isDemographic) {
                        // Safe fallback for standard demographics
                        const lastOptText = (await options.nth(optCount - 1).innerText()).trim();
                        await options.nth(optCount - 1).click({ force: true });
                        logger.info(`  Fallback selected last option: "${lastOptText}"`);
                    } else {
                        // 3. Complex custom dropdown: Extract text and infer
                        logger.info(`  Unknown dropdown "${labelText}". Extracting options to infer type...`);
                        const optionTexts = [];
                        const lowerOptionTexts = [];
                        for (let i = 0; i < optCount; i++) {
                            const t = await options.nth(i).innerText().then(t => t.trim());
                            optionTexts.push(t);
                            lowerOptionTexts.push(t.toLowerCase());
                        }

                        const inferenceResult = inferDemographicOption(labelText, optionTexts, lowerOptionTexts, userInfo);
                        
                        if (inferenceResult.matched) {
                            await options.nth(inferenceResult.index).click({ force: true });
                            logger.info(`  Directly Selected Onboarding Data: "${optionTexts[inferenceResult.index]}"`);
                        } else {
                            // 4. AI Fallback for completely unknown dropdowns
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
};

module.exports = {
    fillDemographicDropdowns
};
