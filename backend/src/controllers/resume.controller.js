const prisma = require('../config/db');
const logger = require('../utils/logger');
const inngest = require('../config/inngest');
const { uploadToCloudinary, extractTextFromBuffer } = require('../services/resume.service');

const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // 1. Upload the PDF to Cloudinary via service layer
        const uploadResult = await uploadToCloudinary(req.file.buffer, req.file.originalname);

        // 2. Unset any previous primary resume for this user
        await prisma.resume.updateMany({
            where: { userId: req.user.id, isPrimary: true },
            data: { isPrimary: false }
        });

        // 3. Delete old non-primary resumes to avoid DB bloat (keep last 3)
        const oldResumes = await prisma.resume.findMany({
            where: { userId: req.user.id },
            orderBy: { createdAt: 'desc' },
            skip: 2, // Keep 2 most recent
            select: { id: true }
        });
        if (oldResumes.length > 0) {
            await prisma.resume.deleteMany({
                where: { id: { in: oldResumes.map(r => r.id) } }
            });
        }

        // 4. Create new resume record as primary
        const newResume = await prisma.resume.create({
            data: {
                userId: req.user.id,
                s3Url: uploadResult.secure_url,
                isPrimary: true,
                parsedData: null // Populated by the Inngest worker
            }
        });

        // 5. Extract text from PDF buffer in-memory (bypasses Cloudinary URL restrictions)
        let rawText = '';
        try {
            rawText = await extractTextFromBuffer(req.file.buffer);
            if (!rawText || rawText.trim() === '') {
                throw new Error("Extracted text is empty");
            }
        } catch (parseErr) {
            logger.warn(`Could not extract text from PDF in controller: ${parseErr.message}`);
            return res.status(400).json({ error: 'Could not extract text from the PDF — it may be image-based or corrupted.' });
        }

        // 6. Trigger background parsing worker
        try {
            logger.info(`Triggering resume parser for resume ${newResume.id}`);
            await inngest.send({
                name: 'app/resume.uploaded',
                data: { resumeId: newResume.id, s3Url: newResume.s3Url, userId: req.user.id, rawText }

            });
        } catch (inngestErr) {
            logger.warn(`Inngest unavailable — resume will not be parsed automatically: ${inngestErr.message}`);
        }

        res.status(201).json({
            message: 'Resume uploaded successfully, parsing in background',
            resume: newResume
        });

    } catch (error) {
        logger.error(`Resume upload error: ${error.message}`);
        res.status(500).json({ error: 'Failed to process resume', details: error.message });
    }
};


const updateParsedData = async (req, res) => {
    try {
        const { id } = req.params;
        const { parsedData } = req.body;

        if (!parsedData) {
            return res.status(400).json({ error: "Missing parsedData in request body" });
        }

        // Verify the resume belongs to the user
        const resume = await prisma.resume.findUnique({
            where: { id }
        });

        if (!resume) {
            return res.status(404).json({ error: "Resume not found" });
        }

        if (resume.userId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to update this resume" });
        }

        const updatedResume = await prisma.resume.update({
            where: { id },
            data: { parsedData }
        });

        res.status(200).json({ message: "Resume parsed data updated successfully", resume: updatedResume });
    } catch (error) {
        logger.error(`Error updating parsed data: ${error.message}`);
        res.status(500).json({ error: "Failed to update parsed data", details: error.message });
    }
};

const cloudinary = require('../config/cloudinary');

const downloadResume = async (req, res) => {
    try {
        const { id } = req.params;
        const resume = await prisma.resume.findUnique({ where: { id } });
        
        if (!resume) {
            return res.status(404).json({ error: "Resume not found" });
        }
        
        if (resume.userId !== req.user.id) {
            return res.status(403).json({ error: "Not authorized to download this resume" });
        }

        // If this is an AI-generated resume (no s3Url or placeholder), generate it on the fly!
        if (!resume.s3Url || resume.s3Url === 'generated-by-ai') {
            const { generatePdfFromResume } = require('../services/pdf.service');
            const pdfBuffer = await generatePdfFromResume(resume.parsedData);
            const dataUrl = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;
            return res.status(200).json({ url: dataUrl });
        }

        // Parse public_id from Cloudinary URL
        // e.g., https://res.cloudinary.com/.../image/upload/v12345/resumes/resume_1234.pdf
        const urlObj = new URL(resume.s3Url);
        const pathParts = urlObj.pathname.split('/');
        const uploadIndex = pathParts.indexOf('upload');
        if (uploadIndex === -1) throw new Error("Invalid Cloudinary URL");
        
        // Extract everything after upload/vXXX/
        // Cloudinary public_ids do not include the file extension
        // IMPORTANT: We must decodeURIComponent because the URL is encoded (e.g. %28 instead of '(').
        // Signature generation will fail (HTTP 401) if the string doesn't exactly match the decoded public_id!
        const publicIdWithExt = decodeURIComponent(pathParts.slice(uploadIndex + 2).join('/'));
        const publicId = publicIdWithExt.replace(/\.[^/.]+$/, "");

        // Generate a signed URL that bypasses strict delivery 401s
        const signedUrl = cloudinary.utils.url(publicId, {
            secure: true,
            sign_url: true,
            resource_type: 'image', // Since we uploaded it as 'image' initially
            format: 'pdf',
            flags: 'attachment' // Forces download
        });

        // Return the signed URL to the frontend
        res.status(200).json({ url: signedUrl });
    } catch (error) {
        logger.error(`Download resume error: ${error.message}`);
        res.status(500).json({ error: "Failed to generate download URL" });
    }
};

module.exports = { uploadResume, updateParsedData, downloadResume };
