const prisma = require('../config/db');
const groq = require('../config/groq');
const { generateAICompletion } = require('./ai.service');
const { getEmbedding, rerankJobs } = require('../utils/embeddings');
const logger = require('../utils/logger');

const VECTOR_CANDIDATE_LIMIT = 200;
const RERANK_TOP_N = 20;
const HIGH_SCORE_THRESHOLD = 80;

/**
 * Generates an embedding for a resume's parsed data and runs a
 * cosine similarity search against the Job table (via pgvector).
 *
 * @param {string} profileText - JSON stringified resume parsed data
 * @returns {Array} Top candidate jobs ordered by vector similarity
 */
const findCandidateJobsByVector = async (profileText) => {
    const userEmbedding = await getEmbedding(profileText);
    const vectorString = `[${userEmbedding.join(',')}]`;

    const candidates = await prisma.$queryRaw`
        SELECT id, title, company, description,
               1 - (embedding <=> ${vectorString}::vector) AS similarity
        FROM "Job"
        ORDER BY embedding <=> ${vectorString}::vector
        LIMIT ${VECTOR_CANDIDATE_LIMIT}
    `;
    return candidates;
};

/**
 * Uses Groq LLM to score a candidate-job pair.
 * Returns { score, reason, gap_analysis } or null on failure.
 *
 * @param {string} profileText
 * @param {Object} job - { id, title, company, description }
 */
const scoreJobWithAI = async (profileText, job, retryCount = 0) => {
    const systemPrompt = 'You output only pure JSON.';
    const prompt = `You are an expert technical recruiter. Score how well this candidate fits the job.
Candidate Profile: ${profileText}
Job Description: ${job.description}
Return ONLY a valid JSON object: {"score": <number 1-100>, "reason": "<1 sentence explanation>", "gap_analysis": "<1 sentence explanation>"}`;

    try {
        const responseStr = await generateAICompletion(systemPrompt, prompt, true);
        return JSON.parse(responseStr);
    } catch (err) {
        // If a socket closes due to the long reranker delay, retry once
        if (err.code === 'UND_ERR_SOCKET' && retryCount === 0) {
            logger.warn(`Socket closed on Groq call for job ${job.id}, retrying...`);
            return await scoreJobWithAI(profileText, job, 1);
        }
        logger.error(`Groq scoring failed for job ${job.id}: ${err.message || err.status}`);
        return null;
    }
};

/**
 * Saves a JobMatch record to the database.
 * Skips if a match already exists for (userId, jobId).
 *
 * @returns {Object|null} Created JobMatch or null if skipped/failed
 */
const saveJobMatch = async ({ userId, jobId, fitScore, reason, gapAnalysis }) => {
    try {
        return await prisma.jobMatch.upsert({
            where: {
                userId_jobId: { userId, jobId }
            },
            create: { userId, jobId, fitScore, reason: reason || '', gapAnalysis },
            update: { fitScore, reason: reason || '', gapAnalysis }
        });
    } catch (err) {
        logger.error(`Failed to save/update job match: ${err.message}`);
        throw err;
    }
};

/**
 * Runs the full matching pipeline for a single user's resume:
 *   1. Vector search  →  Top 200 candidates
 *   2. BGE reranking  →  Top 20
 *   3. Groq scoring   →  Save matches
 *
 * @param {Object} resume - Prisma Resume with user relation
 * @returns {{ highScoringCount: number }} Number of matches with score >= HIGH_SCORE_THRESHOLD
 */
const runMatchingPipelineForResume = async (resume) => {
    const profileText = JSON.stringify(resume.parsedData);
    let highScoringCount = 0;

    // Step 1: Vector candidates
    const candidates = await findCandidateJobsByVector(profileText);
    if (candidates.length === 0) {
        logger.info(`No job candidates found for user ${resume.user.email}`);
        return { highScoringCount };
    }

    // Step 2: BGE Reranker
    logger.info(`Reranking ${candidates.length} candidates for ${resume.user.email}...`);
    const rerankedCandidates = await rerankJobs(profileText, candidates);
    const topCandidates = rerankedCandidates.slice(0, RERANK_TOP_N);

    // Step 3: Groq LLM scoring for each top candidate
    logger.info(`Scoring top ${topCandidates.length} jobs with AI for ${resume.user.email}...`);
    for (const job of topCandidates) {
        // Skip if already applied
        const alreadyApplied = await prisma.application.findFirst({
            where: { userId: resume.userId, jobId: job.id }
        });
        if (alreadyApplied) continue;

        const analysis = await scoreJobWithAI(profileText, job);
        if (!analysis) continue;

        const match = await saveJobMatch({
            userId: resume.userId,
            jobId: job.id,
            fitScore: analysis.score,
            reason: analysis.reason,
            gapAnalysis: analysis.gap_analysis
        });

        if (match) {
            logger.info(`Match saved: ${resume.user.email} → ${job.title} at ${job.company} (Score: ${analysis.score})`);
            if (analysis.score >= HIGH_SCORE_THRESHOLD) highScoringCount++;
        }
    }

    return { highScoringCount };
};

module.exports = {
    findCandidateJobsByVector,
    scoreJobWithAI,
    saveJobMatch,
    runMatchingPipelineForResume,
    HIGH_SCORE_THRESHOLD
};
