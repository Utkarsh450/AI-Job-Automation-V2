const prisma = require('../config/db');
const cloudinary = require('../config/cloudinary');
const pdfParse = require('pdf-parse');
const groq = require('../config/groq');
const logger = require('../utils/logger');
const inngest = require('../config/inngest');

const uploadResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }

        // 1. Upload the original PDF to Cloudinary
        const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { resource_type: 'raw', folder: 'resumes' },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            stream.end(req.file.buffer);
        });

        // 1.5 Cleanup: Delete any previous resumes for this user to avoid bloat
        await prisma.resume.deleteMany({
            where: { userId: req.user.id }
        });

        // 2. Save to PostgreSQL with parsedData as null
        const newResume = await prisma.resume.create({
            data: {
                userId: req.user.id,
                s3Url: uploadResult.secure_url,
                parsedData: null // Will be populated by the worker
            }
        });

        // 3. Trigger the AI Resume Parsing Worker
        logger.info(`Triggering background parsing worker for resume ${newResume.id}`);
        await inngest.send({
            name: "app/resume.uploaded",
            data: { resumeId: newResume.id, s3Url: newResume.s3Url, userId: req.user.id }
        });

        res.status(201).json({ message: "Resume uploaded successfully, parsing in background", resume: newResume });

    } catch (error) {
        logger.error(`Resume upload error: ${error.message}`);
        res.status(500).json({ error: "Failed to process resume", details: error.message });
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
