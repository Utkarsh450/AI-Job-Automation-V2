const express = require('express');
const router = express.Router();
const { getUserJobMatches, deleteJobMatch } = require('../controllers/jobMatch.controller');
const { requireDbUser } = require('../middlewares/authMiddleware');

router.get('/', requireDbUser, getUserJobMatches);
router.delete('/:jobId', requireDbUser, deleteJobMatch);

module.exports = router;

