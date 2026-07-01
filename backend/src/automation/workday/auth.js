const logger = require('../../utils/logger');

// We use a universal password for all automated Workday accounts created by the bot.
const UNIVERSAL_PASSWORD = 'TsentaAutomation!2026';

const handleAuth = async (page, userInfo) => {
    logger.info('Handling Workday Authentication...');

    const emailSelector = 'input[type="email"], input[id*="username"], input[id*="email"], input[data-automation-id="email"], input[data-automation-id="userName"], input[data-automation-id="username"], input[data-automation-id="emailAddress"]';

    // Wait for either the email input OR the SSO modal to appear
    await page.waitForSelector(`${emailSelector}, button:has-text("Sign in with email"), button:has-text("Sign in with Google")`, { state: 'visible', timeout: 15000 });

    // 1. If SSO Modal is visible, we MUST click "Sign in with email"
    const signInWithEmailBtn = page.locator('button:has-text("Sign in with email"), a:has-text("Sign in with email")');
    const isModalThere = await signInWithEmailBtn.first().waitFor({ state: 'visible', timeout: 4000 }).then(() => true).catch(() => false);
    
    if (isModalThere) {
        logger.info('Found SSO modal! Clicking "Sign in with email"...');
        await signInWithEmailBtn.first().click({ force: true });
        await page.waitForTimeout(2000); // give the modal time to disappear
    }

    // 2. Wait for actual email field to appear
    await page.waitForSelector(emailSelector, { state: 'visible', timeout: 15000 });

    const emailInput = page.locator(emailSelector).first();
    await emailInput.fill(userInfo.email);

    const passwordInput = page.locator('input[type="password"]').first();
    
    // Sometimes email is on screen 1, and password on screen 2
    if (!(await passwordInput.isVisible().catch(() => false))) {
        const nextBtn = page.locator('button:has-text("Next"), button:has-text("Continue")');
        if (await nextBtn.isVisible()) {
            await nextBtn.click();
            await page.waitForTimeout(2000);
        }
    }

    const createAccountBtn = page.locator('a:has-text("Create Account"), button:has-text("Create Account"), [data-automation-id="createAccountLink"]');
    const verifyPasswordInput = page.locator('input[type="password"]').nth(1);

    // If we are NOT already on the Create Account form (where verify password exists)
    if (!(await verifyPasswordInput.isVisible().catch(() => false))) {
        if (await passwordInput.isVisible().catch(() => false)) {
            logger.info('Password field found. Attempting login...');
            await passwordInput.fill(UNIVERSAL_PASSWORD);
            const loginBtn = page.locator('[data-automation-id="signInSubmitButton"], button:has-text("Sign In"), button[type="submit"]').last();
            await loginBtn.click({ force: true });
            
            // Wait to see if login succeeds or fails
            await page.waitForTimeout(3000);

            // If we are still on the login page (Sign in button or password input is still visible), it means login failed
            const signInBtn = page.locator('[data-automation-id="signInSubmitButton"], button:has-text("Sign In")');
            if (await signInBtn.isVisible().catch(() => false) || await passwordInput.isVisible().catch(() => false)) {
                logger.warn('Login failed (still on login screen). Clicking Create Account text...');
                if (await createAccountBtn.first().isVisible()) {
                    await createAccountBtn.first().click({ force: true });
                } else {
                    throw new Error('Login failed and Create Account option not found.');
                }
            }
        } else if (await createAccountBtn.first().isVisible()) {
            logger.info('Directly found Create Account button, clicking it...');
            await createAccountBtn.first().click();
        }
    }

    // 3. Wait for EITHER the verify password field OR the SSO button to appear (since page loads can be slow)
    logger.info('Waiting for Create Account screen or SSO screen...');
    const createOrSSO = await Promise.race([
        verifyPasswordInput.waitFor({ state: 'visible', timeout: 15000 }).then(() => 'create'),
        page.locator('button:has-text("Sign in with email"), a:has-text("Sign in with email")').first().waitFor({ state: 'visible', timeout: 15000 }).then(() => 'sso')
    ]).catch(() => 'timeout');

    if (createOrSSO === 'sso') {
        logger.info('Create Account page showed SSO options again! Clicking "Sign in with email"...');
        const ssoBtnAgain = page.locator('button:has-text("Sign in with email"), a:has-text("Sign in with email")');
        await ssoBtnAgain.first().click({ force: true });
        await page.waitForTimeout(2000);
    }

    // Wait for the verify password field.
    const isCreateScreen = await verifyPasswordInput.waitFor({ state: 'visible', timeout: 10000 }).then(() => true).catch(() => false);

    if (isCreateScreen) {
        logger.info('Filling out Create Account form...');
        
        // Refill email if it got cleared
        const newEmailInput = page.locator(emailSelector).first();
        if (await newEmailInput.isVisible()) {
            const currentVal = await newEmailInput.inputValue();
            if (!currentVal) await newEmailInput.fill(userInfo.email);
        }

        const pwd1 = page.locator('input[type="password"]').nth(0);
        await pwd1.fill(UNIVERSAL_PASSWORD);
        await verifyPasswordInput.fill(UNIVERSAL_PASSWORD);

        // Click T&C checkbox
        const checkbox = page.locator('input[type="checkbox"]').last();
        if (await checkbox.isVisible().catch(() => false)) {
            try {
                // Use evaluate to avoid any scrolling actionability issues
                await checkbox.evaluate(node => {
                    node.scrollIntoView();
                    node.click();
                }).catch(() => {});
                
                // Fallback click on parent if it didn't check
                const isChecked = await checkbox.isChecked().catch(() => true);
                if (!isChecked) {
                    const parent = checkbox.locator('..');
                    await parent.click({ force: true, timeout: 2000 });
                }
            } catch (err) {
                await checkbox.click({ force: true }).catch(() => {});
            }
        }

        const submitBtn = page.locator('button:has-text("Create Account"), [data-automation-id="createAccountSubmitButton"]').last();
        await submitBtn.click({ force: true });
        await page.waitForTimeout(4000);
    }

    // 4. Wait for auth to complete and move to the next screen
    logger.info('Checking if auth was successful...');
    await Promise.race([
        page.waitForSelector('[data-automation-id="autofillWithResume"], [data-automation-id="resumeDropZone"], h2:has-text("My Information")', { state: 'visible', timeout: 15000 }),
        page.waitForNavigation({ waitUntil: 'networkidle', timeout: 15000 })
    ]).catch(() => {
        logger.warn('Timeout waiting for next screen after auth, proceeding anyway...');
    });
};

module.exports = {
    handleAuth
};
