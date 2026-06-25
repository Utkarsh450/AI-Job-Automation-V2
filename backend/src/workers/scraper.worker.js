const inngest = require('../config/inngest');
const prisma = require('../config/db');
const { getEmbedding } = require('../utils/embeddings');
const logger = require('../utils/logger');

// We will scrape these popular companies' public Greenhouse boards
const TARGET_BOARDS = ['discord', 'figma'];

const scraperWorker = inngest.createFunction(
  { 
    id: "greenhouse-scraper",
    triggers: [{ cron: "0 * * * *" }] // Run every hour
  },
  async ({ step }) => {
    logger.info("Starting Greenhouse Scraper Worker...");
    
    for (const board of TARGET_BOARDS) {
        await step.run(`Scrape ${board}`, async () => {
            try {
                const response = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
                if (!response.ok) return;
                const data = await response.json();
                const jobsToProcess = data.jobs || [];

                for (const job of jobsToProcess) {
                    // Check if job already exists to prevent duplicate embedding work
                    const exists = await prisma.job.findFirst({ where: { url: job.absolute_url } });
                    if (exists) continue;

                    // Clean the HTML description to plain text roughly
                    const cleanDescription = (job.content || '').replace(/<[^>]*>?/gm, ' ').substring(0, 2000);
                    
                    // Generate Vector Embedding locally using Transformers.js
                    const embeddingArray = await getEmbedding(`${job.title} ${job.location?.name || ''} ${cleanDescription}`);
                    const embeddingVector = `[${embeddingArray.join(',')}]`;

                    // We must use a raw SQL query to insert pgvector data, as Prisma ORM doesn't natively map vector writes yet
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
                }
                logger.info(`Successfully scraped jobs for ${board}`);
            } catch (err) {
                logger.error(`Error scraping ${board}: ${err.message}`);
            }
        });
    }
    await inngest.send({ name: 'app/scrape.completed' });
    
    return { status: "success", message: "Job discovery cycle completed." };
  }
);

module.exports = { scraperWorker };
