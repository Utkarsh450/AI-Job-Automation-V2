const express = require('express');
const multer = require('multer');
const { uploadResume, updateParsedData } = require('../controllers/resume.controller');
const { requireDbUser } = require('../middlewares/authMiddleware');

const router = express.Router();

// Configure Multer to use memory storage since we need the buffer for both Cloudinary and PDF-Parse
const storage = multer.memoryStorage();
const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only PDF files are allowed!'), false);
        }
    }
});

// POST /api/resumes/upload
// Note: We use requireDbUser because uploading a resume strictly requires an existing DB user
router.post('/upload', requireDbUser, upload.single('resume'), uploadResume);
// PUT /api/resumes/:id/parsed-data
router.put('/:id/parsed-data', requireDbUser, updateParsedData);

module.exports = router;
