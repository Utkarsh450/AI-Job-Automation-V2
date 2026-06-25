const Groq = require('groq-sdk');
const logger = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

logger.info('Groq SDK initialized and ready to use Llama 3');

module.exports = groq;
