const inngest = require('../config/inngest');
const prisma = require('../config/db');
const logger = require('../utils/logger');
const { runMatchingPipelineForResume, HIGH_SCORE_THRESHOLD } = require('../services/matcher.service');

/**
 * Inngest worker: ai-job-matcher
 * Triggered after a scrape cycle completes OR after a user uploads a resume.
 * Delegates all matching logic to matcher.service.js.
 */
const matcherWorker = inngest.createFunction(
    {
        id: 'ai-job-matcher',
        name: 'AI Job Matcher',
        triggers: [
            { event: 'app/scrape.completed' }, // Re-evaluate all users after new jobs arrive
            { event: 'app/matches.evaluate' }  // Evaluate a specific user after resume parse
        ]
    },
    async ({ event, step }) => {
        logger.info('AI Job Matcher triggered.');

        // If triggered by a specific user upload, only match for them; otherwise match all
        const resumeFilter = event?.data?.userId ? { userId: event.data.userId } : {};

        const resumes = await prisma.resume.findMany({
            where: { ...resumeFilter, parsedData: { not: null } },
            include: { user: true }
        });

        logger.info(`Running matcher for ${resumes.length} resume(s)...`);

        for (const resume of resumes) {
            await step.run(`Match jobs for ${resume.user.email}`, async () => {
                const { highScoringCount } = await runMatchingPipelineForResume(resume);

                // Fire email notification if high-scoring matches were found
                if (highScoringCount > 0) {
                    await inngest.send({
                        name: 'app/matches.found',
                        data: { email: resume.user.email, count: highScoringCount }
                    });
                }
            });
        }

        return { status: 'success', resumesProcessed: resumes.length };
    }
);

module.exports = { matcherWorker };
