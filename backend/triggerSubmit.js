const prisma = require('./src/config/db');
const inngest = require('./src/config/inngest');

async function run() {
    console.log('Finding FAILED applications...');
    const apps = await prisma.application.findMany({ where: { status: 'FAILED' } });
    
    if (apps.length === 0) {
        console.log('No applications to submit.');
        return;
    }

    const app = apps[0];
    await prisma.application.update({ where: { id: app.id }, data: { status: 'READY_TO_APPLY' } });
    await inngest.send({
        name: 'app/application.submit',
        data: { applicationId: app.id, userId: app.userId }
    });
    console.log('Sent submit event for ONE application:', app.id);
    console.log('Done!');
}

run().catch(console.error).finally(() => process.exit(0));
