const express = require('express');
const { serve } = require('inngest/express');
const inngest = require('../config/inngest');

const { scraperWorker } = require('../workers/scraper.worker');
const { matcherWorker } = require('../workers/matcher.worker');
const { resumeWorker } = require('../workers/resume.worker');
const { sendWelcomeEmail, sendMatchAlertEmail } = require('../workers/email.worker');
const { cleanupStaleJobsWorker } = require('../workers/cleanup.worker');
const { tailorWorker } = require('../workers/tailor.worker');
const { submitWorker } = require('../workers/submit.worker');

const router = express.Router();

router.use('/', serve({
  client: inngest,
  
  functions: [
    scraperWorker, 
    matcherWorker,
    resumeWorker,
    sendWelcomeEmail,
    sendMatchAlertEmail,
    cleanupStaleJobsWorker,
    tailorWorker,
    submitWorker
  ],
}));

module.exports = router;
