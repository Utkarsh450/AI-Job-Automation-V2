require('dotenv').config(); // Loads variables from your .env file - restart trigger
const app = require('./src/app');
const logger = require('./src/utils/logger');
require('./src/config/db'); // This imports and connects the database
console.log("PORT", process.env.PORT);

// Import Routes
const authRoutes = require('./src/routes/auth.route');
const userRoutes = require('./src/routes/user.route');
const resumeRoutes = require('./src/routes/resume.route');
const jobRoutes = require('./src/routes/job.route');
const applicationRoutes = require('./src/routes/application.route');
const emailRoutes = require('./src/routes/email.route');
const inngestRoutes = require('./src/routes/inngest.route');
const jobMatchRoutes = require('./src/routes/jobMatch.route');
const googleAuthRoutes = require('./src/routes/googleAuth.route');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/auth/google', googleAuthRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/emails', emailRoutes);
app.use('/api/inngest', inngestRoutes);
app.use('/api/job-matches', jobMatchRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    logger.info(`Server is running on http://localhost:${PORT}`);
});


// restart nodemon to fix module missing

// restart nodemon to show logs
// Triggering restart because the server crashed due to event loop starvation from the BGE reranker
