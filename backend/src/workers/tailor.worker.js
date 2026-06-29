const inngest = require('../config/inngest');
const prisma = require('../config/db');
const logger = require('../utils/logger');
const { tailorResume, generateCoverLetter } = require('../services/tailor.service');

/**
 * Inngest worker: ai-application-tailor
 * Triggered when an application is queued for tailoring.
 */
const tailorWorker = inngest.createFunction(
    {
        id: 'ai-application-tailor',
        name: 'AI Application Tailoring Worker',
        triggers: [{ event: 'app/application.tailor' }]
    },
    async ({ event, step }) => {
        const { applicationId } = event.data;
        logger.info(`Tailoring worker triggered for application ${applicationId}`);

        // Fetch application, job, user preferences, and primary resume
        const application = await prisma.application.findUnique({
            where: { id: applicationId },
            include: {
                user: {
                    include: {
                        preferences: true,
                        resumes: {
                            where: { isPrimary: true }
                        }
                    }
                },
                job: true
            }
        });

        if (!application) throw new Error(`Application ${applicationId} not found`);
        const primaryResume = application.user.resumes[0];
        if (!primaryResume || !primaryResume.parsedData) throw new Error(`Primary resume not found for user ${application.userId}`);

        const prefs = application.user.preferences;
        const resumeOpt = prefs?.resumeOptimization || 'Honest';
        const coverOpt = prefs?.coverLetterOpt || 'Off';

        // Step 1: Tailor the Resume
        let finalTailoredResumeId = null;
        if (resumeOpt !== 'Off') {
            const tailoredData = await step.run('Tailor Resume JSON', async () => {
                return await tailorResume(primaryResume.parsedData, application.job, resumeOpt);
            });

            // Create a new tailored resume record
            const newResume = await step.run('Save Tailored Resume', async () => {
                return await prisma.resume.create({
                    data: {
                        userId: application.userId,
                        parsedData: tailoredData,
                        isPrimary: false
                    }
                });
            });
            finalTailoredResumeId = newResume.id;
        } else {
            // If Off, just use the primary resume
            finalTailoredResumeId = primaryResume.id;
        }

        // Step 2: Generate Cover Letter
        let finalCoverLetter = null;
        if (coverOpt !== 'Off') {
            finalCoverLetter = await step.run('Generate Cover Letter', async () => {
                return await generateCoverLetter(primaryResume.parsedData, application.job, coverOpt);
            });
        }

        // Step 3: Update Application Record
        await step.run('Update Application', async () => {
            await prisma.application.update({
                where: { id: applicationId },
                data: {
                    tailoredResumeId: finalTailoredResumeId,
                    tailoredCoverLetter: finalCoverLetter,
                    status: 'READY_TO_APPLY' // Or trigger the bot next
                }
            });
        });

        // Trigger next phase (Auto-Applier bot) if autoApprove is true
        if (prefs?.autoApprove) {
            await step.sendEvent('Trigger Bot Submitter', {
                name: 'app/application.submit',
                data: { applicationId }
            });
        }

        return { success: true, applicationId };
    }
);

module.exports = { tailorWorker };
