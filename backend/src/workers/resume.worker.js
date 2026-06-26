const inngest = require('../config/inngest');
const prisma = require('../config/db');
const logger = require('../utils/logger');
const {
    extractTextFromUrl,
    parseResumeWithAI,
    saveParsedData
} = require('../services/resume.service');

/**
 * Inngest worker: ai-resume-parser
 * Listens for `app/resume.uploaded`, parses the resume with AI, and saves the result.
 *
 * Step design note:
 *   Download + text extraction are combined into ONE step intentionally.
 *   Inngest serializes step results to JSON between steps, which corrupts
 *   Node.js Buffer objects. Keeping them together avoids that issue.
 */
const resumeWorker = inngest.createFunction(
    { 
        id: 'ai-resume-parser', 
        name: 'AI Resume Parser', 
        triggers: [{ event: 'app/resume.uploaded' }] 
    },
    async ({ event, step }) => {
        const { resumeId, s3Url, userId, rawText } = event.data;
        logger.info(`Resume parser triggered — resumeId: ${resumeId}, userId: ${userId}`);

        if (!rawText) {
            throw new Error("No raw text provided to the resume parser worker.");
        }

        // Step 2: Parse extracted text with AI
        const parsedData = await step.run('Parse Resume with AI', async () => {
            return await parseResumeWithAI(rawText);
        });

        // Step 3: Persist parsed data to database
        await step.run('Save Parsed Data', async () => {
            await saveParsedData(resumeId, parsedData);
            logger.info(`Resume ${resumeId} parsed and saved successfully.`);
        });

        // Step 4: Trigger job scraper which will subsequently trigger matcher
        await step.sendEvent('Trigger Job Scraper', {
            name: 'app/jobs.scrape',
            data: { userId }
        });

        return { success: true, resumeId };
    }
);

module.exports = { resumeWorker };
