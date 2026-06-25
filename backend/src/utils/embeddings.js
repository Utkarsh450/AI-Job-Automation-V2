const { pipeline } = require('@xenova/transformers');
const logger = require('./logger');

let extractor = null;
let reranker = null;

async function getEmbedding(text) {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', 'Xenova/bge-m3', {
      quantized: true 
    });
  }
  
  const output = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

// BGE Cross-Encoder Reranker
async function rerankJobs(profileText, jobs) {
  if (!reranker) {
    reranker = await pipeline('text-classification', 'Xenova/bge-reranker-base', {
      quantized: true
    });
  }
  
  const scoredJobs = [];
  
  // Transformers.js text-classification expects (text, text_pair) arguments
  // Process them sequentially to avoid memory overload anyway
  for (const job of jobs) {
    try {
        const safeDescription = job.description || job.title || "";
        const result = await reranker(profileText.substring(0, 500), safeDescription.substring(0, 1000));
        // text-classification outputs an array of { label, score }
        const scoreObj = Array.isArray(result) ? result[0] : result;
        scoredJobs.push({
            ...job,
            rerankScore: scoreObj?.score || 0
        });
    } catch (err) {
        logger.error(`Error reranking job ${job.id}: ${err.message}`);
        scoredJobs.push({ ...job, rerankScore: 0 });
    }
  }

  // Sort descending by rerankScore
  return scoredJobs.sort((a, b) => b.rerankScore - a.rerankScore);
}

module.exports = { getEmbedding, rerankJobs };
