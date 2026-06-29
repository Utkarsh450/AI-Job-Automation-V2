require('dotenv').config();
const prisma = require('./src/config/db');
const inngest = require('./src/config/inngest');

async function run() {
    console.log("Creating test application for Submit Worker...");

    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found.");
        return;
    }

    const url = process.argv[2] || "https://boards.greenhouse.io/testcompany/jobs/12345";
    
    const job = await prisma.job.create({
        data: {
            title: "Test Greenhouse Job",
            company: "Greenhouse Test Co",
            description: "Test job description.",
            url: url,
            atsPlatform: "greenhouse"
        }
    });

    // Create a mock primary resume
    const primaryResume = await prisma.resume.create({
        data: {
            userId: user.id,
            isPrimary: true,
            parsedData: {
                personalInfo: {
                    name: "John Doe",
                    email: "john@example.com",
                    phone: "+1234567890",
                    location: "San Francisco, CA"
                },
                summary: "Experienced AI Automation Engineer.",
                experience: [{ title: "Software Engineer", company: "TechCorp", startDate: "2020", endDate: "Present", responsibilities: ["Built ATS automation bots."] }]
            }
        }
    });

    const application = await prisma.application.create({
        data: {
            userId: user.id,
            jobId: job.id,
            status: "READY_TO_APPLY",
            tailoredResumeId: primaryResume.id
        }
    });

    console.log(`Application created with ID: ${application.id}. Triggering Submit Worker...`);

    await inngest.send({
        name: 'app/application.submit',
        data: {
            applicationId: application.id,
            userId: user.id
        }
    });

    console.log("Event 'app/application.submit' triggered successfully!");
}

run().catch(console.error).finally(() => prisma.$disconnect());
