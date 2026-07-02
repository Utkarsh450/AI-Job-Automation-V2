const prisma = require('./src/config/db');

async function run() {
    // Get the user ID of the Discord application
    const discordApp = await prisma.application.findFirst({
        where: { job: { company: 'discord' } }
    });
    
    if (!discordApp) {
        console.log("No discord app found.");
        return;
    }
    
    const correctUserId = discordApp.userId;
    console.log("Correct User ID:", correctUserId);
    
    // Update all NVIDIA apps to use this user ID
    const res = await prisma.application.updateMany({
        where: { job: { company: 'NVIDIA' } },
        data: { userId: correctUserId }
    });
    
    console.log("Updated applications:", res.count);
}

run().catch(console.error).finally(() => prisma.$disconnect());
