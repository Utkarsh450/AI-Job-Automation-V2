const express = require('express');
const { registerUser, loginUser } = require('../controllers/auth.controller');
const { verifyFirebaseToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', verifyFirebaseToken, registerUser);
router.post('/login', verifyFirebaseToken, loginUser);

module.exports = router;
