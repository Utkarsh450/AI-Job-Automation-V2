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
    { id: 'ai-resume-parser', name: 'AI Resume Parser', event: 'app/resume.uploaded' },
    async ({ event, step }) => {
        const { resumeId, s3Url, userId } = event.data;
        logger.info(`Resume parser triggered — resumeId: ${resumeId}, userId: ${userId}`);

        // Step 1: Download PDF and extract text (combined to avoid Buffer serialization issues)
        const rawText = await step.run('Download and Extract Text', async () => {
            const text = await extractTextFromUrl(s3Url);
            if (!text || text.trim() === '') {
                throw new Error('Could not extract text from the PDF — it may be image-based or corrupted.');
            }
            return text;
        });

        // Step 2: Parse extracted text with AI
        const parsedData = await step.run('Parse Resume with AI', async () => {
            return await parseResumeWithAI(rawText);
        });

        // Step 3: Persist parsed data to database
        await step.run('Save Parsed Data', async () => {
            await saveParsedData(resumeId, parsedData);
            logger.info(`Resume ${resumeId} parsed and saved successfully.`);
        });

        // Step 4: Trigger job matcher for this user
        await step.sendEvent('Trigger Job Matcher', {
            name: 'app/matches.evaluate',
            data: { userId }
        });

        return { success: true, resumeId };
    }
);

module.exports = { resumeWorker };
