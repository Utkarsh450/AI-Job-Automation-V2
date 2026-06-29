const groq = require('../config/groq');
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
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You output only pure JSON.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile',
            response_format: { type: 'json_object' }
        });
        return JSON.parse(completion.choices[0].message.content);
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
        const completion = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: 'You are an expert cover letter writer.' },
                { role: 'user', content: prompt }
            ],
            model: 'llama-3.3-70b-versatile'
        });
        return completion.choices[0].message.content.trim();
    } catch (err) {
        logger.error(`Cover letter generation failed: ${err.message}`);
        return null;
    }
};

module.exports = { tailorResume, generateCoverLetter };
