const prisma = require('../config/db');
const logger = require('../utils/logger');

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

module.exports = {
    getUserApplications
};
