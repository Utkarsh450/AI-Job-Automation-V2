require('dotenv').config();
const prisma = require('./src/config/db');

async function main() {
  const apps = await prisma.application.findMany();
  if (apps.length > 0) {
    await prisma.application.update({
      where: { id: apps[0].id },
      data: { status: 'MANUAL_REVIEW' }
    });
    console.log("Updated one application to MANUAL_REVIEW");
  } else {
    console.log("No applications found.");
  }
}
main().then(() => prisma.$disconnect());
