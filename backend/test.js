const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ include: { jobMatches: true } });
  users.forEach(u => console.log(u.email, u.jobMatches.length));
}
main().finally(() => prisma.$disconnect());