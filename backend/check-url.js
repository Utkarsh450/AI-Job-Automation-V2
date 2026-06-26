const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const resume = await prisma.resume.findFirst({ orderBy: { createdAt: 'desc' } });
    console.log("URL:", resume?.s3Url);
    process.exit(0);
}
check();
