require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');
const { downloadPdfBuffer } = require('./src/services/resume.service');

async function test() {
    // A sample URL structure (we need a real one, but we can just use the DB to find one)
    const prisma = require('./src/config/db');
    const resume = await prisma.resume.findFirst({ where: { s3Url: { contains: 'cloudinary' } } });
    
    if (!resume) {
        console.log("No resume found");
        return;
    }
    
    console.log("Found resume URL:", resume.s3Url);
    
    // Extract public ID
    const urlObj = new URL(resume.s3Url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    const publicIdWithExt = pathParts.slice(uploadIndex + 2).join('/'); // skip vXXXX
    const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");
    console.log("Public ID:", publicId);
    
    const signedUrl = cloudinary.utils.url(publicId, {
        sign_url: true,
        resource_type: 'image',
        format: 'pdf',
        flags: 'attachment'
    });
    
    console.log("Signed URL:", signedUrl);
    
    try {
        await downloadPdfBuffer(signedUrl);
        console.log("SUCCESS! Downloaded buffer with signed URL.");
    } catch(e) {
        console.error("FAILED to download with signed URL:", e.message);
    }
}
test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
