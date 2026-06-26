const https = require('https');
const http = require('http');
const pdfParse = require('pdf-parse');
const groq = require('../config/groq');
const cloudinary = require('../config/cloudinary');
const prisma = require('../config/db');
const logger = require('../utils/logger');

/**
 * Downloads a PDF from a URL (supports http and https) and returns a Buffer.
 * Handles redirects transparently.
 */
const downloadPdfBuffer = (url) => {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (res) => {
            // Follow redirects (301, 302, 307, 308)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadPdfBuffer(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download PDF — HTTP ${res.statusCode}`));
            }
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
};

/**
 * Extracts raw text from a PDF Buffer directly in memory.
 */
const extractTextFromBuffer = async (buffer) => {
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
};

/**
 * Downloads a PDF from the given URL and extracts its raw text.
 * Combines download + parse into one operation to avoid Inngest Buffer serialization issues.
 * (Inngest serializes step results to JSON, which corrupts Buffer objects.)
 */
const extractTextFromUrl = async (url) => {
    const buffer = await downloadPdfBuffer(url);
    const pdfData = await pdfParse(buffer);
    return pdfData.text;
};

/**
 * Sends raw resume text to Groq (Llama 3.3 70B) and returns structured JSON.
 */
const parseResumeWithAI = async (rawText) => {
    logger.info('Sending resume text to Groq for AI parsing...');
    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: 'system',
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
                role: 'user',
                content: rawText
            }
        ],
        model: 'llama-3.3-70b-versatile',
        response_format: { type: 'json_object' }
    });

    return JSON.parse(completion.choices[0].message.content);
};

/**
 * Saves parsed resume data back to the database.
 */
const saveParsedData = async (resumeId, parsedData) => {
    return prisma.resume.update({
        where: { id: resumeId },
        data: { parsedData }
    });
};

/**
 * Uploads a PDF buffer to Cloudinary and returns the secure URL.
 */
const uploadToCloudinary = (fileBuffer, originalName) => {
    return new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'image',
                folder: 'resumes',
                public_id: `resume_${Date.now()}_${originalName?.replace(/\s+/g, '_') || 'upload'}`
            },
            (error, result) => {
                if (error) reject(error);
                else resolve(result);
            }
        );
        stream.end(fileBuffer);
    });
};

module.exports = {
    downloadPdfBuffer,
    extractTextFromUrl,
    extractTextFromBuffer,
    parseResumeWithAI,
    saveParsedData,
    uploadToCloudinary
};
