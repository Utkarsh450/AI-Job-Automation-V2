const inngest = require('./src/config/inngest');

async function trigger() {
    console.log("Triggering app/resume.uploaded");
    try {
        await inngest.send({
            name: "app/resume.uploaded",
            data: {
                resumeId: "d1883299-f425-44d5-b263-03af8038f4f5",
                s3Url: "https://res.cloudinary.com/dl0cmrznp/raw/upload/v1782385756/resumes/kfb8ugf5r3qorraoomek",
                userId: "cef90621-64b1-44ac-94ec-4cbe344c8d53"
            }
        });
        console.log("Sent successfully");
    } catch(e) {
        console.error("Error sending:", e);
    }
}
trigger();
