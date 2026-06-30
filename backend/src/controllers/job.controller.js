const prisma = require('../config/db');
const logger = require('../utils/logger');

// Create a new Job
const createJob = async (req, res) => {
    try {
        const { title, company, description, url } = req.body;

        if (!title || !company) {
            return res.status(400).json({ error: 'Title and Company are required' });
        }

        const newJob = await prisma.job.create({
            data: {
                title,
                company,
                description,
                url,
                status: 'PENDING'
            }
        });

        logger.info(`New job created: ${title} at ${company}`);
        res.status(201).json({ message: 'Job created successfully', job: newJob });

    } catch (error) {
        logger.error(`Error creating job: ${error.message}`);
        res.status(500).json({ error: 'Failed to create job' });
    }
};

// Get all Jobs with pagination and search
const getJobs = async (req, res) => {
    try {
        const { cursor, limit = 20, search } = req.query;
        const take = parseInt(limit) + 1;

        const where = {
            ...(search ? {
                OR: [
                    { title: { contains: search, mode: 'insensitive' } },
                    { company: { contains: search, mode: 'insensitive' } }
                ]
            } : {}),
            // Exclude jobs this user has ignored
            NOT: {
                ignoredBy: {
                    some: { userId: req.user?.id }
                }
            }
        };

        const jobs = await prisma.job.findMany({
            where,
            take,
            ...(cursor && {
                skip: 1,
                cursor: { id: cursor }
            }),
            orderBy: { createdAt: 'desc' }
        });

        let nextCursor = null;
        if (jobs.length === take) {
            const nextItem = jobs.pop();
            nextCursor = nextItem.id;
        }

        res.status(200).json({ jobs, nextCursor });
    } catch (error) {
        logger.error(`Error fetching jobs: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch jobs' });
    }
};

// Ignore (pass on) a job
const ignoreJob = async (req, res) => {
    try {
        const { id: jobId } = req.params;
        const userId = req.user.id;

        await prisma.ignoredJob.upsert({
            where: { userId_jobId: { userId, jobId } },
            update: {},
            create: { userId, jobId }
        });

        logger.info(`User ${userId} ignored job ${jobId}`);
        res.status(200).json({ success: true });
    } catch (error) {
        logger.error(`Error ignoring job: ${error.message}`);
        res.status(500).json({ error: 'Failed to ignore job' });
    }
};

module.exports = {
    createJob,
    getJobs,
    ignoreJob
};
