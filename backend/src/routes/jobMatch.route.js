const express = require('express');
const router = express.Router();
const { getUserJobMatches } = require('../controllers/jobMatch.controller');
const { requireDbUser } = require('../middlewares/authMiddleware');

router.get('/', requireDbUser, getUserJobMatches);

module.exports = router;
