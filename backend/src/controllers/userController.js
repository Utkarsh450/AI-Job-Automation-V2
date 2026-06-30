const prisma = require('../config/db');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');
const { encrypt, decrypt } = require('../utils/encryption');

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
                    select: { 
                        applications: true,
                        emails: { where: { isRead: false } }
                    }
                }
            }
        });

        if (user && user.appPasswords) {
            user.appPasswords = user.appPasswords.map(app => ({
                ...app,
                encryptedPassword: decrypt(app.encryptedPassword) // send plain text back to the authenticated user
            }));
        }

        res.status(200).json({ user });
    } catch (error) {
        logger.error(`Error fetching profile: ${error.message}`);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
};

const updateProfile = async (req, res) => {
    try {
        const { 
            location, 
            visaStatus, 
            requiresSponsorship, // We'll store this as part of visaStatus or preferences if needed
            linkedinUrl,
            githubUrl,
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
                linkedinUrl,
                githubUrl,
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

        // Upsert app passwords — encrypted with AES-256-GCM before storage
        if (appPasswords && appPasswords.length > 0) {
            for (const app of appPasswords) {
                const encryptedPassword = encrypt(app.password);
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
                        username: req.user.email,
                        encryptedPassword
                    },
                    update: {
                        encryptedPassword
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
        const { resumeOptimization, coverLetterOpt, autoApprove, appPasswords } = req.body;

        // These fields live on UserPreference, NOT the User model
        const updatedPrefs = await prisma.userPreference.upsert({
            where: { userId: req.user.id },
            create: {
                userId: req.user.id,
                ...(resumeOptimization !== undefined && { resumeOptimization }),
                ...(coverLetterOpt !== undefined && { coverLetterOpt }),
                ...(autoApprove !== undefined && { autoApprove }),
            },
            update: {
                ...(resumeOptimization !== undefined && { resumeOptimization }),
                ...(coverLetterOpt !== undefined && { coverLetterOpt }),
                ...(autoApprove !== undefined && { autoApprove }),
            }
        });

        if (appPasswords && appPasswords.length > 0) {
            const { encrypt } = require('../utils/encryption');
            for (const app of appPasswords) {
                const encryptedPassword = encrypt(app.password);
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
                        username: req.user.email,
                        encryptedPassword
                    },
                    update: {
                        encryptedPassword
                    }
                });
            }
        }

        res.status(200).json({ message: "Settings updated successfully", preferences: updatedPrefs });
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
