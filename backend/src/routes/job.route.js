const express = require('express');
const { createJob, getJobs, ignoreJob } = require('../controllers/job.controller');
const { verifyFirebaseToken, requireDbUser } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', verifyFirebaseToken, createJob);
router.get('/', requireDbUser, getJobs);
router.post('/:id/ignore', requireDbUser, ignoreJob);

module.exports = router;
