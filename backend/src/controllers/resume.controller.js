const prisma = require('../config/db');
const logger = require('../utils/logger');
const inngest = require('../config/inngest');
const { uploadToCloudinary } = require('../services/resume.service');

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

        // 5. Trigger background parsing worker (non-fatal if Inngest is unavailable)
        try {
            logger.info(`Triggering resume parser for resume ${newResume.id}`);
            await inngest.send({
                name: 'app/resume.uploaded',
                data: { resumeId: newResume.id, s3Url: newResume.s3Url, userId: req.user.id }
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

module.exports = { uploadResume, updateParsedData };
