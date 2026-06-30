const logger = require('../../utils/logger');
const { generateFormAnswer } = require('../../services/tailor.service');
const { fillField } = require('./basic-fields');

const fillStandardCustomQuestions = async (page, userInfo, tailoredResume) => {
    logger.info('Filling custom questions...');

    // Handle dropdown selects first (standard and react-selects)
    const selects = await page.$$('select, input[role="combobox"]');
    for (const select of selects) {
        const tagName = await select.evaluate(el => el.tagName.toLowerCase());

        const labelText = await page.evaluate(el => {
            const label = el.closest('.custom_question, .field, .field-wrapper');
            return label ? label.innerText.split('\n')[0].trim().toLowerCase() : '';
        }, select);

        if (!labelText || labelText === 'country' || labelText.includes('country code') || labelText.includes('location') || labelText.includes('school') || labelText.includes('degree') || labelText.includes('discipline')) {
            continue;
        }

        const chooseOption = async (text) => {
            try {
                if (tagName === 'select') {
                    await select.selectOption({ label: text }, { force: true }).catch(() => select.selectOption({ index: 1 }, { force: true }));
                } else {
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
            } catch (e) { }
        };

        if (labelText.includes('sponsorship')) {
            await chooseOption(userInfo.preferences?.requiresVisaSponsorship === true ? 'Yes' : 'No');
        } else if (labelText.includes('authorized')) {
            await chooseOption(userInfo.preferences?.authorizedToWork !== false ? 'Yes' : 'No');
        } else if (labelText.includes('gender') && !labelText.includes('identity')) {
            await chooseOption(userInfo.demographics?.gender || 'Decline');
        } else if (labelText.includes('gender identity') || labelText.includes('lgbtq')) {
            await chooseOption(userInfo.preferences?.lgbtqStatus || 'Decline');
        } else if (labelText.includes('veteran')) {
            await chooseOption(userInfo.demographics?.veteranStatus || 'Decline');
        } else if (labelText.includes('disability')) {
            await chooseOption(userInfo.demographics?.disabilityStatus || 'Decline');
        } else if (labelText.includes('race') || labelText.includes('ethnicity') || labelText.includes('hispanic')) {
            await chooseOption(userInfo.demographics?.race || 'Decline');
        } else if (labelText.includes('located in the us')) {
            await chooseOption(userInfo.preferences?.locatedInUS === false ? 'No' : 'Yes');
        } else if (labelText.includes('bay area')) {
            await chooseOption(userInfo.preferences?.willingToRelocate === true ? 'Yes' : 'No');
        } else {
            await chooseOption('index:1');
        }
    }

    const reactSelectInputs = await page.$$('div[class*="select__control"] input, div[class*="-control"] input');
    for (const input of reactSelectInputs) {
        const isVisible = await input.isVisible();
        if (!isVisible) continue;

        const labelText = await page.evaluate(el => {
            let parent = el.closest('div[class*="select__container"], div[class*="-container"]');
            if (!parent) parent = el.closest('.custom_question, .field, .field-wrapper');
            if (!parent) return '';
            const label = parent.querySelector('label, legend, h3, h4, p, span[class*="label"]');
            return label ? label.innerText.trim().toLowerCase() : '';
        }, input);

        if (labelText.includes('school') || labelText.includes('university') || labelText.includes('college')) {
            const uni = userInfo.preferences?.university || (userInfo.education && userInfo.education.length > 0 ? userInfo.education[0].institution : '');
            if (uni) {
                await input.fill('');
                await input.pressSequentially(uni, { delay: 50 });
                await page.waitForTimeout(2500);
                await input.press('Enter');
            }
        } else if (labelText.includes('degree')) {
            const deg = userInfo.education && userInfo.education.length > 0 ? userInfo.education[0].degree : 'Bachelor';
            if (deg) {
                await input.fill('');
                await input.pressSequentially(deg, { delay: 50 });
                await page.waitForTimeout(1500);
                await input.press('Enter');
            }
        } else if (labelText.includes('discipline') || labelText.includes('major')) {
            const major = userInfo.education && userInfo.education.length > 0 ? userInfo.education[0].fieldOfStudy : 'Computer Science';
            if (major) {
                await input.fill('');
                await input.pressSequentially(major, { delay: 50 });
                await page.waitForTimeout(1500);
                await input.press('Enter');
            }
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
            const ln = userInfo.linkedin;
            const url = ln.startsWith('http') ? ln : `https://${ln}`;
            if (url.includes('.')) await input.fill(url);
        } else if (lowerLabel.includes('github') && userInfo.github && userInfo.github.toLowerCase() !== 'github') {
            const gh = userInfo.github;
            const url = gh.startsWith('http') ? gh : `https://${gh}`;
            if (url.includes('.')) await input.fill(url);
        } else if ((lowerLabel.includes('portfolio') || lowerLabel.includes('website')) && (userInfo.portfolio || userInfo.github || userInfo.linkedin)) {
            const pf = userInfo.portfolio || userInfo.github || userInfo.linkedin;
            if (pf && pf.toLowerCase() !== 'portfolio' && pf.toLowerCase() !== 'website' && pf.toLowerCase() !== 'github' && pf.toLowerCase() !== 'linkedin') {
                const url = pf.startsWith('http') ? pf : `https://${pf}`;
                if (url.includes('.')) await input.fill(url);
            }
        } else if ((lowerLabel.includes('school') || lowerLabel.includes('university') || lowerLabel.includes('college') || lowerLabel.includes('education')) && (userInfo.preferences?.university || (userInfo.education && userInfo.education.length > 0))) {
            const uni = userInfo.preferences?.university || (userInfo.education && userInfo.education.length > 0 ? userInfo.education[0].institution : '');
            if (uni) {
                await input.fill(uni);
            }
        } else if (lowerLabel.includes('degree') && (userInfo.education && userInfo.education.length > 0)) {
            await input.fill(userInfo.education[0].degree || 'Bachelor');
        } else if ((lowerLabel.includes('discipline') || lowerLabel.includes('major')) && (userInfo.education && userInfo.education.length > 0)) {
            await input.fill(userInfo.education[0].fieldOfStudy || 'Computer Science');
        } else if ((lowerLabel.includes('salary') || lowerLabel.includes('compensation') || lowerLabel.includes('pay')) && userInfo.preferences?.targetSalary) {
            await input.fill(userInfo.preferences.targetSalary.toString());
        } else if (lowerLabel.includes('where do you intend to work') || lowerLabel.includes('city and state')) {
            await input.fill(userInfo.location || '');
        } else {
            logger.info(`Generating AI answer for question: "${labelText}"`);
            const answer = await generateFormAnswer(labelText, tailoredResume, userInfo);
            await input.fill(answer);
            logger.info(`AI Answered: ${answer}`);
            await page.waitForTimeout(500);
        }
    }

    // Re-fill First and Last name just in case a React state change wiped them
    await fillField(page, 'input[id*="first_name"], input[name*="first_name"]', userInfo.firstName || 'Applicant');
    await fillField(page, 'input[id*="last_name"], input[name*="last_name"]', userInfo.lastName || 'Name');
};

module.exports = {
    fillStandardCustomQuestions
};
