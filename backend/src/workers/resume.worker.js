const inngest = require('../config/inngest');
const prisma = require('../config/db');
const groq = require('../config/groq');
const pdfParse = require('pdf-parse');
const logger = require('../utils/logger');
const https = require('https');

// Helper function to download PDF buffer from Cloudinary URL
const downloadBuffer = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download, status code: ${res.statusCode}`));
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
};

const resumeWorker = inngest.createFunction(
    { id: "ai-resume-parser", event: "app/resume.uploaded" },
    async ({ event, step }) => {
        const { resumeId, s3Url, userId } = event.data;
        logger.info(`Starting AI Resume Parser for resume ${resumeId}...`);

        try {
            // 1. Download PDF from Cloudinary
            const pdfBuffer = await step.run("Download PDF", async () => {
                return await downloadBuffer(s3Url);
            });

            // 2. Extract text using pdf-parse
            const rawText = await step.run("Extract Text", async () => {
                const pdfData = await pdfParse(pdfBuffer);
                return pdfData.text;
            });

            if (!rawText || rawText.trim() === '') {
                throw new Error("Could not extract text from the PDF");
            }

            // 3. Extract JSON using Groq
            const parsedJson = await step.run("Extract JSON with AI", async () => {
                logger.info(`Extracting JSON from resume using Groq for user ${userId}`);
                const completion = await groq.chat.completions.create({
                    messages: [
                        { 
                            role: "system", 
                            content: `You are an expert ATS resume parser. Extract ALL possible information from the raw text. Return ONLY a valid JSON object matching exactly this structure with no markdown wrapping:
{
  "personal_info": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "portfolio": "" },
  "professional_summary": "",
  "skills": ["", ""],
  "experience": [ { "company": "", "role": "", "duration": "", "description": ["bullet 1", "bullet 2"] } ],
  "education": [ { "institution": "", "degree": "", "year": "", "gpa": "" } ],
  "projects": [ { "name": "", "description": "", "technologies": [""] } ],
  "certifications": [""]
}` 
                        },
                        { 
                            role: "user", 
                            content: rawText 
                        }
                    ],
                    model: "llama-3.3-70b-versatile",
                    response_format: { type: "json_object" }
                });

                return JSON.parse(completion.choices[0].message.content);
            });

            // 4. Update Resume in Database
            await step.run("Update Database", async () => {
                await prisma.resume.update({
                    where: { id: resumeId },
                    data: { parsedData: parsedJson }
                });
            });

            logger.info(`Resume parsed successfully for user ${userId}`);

            // 5. Trigger the AI Job Matcher Worker (previously it listened to resume.uploaded directly)
            await step.sendEvent("trigger-matcher", {
                name: "app/matches.evaluate",
                data: { userId }
            });

            return { success: true, resumeId };

        } catch (error) {
            logger.error(`Resume parsing failed for ${resumeId}: ${error.message}`);
            
            // Mark as failed in DB if needed, but for now just throw to Inngest for retries
            throw error;
        }
    }
);

module.exports = { resumeWorker };
