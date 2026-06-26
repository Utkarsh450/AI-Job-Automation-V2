require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');
const { downloadPdfBuffer } = require('./src/services/resume.service');

async function test() {
    const publicIdWithPdf = "resumes/resume_1782468373581_resume_(1).pdf";
    const version = 1782468378;

    const testUrl = (options, name) => {
        const url = cloudinary.utils.url(publicIdWithPdf, { ...options, secure: true, sign_url: true });
        console.log(`\nTesting ${name}:`);
        console.log("URL:", url);
        return downloadPdfBuffer(url).then(() => console.log("SUCCESS!")).catch(e => console.log("FAILED:", e.message));
    };

    await testUrl({ flags: 'attachment', format: 'pdf', version }, "With version and format");
    await testUrl({ flags: 'attachment', format: 'pdf' }, "With format only");
    
    // Cloudinary signature strings require exact match. 
    // What if we set type: 'upload' explicitly?
    await testUrl({ type: 'upload', flags: 'attachment', format: 'pdf', version }, "With type, version, format");
}
test().then(() => process.exit(0));
