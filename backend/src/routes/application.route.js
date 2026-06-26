const express = require('express');
const { getUserApplications, createApplication } = require('../controllers/application.controller');
const { requireDbUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all matched applications for the logged in user
router.get('/', requireDbUser, getUserApplications);

// Apply to a job
router.post('/', requireDbUser, createApplication);

module.exports = router;