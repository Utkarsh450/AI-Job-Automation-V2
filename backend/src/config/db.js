const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// This automatically tests the connection as soon as the server starts
prisma.$connect()
  .then(() => {
    logger.info('Successfully connected to Database! 🚀');
  })
  .catch((error) => {
    logger.error('Failed to connect to the database:', error);
  });

module.exports = prisma;
