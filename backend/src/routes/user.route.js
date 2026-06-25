const express = require('express');
const { createUser, getProfile, updateProfile, updateSettings } = require('../controllers/userController');
const { requireDbUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Define the route for POST /api/users
router.post('/', createUser);
router.get('/profile', requireDbUser, getProfile);
router.put('/profile', requireDbUser, updateProfile);
router.put('/settings', requireDbUser, updateSettings);

module.exports = router;