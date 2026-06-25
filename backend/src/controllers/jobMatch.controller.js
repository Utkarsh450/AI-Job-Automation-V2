const prisma = require('../config/db');
const logger = require('../utils/logger');

const getUserJobMatches = async (req, res) => {
    try {
        const matches = await prisma.jobMatch.findMany({
            where: {
                userId: req.user.id
            },
            include: {
                job: true
            },
            orderBy: {
                fitScore: 'desc'
            }
        });

        res.status(200).json({ matches });
    } catch (error) {
        logger.error(`Error fetching job matches for user ${req.user.id}: ${error.message}`);
        res.status(500).json({ error: "Failed to fetch job matches" });
    }
};

module.exports = {
    getUserJobMatches
};
