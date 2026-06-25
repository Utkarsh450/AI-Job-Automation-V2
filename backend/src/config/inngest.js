const { Inngest } = require('inngest');
const logger = require('../utils/logger');

// Create a client to send and receive events
const inngest = new Inngest({ id: "tsenta-automation-engine" });
logger.info('Inngest client configured successfully');

module.exports = inngest;
