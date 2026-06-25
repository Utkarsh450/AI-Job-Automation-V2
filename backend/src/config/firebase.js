const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const logger = require('../utils/logger');
const serviceAccount = require('../../firebase-service-account.json');

// Initialize the Firebase Admin SDK using your private key
const app = initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth(app);
logger.info('Firebase Admin SDK initialized successfully');

module.exports = { app, auth };