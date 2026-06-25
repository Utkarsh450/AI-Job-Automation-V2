const express = require('express');
const cors = require('cors');
const logger = require('./utils/logger');
const userRoutes = require('./routes/user.route');
const jobRoutes = require('./routes/job.route');
const authRoutes = require('./routes/auth.route');
const resumeRoutes = require('./routes/resume.route');
const inngestRoutes = require('./routes/inngest.route');
const applicationRoutes = require('./routes/application.route');

const app = express();

// Middlewares
app.use(cors()); // Allows our frontend to talk to our backend without security errors
app.use(express.json()); // Allows our backend to understand JSON data sent from the frontend

// A simple test route to check if the server is alive
app.get('/health', (req, res) => {
    logger.info('Health check route was pinged!');
    res.json({ status: 'ok', message: 'Tsenta Backend is running perfectly!' });
});

// API Routes
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/inngest', inngestRoutes);
app.use('/api/applications', applicationRoutes);

module.exports = app; 