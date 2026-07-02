const prisma = require('./src/config/db');

async function run() {
    // Get all users
    const users = await prisma.user.findMany();
    console.log("Found users:", users.length);
    
    for (let u of users) {
        const appCount = await prisma.application.count({ where: { userId: u.id } });
        console.log(`User ${u.email || u.id} has ${appCount} applications`);
        
        if (appCount > 0) {
            // Update all NVIDIA apps to this user (assuming this is the active user)
            const res = await prisma.application.updateMany({
                where: { job: { company: 'NVIDIA' } },
                data: { userId: u.id }
            });
            console.log("Updated NVIDIA applications for this user:", res.count);
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
