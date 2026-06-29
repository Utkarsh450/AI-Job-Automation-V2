const { generateAICompletion } = require('./ai.service');
const logger = require('../utils/logger');

/**
 * Customizes the resume JSON using Groq based on the optimization level.
 * 
 * @param {Object} parsedData - Original resume JSON
 * @param {Object} job - The job description and title
 * @param {string} optimizationLevel - "Off", "Optimized", "Aggressive"
 * @returns {Object} Tailored resume JSON
 */
const tailorResume = async (parsedData, job, optimizationLevel) => {
    if (optimizationLevel === 'Off') {
        return parsedData; // No changes
    }

    const isAggressive = optimizationLevel === 'Aggressive';
    const instructions = isAggressive
        ? `You are an expert resume writer. Perform a FULL restructure of this resume JSON for the given job.
           - Reorder experience and projects to highlight the most relevant ones first.
           - Completely rewrite bullet points to heavily emphasize skills and keywords from the Job Description.
           - Add or remove content aggressively to make the candidate look like the perfect fit, but maintain realism.
           - Do not invent fake degrees or entirely fake companies.`
        : `You are a resume reviewer. Perform a light optimization of this resume JSON for the given job.
           - Keep the structure identical.
           - Rewrite the bullet points subtly to include keywords from the Job Description.
           - Do not make massive structural changes.`;

    const prompt = `${instructions}
    
Job Title: ${job.title}
Job Description:
${job.description}

Original Resume JSON:
${JSON.stringify(parsedData)}

Return ONLY a valid JSON object matching the exact structure of the Original Resume JSON.`;

    try {
        const responseStr = await generateAICompletion('You output only pure JSON.', prompt, true);
        return JSON.parse(responseStr);
    } catch (err) {
        logger.error(`Resume tailoring failed: ${err.message}`);
        return parsedData; // Fallback to original
    }
};

/**
 * Generates a targeted cover letter using Groq.
 * 
 * @param {Object} parsedData - Original resume JSON
 * @param {Object} job - The job description, title, company
 * @param {string} coverLetterOpt - "Off", "Optimized", "Aggressive"
 * @returns {string|null} The generated cover letter string, or null
 */
const generateCoverLetter = async (parsedData, job, coverLetterOpt) => {
    if (coverLetterOpt === 'Off') {
        return null;
    }

    const isAggressive = coverLetterOpt === 'Aggressive';
    const instructions = isAggressive
        ? `Write a highly persuasive, passionate, and aggressive cover letter for this candidate applying to ${job.company} for the ${job.title} role.
           - Directly address the company's presumed goals based on the JD.
           - Connect the candidate's past projects very strongly to the job requirements.
           - Make a bold, confident pitch. Do not be overly formal or boring.
           - Output purely the cover letter text, no markdown.`
        : `Write a standard, professional cover letter for this candidate applying to ${job.company} for the ${job.title} role.
           - Introduce the candidate and highlight their top skills.
           - Maintain a polite, standard, professional tone.
           - Output purely the cover letter text, no markdown.`;

    const prompt = `${instructions}

Job Description:
${job.description}

Candidate Profile:
${JSON.stringify(parsedData)}`;

    try {
        const responseStr = await generateAICompletion('You are an expert cover letter writer.', prompt, false);
        return responseStr.trim();
    } catch (err) {
        logger.error(`Cover letter generation failed: ${err.message}`);
        return null;
    }
};

/**
 * Generates an answer to a custom form question using Groq (Llama-3).
 * 
 * @param {string} question - The custom question from the job application form
 * @param {Object} resumeJson - The user's parsed resume JSON
 * @returns {string} The concise generated answer
 */
const generateFormAnswer = async (question, resumeJson) => {
    const prompt = `You are filling out a job application on behalf of a candidate. 
You must answer the following question as the candidate.
Keep your answer highly professional, extremely concise (1-2 sentences unless asked for more), and strictly factual based on the resume.

Question from form: "${question}"

Candidate Resume:
${JSON.stringify(resumeJson, null, 2)}

Output ONLY the answer text that should be typed into the form input box. No markdown, no quotation marks, no preamble.`;

    try {
        const responseStr = await generateAICompletion('You are an expert at answering job application questions.', prompt, false);
        return responseStr.trim();
    } catch (err) {
        logger.error(`Form answering failed: ${err.message}`);
        return "Please refer to my resume."; // Fallback
    }
};

module.exports = { tailorResume, generateCoverLetter, generateFormAnswer };
