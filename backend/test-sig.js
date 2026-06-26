require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');
const { downloadPdfBuffer } = require('./src/services/resume.service');

async function test() {
    // The exact public_id found via API
    const publicId = "resumes/resume_1782468373581_resume_(1).pdf";
    
    console.log("Testing with format: 'pdf'");
    const url1 = cloudinary.utils.url(publicId, { sign_url: true, flags: 'attachment', secure: true, format: 'pdf' });
    console.log("URL1:", url1);
    try { await downloadPdfBuffer(url1); console.log("URL1 SUCCESS"); } catch(e) { console.log("URL1 FAILED:", e.message); }

    console.log("Testing without format");
    const url2 = cloudinary.utils.url(publicId, { sign_url: true, flags: 'attachment', secure: true });
    console.log("URL2:", url2);
    try { await downloadPdfBuffer(url2); console.log("URL2 SUCCESS"); } catch(e) { console.log("URL2 FAILED:", e.message); }

    console.log("Testing without sign_url but with fl_attachment");
    const url3 = cloudinary.utils.url(publicId, { flags: 'attachment', secure: true });
    console.log("URL3:", url3);
    try { await downloadPdfBuffer(url3); console.log("URL3 SUCCESS"); } catch(e) { console.log("URL3 FAILED:", e.message); }

}
test().then(() => process.exit(0)).catch(console.error);
