require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');
const { downloadPdfBuffer } = require('./src/services/resume.service');

async function test() {
    const publicId = "resumes/resume_1782468373581_resume_(1).pdf";

    try {
        console.log("Changing type to authenticated...");
        const result = await cloudinary.uploader.rename(publicId, publicId, {
            to_type: 'authenticated',
            overwrite: true
        });
        console.log("Renamed:", result.public_id);
    } catch(e) {
        console.log("Rename failed:", e.message);
    }

    try {
        console.log("Generating private download URL...");
        const url = cloudinary.utils.private_download_url(publicId, 'pdf', { attachment: true });
        console.log("URL:", url);
        await downloadPdfBuffer(url);
        console.log("DOWNLOAD SUCCESS!");
    } catch(e) {
        console.log("DOWNLOAD FAILED:", e.message);
    }
}
test().then(() => process.exit(0));
