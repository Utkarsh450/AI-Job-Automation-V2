const prisma = require('../config/db');
const logger = require('../utils/logger');
const inngest = require('../config/inngest');

const getUserApplications = async (req, res) => {
    try {
        // Fetch applications for the logged in user, including the actual job details
        const applications = await prisma.application.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                job: true // Bring in Title, Company, Description, etc.
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.status(200).json({ applications });
    } catch (error) {
        logger.error(`Error fetching applications for user ${req.user.id}: ${error.message}`);
        res.status(500).json({ error: "Failed to fetch applications" });
    }
};

const createApplication = async (req, res) => {
    try {
        const { jobId } = req.body;
        if (!jobId) {
            return res.status(400).json({ error: 'Job ID is required' });
        }

        // 1. Check if application already exists
        const existingApp = await prisma.application.findFirst({
            where: { userId: req.user.id, jobId }
        });

        if (existingApp) {
            return res.status(400).json({ error: 'Application already exists' });
        }

        // 2. Create application in QUEUED status
        const application = await prisma.application.create({
            data: {
                userId: req.user.id,
                jobId,
                status: 'QUEUED'
            },
            include: { job: true }
        });

        // 3. Remove the match since it's now an active application
        await prisma.jobMatch.deleteMany({
            where: { userId: req.user.id, jobId }
        });

        // 4. Trigger the tailoring and submission pipeline
        await inngest.send({
            name: 'app/application.tailor',
            data: {
                applicationId: application.id
            }
        });

        logger.info(`User ${req.user.id} applied for job ${jobId}, pipeline triggered.`);
        res.status(201).json({ application });
    } catch (error) {
        logger.error(`Error creating application for user ${req.user.id}: ${error.message}`);
        res.status(500).json({ error: 'Failed to create application' });
    }
};

module.exports = {
    getUserApplications,
    createApplication
};

