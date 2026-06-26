require('dotenv').config();
const cloudinary = require('./src/config/cloudinary');
const { downloadPdfBuffer } = require('./src/services/resume.service');

async function test() {
    const fakePdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n5 0 obj\n<< /Length 44 >>\nstream\nBT\n/F1 24 Tf\n100 700 Td\n(Hello World) Tj\nET\nendstream\nendobj\nxref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000219 00000 n \n0000000307 00000 n \ntrailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n402\n%%EOF\n");

    console.log("Uploading as raw...");
    const stream = cloudinary.uploader.upload_stream({
        resource_type: 'raw',
        folder: 'resumes',
        public_id: `test_raw_${Date.now()}.pdf`
    }, async (err, result) => {
        if (err) return console.error("Upload failed", err);
        console.log("Uploaded URL:", result.secure_url);
        try {
            await downloadPdfBuffer(result.secure_url);
            console.log("DOWNLOAD RAW SUCCESS!");
        } catch(e) {
            console.log("DOWNLOAD RAW FAILED:", e.message);
        }
    });
    stream.end(fakePdf);
}
test();
