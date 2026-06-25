const prisma = require('../config/db');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

// This function handles creating a new user in the database
const createUser = async (req, res) => {
    // 1. Check for validation errors caught by express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, name } = req.body;

        // 2. Insert the data into our Neon Database
        const newUser = await prisma.user.create({
            data: {
                email: email,
                name: name
            }
        });

        // 3. Log the success and respond to the client
        logger.info(`New user created successfully: ${newUser.email}`);
        res.status(201).json({ message: 'User created successfully!', user: newUser });
        
    } catch (error) {
        logger.error(`Error creating user: ${error.message}`);
        // Check if it's a unique constraint violation (email already exists)
        if (error.code === 'P2002') {
             return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: {
                resumes: true,
                preferences: true,
                appPasswords: true,
                _count: {
                    select: { applications: true }
                }
            }
        });

        res.status(200).json({ user });
    } catch (error) {
        logger.error(`Error fetching profile: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { 
            location, // Assuming it's a string like "San Francisco, CA, 94103, US"
            visaStatus,
            requiresSponsorship, // We'll store this as part of visaStatus or preferences if needed
            preferences, // Object containing all the yes/no flags
            appPasswords, // Array of { domain, username, password }
            resumeOptimization,
            coverLetterOpt,
            autoApprove
        } = req.body;
        
        // Update user base info
        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                location,
                visaStatus,
                isOnboarded: true
            }
        });

        // Upsert preferences
        if (preferences || resumeOptimization) {
            await prisma.userPreference.upsert({
                where: { userId: req.user.id },
                create: {
                    userId: req.user.id,
                    ...preferences,
                    resumeOptimization: resumeOptimization || "Honest",
                    coverLetterOpt: coverLetterOpt || "Off",
                    autoApprove: autoApprove !== undefined ? autoApprove : true
                },
                update: {
                    ...preferences,
                    ...(resumeOptimization && { resumeOptimization }),
                    ...(coverLetterOpt && { coverLetterOpt }),
                    ...(autoApprove !== undefined && { autoApprove })
                }
            });
        }

        // Upsert app passwords
        if (appPasswords && appPasswords.length > 0) {
            for (const app of appPasswords) {
                // In production, you would hash/encrypt this password!
                // For demonstration, storing plain or basic encryption
                await prisma.applicationPassword.upsert({
                    where: {
                        userId_domain: {
                            userId: req.user.id,
                            domain: app.domain
                        }
                    },
                    create: {
                        userId: req.user.id,
                        domain: app.domain,
                        username: req.user.email, // Defaults to user's email
                        encryptedPassword: app.password // SHOULD BE ENCRYPTED
                    },
                    update: {
                        encryptedPassword: app.password
                    }
                });
            }
        }

        res.status(200).json({ message: "Profile updated successfully", user: updatedUser });
    } catch (error) {
        logger.error(`Error updating profile: ${error.message}`);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { resumeOptimization, coverLetterOpt, autoApprove } = req.body;

        const user = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(resumeOptimization !== undefined && { resumeOptimization }),
                ...(coverLetterOpt !== undefined && { coverLetterOpt }),
                ...(autoApprove !== undefined && { autoApprove }),
            }
        });

        res.status(200).json({ message: 'Settings updated', user });
    } catch (error) {
        logger.error(`Error updating settings: ${error.message}`);
        res.status(500).json({ error: 'Failed to update settings' });
    }
};

module.exports = {
    createUser,
    getProfile,
    updateProfile,
    updateSettings
};
