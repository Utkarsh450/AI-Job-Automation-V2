require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { jobMatches: true } });
  users.forEach(u => console.log(u.email, 'JobMatches count:', u.jobMatches.length));
}
main().finally(() => process.exit(0));
