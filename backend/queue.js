const prisma = require('./src/config/db');

async function run() {
    const user = await prisma.user.findFirst();
    const jobs = await prisma.job.findMany({ where: { company: 'NVIDIA' }, take: 10 });
    for (let job of jobs) {
        await prisma.application.create({ 
            data: { userId: user.id, jobId: job.id, status: 'QUEUED' } 
        });
        console.log('Queued:', job.title);
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
