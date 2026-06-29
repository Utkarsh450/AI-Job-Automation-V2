const groq = require('../config/groq');
const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

// Initialize Gemini lazily to allow dynamic env var updates without restarting if needed
let geminiClient = null;
const getGeminiClient = () => {
    if (!geminiClient && process.env.GEMINI_API_KEY) {
        geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }
    return geminiClient;
};

/**
 * Generates an AI completion, falling back to Gemini if Groq throws a rate limit or payload size error.
 * 
 * @param {string} systemPrompt 
 * @param {string} userPrompt 
 * @param {boolean} useJsonMode 
 * @returns {Promise<string>} The AI response content
 */
const generateAICompletion = async (systemPrompt, userPrompt, useJsonMode = true) => {
    try {
        // Attempt Groq first
        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            max_tokens: 2048,
            ...(useJsonMode && { response_format: { type: "json_object" } }),
        });

        return completion.choices[0]?.message?.content || "";
    } catch (error) {
        // Check if error is a Groq rate limit (429) or payload too large (413)
        const isRateLimit = error?.error?.code === 'rate_limit_exceeded' || error?.status === 429;
        const isPayloadTooLarge = error?.status === 413;
        
        if (isRateLimit || isPayloadTooLarge) {
            logger.warn(`Groq limit hit (${error?.status}). Falling back to Gemini...`);
            
            const gemini = getGeminiClient();
            if (!gemini) {
                logger.error('Gemini fallback failed: GEMINI_API_KEY is missing in .env');
                throw error; // Rethrow original error if we can't fallback
            }

            try {
                const response = await gemini.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: userPrompt,
                    config: {
                        systemInstruction: systemPrompt,
                        temperature: 0.1,
                        ...(useJsonMode && { responseMimeType: "application/json" })
                    }
                });
                
                return response.text() || "";
            } catch (geminiError) {
                logger.error(`Gemini fallback also failed: ${geminiError.message}`);
                throw geminiError;
            }
        }
        
        // If it's some other Groq error (like Auth or Network), throw it
        logger.error(`Groq completion failed with unexpected error: ${error.message}`);
        throw error;
    }
};

module.exports = {
    generateAICompletion
};
