const inngest = require('../config/inngest');
const prisma = require('../config/db');
const logger = require('../utils/logger');
const { generatePdfFromResume } = require('../services/pdf.service');
const { applyToGreenhouse } = require('../automation/greenhouse');

/**
 * Worker that handles the automated submission of applications using Playwright.
 */
const submitWorker = inngest.createFunction(
    { 
        id: 'submit-application',
        name: 'Submit Application Worker',
        concurrency: {
            limit: 1 // Only run 1 browser automation at a time to prevent crashing your PC!
        },
        triggers: [{ event: 'app/application.submit' }]
    },
    async ({ event, step }) => {
        const { applicationId, userId } = event.data;
        logger.info(`Starting Submission Worker for Application ID: ${applicationId}`);

        // 1. Fetch Application and User info
        const appData = await step.run('fetch-application-data', async () => {
            return await prisma.application.findUnique({
                where: { id: applicationId },
                include: {
                    user: {
                        include: {
                            preferences: true
                        }
                    },
                    job: true
                }
            });
        });

        if (!appData) {
            throw new Error(`Application ${applicationId} not found.`);
        }

        // 2. Extract tailored resume
        if (!appData.tailoredResumeId) {
            throw new Error('tailoredResumeId is missing. Cannot submit.');
        }

        const tailoredResumeRecord = await step.run('fetch-tailored-resume', async () => {
            return await prisma.resume.findUnique({
                where: { id: appData.tailoredResumeId }
            });
        });

        if (!tailoredResumeRecord || !tailoredResumeRecord.parsedData) {
            throw new Error('Tailored resume data is missing.');
        }
        
        const tailoredResume = tailoredResumeRecord.parsedData;

        // 3. Generate ATS-friendly PDF Resume
        let pdfBase64;
        try {
            pdfBase64 = await step.run('generate-resume-pdf', async () => {
                const buffer = await generatePdfFromResume(tailoredResume);
                // Convert buffer to base64 to store in step state
                return buffer.toString('base64');
            });
        } catch (error) {
            await prisma.application.update({
                where: { id: applicationId },
                data: { status: 'FAILED' }
            });
            throw new Error(`Failed to generate PDF: ${error.message}`);
        }

        const actualPdfBuffer = Buffer.from(pdfBase64, 'base64');

        // 4. Prepare User Info
        // Note: In a production app, we would parse user's profile or tailoredResume.personal_info
        const nameParts = (appData.user.name || tailoredResume.personal_info?.name || '').split(' ').filter(Boolean);
        const userInfo = {
            firstName: nameParts[0] || 'Applicant',
            lastName: nameParts.slice(1).join(' ') || 'Name',
            email: appData.user.email || tailoredResume.personal_info?.email,
            phone: tailoredResume.personal_info?.phone || appData.user.phone || '+12345678901',
            location: tailoredResume.personal_info?.location || appData.user.location,
            linkedin: appData.user.linkedinUrl || tailoredResume.personal_info?.linkedin,
            github: appData.user.githubUrl || tailoredResume.personal_info?.github,
            portfolio: appData.user.portfolioUrl || tailoredResume.personal_info?.portfolio,
            education: tailoredResume.education || [],
            demographics: {
                gender: appData.user.preferences?.gender || 'Decline',
                race: appData.user.preferences?.race || 'Decline',
                veteranStatus: appData.user.preferences?.veteranStatus || 'I am not a protected veteran',
                disabilityStatus: appData.user.preferences?.disabilityStatus || 'No'
            },
            preferences: appData.user.preferences || {}
        };

        // 5. Automate Submission based on platform
        // Determine platform from job URL
        const jobUrl = appData.job.url.toLowerCase();
        let submissionResult;

        try {
            submissionResult = await step.run('execute-headless-automation', async () => {
                if (jobUrl.includes('greenhouse.io')) {
                    return await applyToGreenhouse(appData.job.url, userInfo, actualPdfBuffer, tailoredResume, userId);
                } else if (jobUrl.includes('myworkdayjobs.com')) {
                    const { applyToWorkday } = require('../automation/workday');
                    return await applyToWorkday(appData.job.url, userInfo, actualPdfBuffer, tailoredResume, userId);
                } else {
                    // Fallback or unsupported platform
                    throw new Error(`Unsupported ATS platform for URL: ${jobUrl}`);
                }
            });
        } catch (error) {
            await prisma.application.update({
                where: { id: applicationId },
                data: { status: 'FAILED' }
            });
            throw new Error(`Automation execution failed: ${error.message}`);
        }

        // 6. Update Database Status
        if (submissionResult.success) {
            await step.run('update-application-success', async () => {
                await prisma.application.update({
                    where: { id: applicationId },
                    data: { status: 'APPLIED' }
                });

                // Send internal inbox notification
                await prisma.email.create({
                    data: {
                        userId: userId,
                        fromName: 'Tsenta Agent',
                        fromEmail: 'agent@tsenta.com',
                        subject: `✅ Application Submitted: ${appData.job.title} at ${appData.job.company}`,
                        bodyText: `Good news ${userInfo.firstName}!\n\nYour application for ${appData.job.title} at ${appData.job.company} has been successfully submitted by Tsenta.\n\nYou can track its progress in your dashboard.\n\nBest,\nTsenta AI`,
                        bodyHtml: `<p>Good news ${userInfo.firstName}!</p><p>Your application for <strong>${appData.job.title}</strong> at <strong>${appData.job.company}</strong> has been successfully submitted by Tsenta.</p><p>You can track its progress in your dashboard.</p><p>Best,<br/>Tsenta AI</p>`
                    }
                });
            });
            logger.info(`Successfully submitted application ${applicationId}`);
        } else {
            await step.run('update-application-failure', async () => {
                await prisma.application.update({
                    where: { id: applicationId },
                    data: { status: 'FAILED' }
                });
            });
            throw new Error(`Submission failed: ${submissionResult.error}`);
        }

        return { success: true, applicationId };
    }
);

module.exports = {
    submitWorker
};
