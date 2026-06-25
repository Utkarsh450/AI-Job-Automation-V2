const express = require('express');
const { createJob, getJobs } = require('../controllers/job.controller');
const { verifyFirebaseToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/', verifyFirebaseToken, createJob);
router.get('/', verifyFirebaseToken, getJobs);

module.exports = router;
