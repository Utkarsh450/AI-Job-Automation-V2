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
  
  // Yield to the event loop so background networking (like Cloudinary uploads) doesn't timeout
  await new Promise(resolve => setTimeout(resolve, 5));
  
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
  
  const prisma = require('../config/db');
  
  // Transformers.js text-classification expects (text, text_pair) arguments
  // Process them sequentially to avoid memory overload anyway
  let count = 0;
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
    
    count++;
    
    // Send a keep-alive ping to the database every 10 jobs (roughly every 5-10 seconds)
    // This strictly prevents Neon's pgBouncer from terminating the connection due to idle timeout.
    if (count % 10 === 0) {
        try {
            await prisma.$queryRaw`SELECT 1`;
        } catch (e) {
            // Ignore keep-alive errors, let Prisma handle reconnections naturally if needed
        }
    }

    // Yield to the Node.js event loop after EVERY job to prevent socket timeouts
    // and keep-alive drops during the processing time. 
    await new Promise(resolve => setTimeout(resolve, 5));
  }

  // Sort descending by rerankScore
  return scoredJobs.sort((a, b) => b.rerankScore - a.rerankScore);
}

module.exports = { getEmbedding, rerankJobs };
