require('dotenv').config();
const prisma = require('./src/config/db');
const cloudinary = require('./src/config/cloudinary');

async function test() {
    const resume = await prisma.resume.findFirst({ orderBy: { createdAt: 'desc' } });
    if (!resume || !resume.s3Url) return;

    const urlObj = new URL(resume.s3Url);
    const pathParts = urlObj.pathname.split('/');
    const uploadIndex = pathParts.indexOf('upload');
    
    // Cloudinary URLs use URL encoding. The true public_id needs to be decoded.
    const publicIdWithExt = decodeURIComponent(pathParts.slice(uploadIndex + 2).join('/'));
    
    console.log("Testing public_id with extension:", publicIdWithExt);
    try {
        const res1 = await cloudinary.api.resource(publicIdWithExt, { resource_type: 'image' });
        console.log("Found res1:", res1.public_id);
    } catch(e) {
        console.log("res1 failed:", e.error ? e.error.message : e.message);
    }

    const publicIdNoExt = publicIdWithExt.replace(/\.[^/.]+$/, "");
    console.log("Testing public_id without extension:", publicIdNoExt);
    try {
        const res2 = await cloudinary.api.resource(publicIdNoExt, { resource_type: 'image' });
        console.log("Found res2:", res2.public_id);
    } catch(e) {
        console.log("res2 failed:", e.error ? e.error.message : e.message);
    }
}
test().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
