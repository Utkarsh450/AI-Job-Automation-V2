const express = require('express');
const router = express.Router();
const emailController = require('../controllers/email.controller');
const { requireDbUser } = require('../middlewares/authMiddleware');

router.get('/', requireDbUser, emailController.getEmails);
router.patch('/:id/read', requireDbUser, emailController.markAsRead);
router.post('/seed', requireDbUser, emailController.seedMockEmails);

module.exports = router;
