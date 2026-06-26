
const prisma = require('../config/db');
const { getEmbedding } = require('../utils/embeddings');
const logger = require('../utils/logger');

/** Boards to scrape from Greenhouse public API */
const TARGET_BOARDS = ['discord', 'figma'];

/**
 * Strips HTML tags and trims to a safe length for embedding/storage.
 */
const cleanHtmlDescription = (html = '', maxLength = 2000) =>
    html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().substring(0, maxLength);

/**
 * Fetches all jobs from a single Greenhouse board.
 * Returns an empty array on failure (non-fatal per board).
 */
const fetchGreenhouseJobs = async (board) => {
    try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
        if (!res.ok) {
            logger.warn(`Greenhouse API returned ${res.status} for board: ${board}`);
            return [];
        }
        const data = await res.json();
        return data.jobs || [];
    } catch (err) {
        logger.error(`Failed to fetch Greenhouse board "${board}": ${err.message}`);
        return [];
    }
};

/**
 * Inserts a single job with its vector embedding.
 * Skips if the job URL already exists (idempotent).
 * Uses raw SQL for pgvector INSERT (Prisma ORM doesn't support vector writes natively).
 *
 * @returns {boolean} true if inserted, false if skipped
 */
const insertJobWithEmbedding = async (job, board) => {
    // Idempotency check
    const exists = await prisma.job.findFirst({ where: { url: job.absolute_url } });
    if (exists) return false;

    const cleanDescription = cleanHtmlDescription(job.content);
    const embeddingArray = await getEmbedding(`${job.title} ${job.location?.name || ''} ${cleanDescription}`);
    const embeddingVector = `[${embeddingArray.join(',')}]`;

    await prisma.$executeRaw`
        INSERT INTO "Job" (id, title, company, location, description, url, "atsPlatform", embedding, "createdAt")
        VALUES (
            gen_random_uuid(),
            ${job.title},
            ${board},
            ${job.location?.name || 'Remote'},
            ${cleanDescription},
            ${job.absolute_url},
            'greenhouse',
            ${embeddingVector}::vector,
            NOW()
        )
    `;
    return true;
};

/**
 * Scrapes all TARGET_BOARDS and inserts new jobs.
 * Returns a summary: { board, inserted, skipped } for each board.
 */
const scrapeAllBoards = async () => {
    const results = [];
    for (const board of TARGET_BOARDS) {
        let inserted = 0;
        let skipped = 0;
        const jobs = await fetchGreenhouseJobs(board);
        for (const job of jobs) {
            try {
                const wasInserted = await insertJobWithEmbedding(job, board);
                if (wasInserted) inserted++;
                else skipped++;
            } catch (err) {
                logger.error(`Error inserting job "${job.title}" from ${board}: ${err.message}`);
                skipped++;
            }
        }
        logger.info(`Scraped ${board}: ${inserted} new, ${skipped} skipped.`);
        results.push({ board, inserted, skipped });
    }
    return results;
};

module.exports = {
    TARGET_BOARDS,
    scrapeAllBoards,
    fetchGreenhouseJobs,
    insertJobWithEmbedding,
    cleanHtmlDescription
};
