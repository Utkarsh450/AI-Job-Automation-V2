const inngest = require('../config/inngest');
const prisma = require('../config/db');
const logger = require('../utils/logger');

const cleanupStaleJobsWorker = inngest.createFunction(
  { 
    id: "cleanup-stale-jobs",
    triggers: [{ cron: "0 0 * * *" }]
  },
  async ({ step }) => {
    logger.info("Starting stale jobs cleanup...");

    const fortyFiveDaysAgo = new Date();
    fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

    const result = await step.run("Delete jobs older than 45 days", async () => {
        const deleted = await prisma.job.deleteMany({
            where: {
                createdAt: {
                    lt: fortyFiveDaysAgo
                }
            }
        });
        return deleted;
    });

    logger.info(`Cleanup complete: Deleted ${result.count} stale jobs.`);
    return result;
  }
);

module.exports = { cleanupStaleJobsWorker };
