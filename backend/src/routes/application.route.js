const express = require('express');
const { getUserApplications } = require('../controllers/application.controller');
const { requireDbUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Get all matched applications for the logged in user
router.get('/', requireDbUser, getUserApplications);


module.exports = router;