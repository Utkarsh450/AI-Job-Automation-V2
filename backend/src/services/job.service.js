const prisma = require('../config/db');
const { getEmbedding } = require('../utils/embeddings');
const logger = require('../utils/logger');
const { scrapeGreenhouse } = require('./scrapers/greenhouse.scraper');
const { scrapeWorkday } = require('./scrapers/workday.scraper');

/** Centralized configuration for all target companies */
const TARGET_COMPANIES = [
    { name: 'discord', ats: 'greenhouse' },
    { name: 'figma', ats: 'greenhouse' },
    { 
        name: 'nvidia', 
        ats: 'workday',
        apiUrl: 'https://nvidia.wd5.myworkdayjobs.com/wday/cxs/nvidia/NVIDIAExternalCareerSite/jobs',
        siteUrl: 'https://nvidia.wd5.myworkdayjobs.com/NVIDIAExternalCareerSite'
    }
];

/**
 * Strips HTML tags and trims to a safe length for embedding/storage.
 */
const cleanHtmlDescription = (html = '', maxLength = 2000) =>
    html.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().substring(0, maxLength);

/**
 * Inserts a single job with its vector embedding.
 * Skips if the job URL already exists (idempotent).
 * Uses raw SQL for pgvector INSERT.
 *
 * @returns {boolean} true if inserted, false if skipped
 */
const insertJobWithEmbedding = async (job) => {
    // Idempotency check
    const exists = await prisma.job.findFirst({ where: { url: job.url } });
    if (exists) return false;

    const cleanDescription = cleanHtmlDescription(job.descriptionHtml);
    const embeddingArray = await getEmbedding(`${job.title} ${job.location || ''} ${cleanDescription}`);
    const embeddingVector = `[${embeddingArray.join(',')}]`;

    await prisma.$executeRaw`
        INSERT INTO "Job" (id, title, company, location, description, url, "atsPlatform", embedding, "createdAt")
        VALUES (
            gen_random_uuid(),
            ${job.title},
            ${job.company},
            ${job.location},
            ${job.descriptionHtml},
            ${job.url},
            ${job.atsPlatform},
            ${embeddingVector}::vector,
            NOW()
        )
    `;
    return true;
};

/**
 * Scrapes all TARGET_COMPANIES using their specific ATS scraper.
 * Returns a summary: { company, inserted, skipped } for each.
 */
const scrapeAllBoards = async () => {
    const results = [];
    for (const company of TARGET_COMPANIES) {
        let inserted = 0;
        let skipped = 0;
        let jobs = [];

        // Route to the correct scraper
        if (company.ats === 'greenhouse') {
            jobs = await scrapeGreenhouse(company.name);
        } else if (company.ats === 'workday') {
            jobs = await scrapeWorkday(company);
        } else {
            logger.warn(`Unsupported ATS platform for company: ${company.name}`);
            continue;
        }

        for (const job of jobs) {
            try {
                const wasInserted = await insertJobWithEmbedding(job);
                if (wasInserted) inserted++;
                else skipped++;
            } catch (err) {
                logger.error(`Error inserting job "${job.title}" from ${company.name}: ${err.message}`);
                skipped++;
            }
        }
        logger.info(`Scraped ${company.name} (${company.ats}): ${inserted} new, ${skipped} skipped.`);
        results.push({ company: company.name, inserted, skipped });
    }
    return results;
};

module.exports = {
    TARGET_COMPANIES,
    scrapeAllBoards,
    insertJobWithEmbedding,
    cleanHtmlDescription
};
