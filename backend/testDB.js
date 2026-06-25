const prisma = require('./src/config/db');

async function main() {
    const resumes = await prisma.resume.findMany({
        orderBy: { createdAt: 'desc' },
        take: 3
    });
    
    console.log("Recent resumes:");
    for (const r of resumes) {
        console.log(`Resume ID: ${r.id}, User ID: ${r.userId}, URL: ${r.s3Url}`);
        if (r.parsedData) {
            console.log("Parsed Data Keys:", Object.keys(r.parsedData));
            console.log("Parsed Data:", JSON.stringify(r.parsedData, null, 2));
        } else {
            console.log("Parsed Data: null");
        }
        console.log("-------------------");
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
