require('dotenv').config();
const { uploadToCloudinary } = require('./src/services/resume.service');
const fs = require('fs');

async function test() {
    try {
        console.log("Reading real PDF buffer...");
        const buffer = fs.readFileSync("node_modules/pdf-parse/test/data/01-valid.pdf");
        console.log("Uploading via uploadToCloudinary...");
        const result = await uploadToCloudinary(buffer, "test_resume.pdf");
        console.log("Upload Success:", result.secure_url);
    } catch (e) {
        console.error("Upload Error:", e);
    }
}
test().then(() => process.exit(0));
