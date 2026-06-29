const { chromium } = require('playwright');
const logger = require('../utils/logger');

/**
 * Generates an HTML string from the tailored JSON resume.
 * This HTML is designed to be extremely clean, minimal, and 100% ATS-friendly.
 */
const generateHTML = (resumeJson) => {
    // Escape HTML to prevent injection issues if there are special characters
    const escapeHtml = (unsafe) => {
        if (!unsafe) return '';
        return unsafe
            .toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    const header = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; font-size: 24px; font-weight: bold; color: #000;">${escapeHtml(resumeJson.personalInfo?.name || '')}</h1>
            <p style="margin: 4px 0; font-size: 12px; color: #333;">
                ${escapeHtml(resumeJson.personalInfo?.email || '')} • 
                ${escapeHtml(resumeJson.personalInfo?.phone || '')} • 
                ${escapeHtml(resumeJson.personalInfo?.location || '')}
            </p>
            <p style="margin: 4px 0; font-size: 12px; color: #333;">
                <a href="${escapeHtml(resumeJson.personalInfo?.linkedin || '#')}" style="color: #000; text-decoration: none;">LinkedIn</a> • 
                <a href="${escapeHtml(resumeJson.personalInfo?.github || '#')}" style="color: #000; text-decoration: none;">GitHub</a>
            </p>
        </div>
    `;

    const summary = resumeJson.summary ? `
        <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">PROFESSIONAL SUMMARY</h2>
            <p style="font-size: 12px; line-height: 1.5; margin: 0;">${escapeHtml(resumeJson.summary)}</p>
        </div>
    ` : '';

    const experience = resumeJson.experience && resumeJson.experience.length > 0 ? `
        <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">EXPERIENCE</h2>
            ${resumeJson.experience.map(exp => `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h3 style="margin: 0; font-size: 14px; font-weight: bold;">${escapeHtml(exp.title)}</h3>
                        <span style="font-size: 12px; color: #333;">${escapeHtml(exp.startDate)} – ${escapeHtml(exp.endDate || 'Present')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 6px;">
                        <span style="font-size: 12px; font-style: italic;">${escapeHtml(exp.company)}</span>
                        <span style="font-size: 12px; color: #333;">${escapeHtml(exp.location || '')}</span>
                    </div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.5;">
                        ${[].concat(exp.achievements || exp.responsibilities || []).filter(Boolean).map(item => `
                            <li style="margin-bottom: 4px;">${escapeHtml(item)}</li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    ` : '';

    const education = resumeJson.education && resumeJson.education.length > 0 ? `
        <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">EDUCATION</h2>
            ${resumeJson.education.map(edu => `
                <div style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; align-items: baseline;">
                        <h3 style="margin: 0; font-size: 14px; font-weight: bold;">${escapeHtml(edu.degree)}</h3>
                        <span style="font-size: 12px; color: #333;">${escapeHtml(edu.graduationDate || '')}</span>
                    </div>
                    <div style="font-size: 12px; font-style: italic;">${escapeHtml(edu.institution)}</div>
                </div>
            `).join('')}
        </div>
    ` : '';

    const skills = resumeJson.skills ? `
        <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">SKILLS</h2>
            <div style="font-size: 12px; line-height: 1.5;">
                ${Object.entries(resumeJson.skills).map(([category, items]) => {
                    const skillList = Array.isArray(items) ? items.join(', ') : items;
                    return `<div style="margin-bottom: 4px;"><strong>${escapeHtml(category)}:</strong> ${escapeHtml(skillList)}</div>`;
                }).join('')}
            </div>
        </div>
    ` : '';

    const projects = resumeJson.projects && resumeJson.projects.length > 0 ? `
        <div style="margin-bottom: 20px;">
            <h2 style="font-size: 16px; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 8px;">PROJECTS</h2>
            ${resumeJson.projects.map(proj => `
                <div style="margin-bottom: 12px;">
                    <h3 style="margin: 0; font-size: 14px; font-weight: bold;">
                        ${escapeHtml(proj.name)} ${proj.url ? `| <a href="${escapeHtml(proj.url)}" style="color: #000; text-decoration: none; font-weight: normal; font-size: 12px;">Link</a>` : ''}
                    </h3>
                    <div style="font-size: 12px; font-style: italic; margin-bottom: 4px;">${escapeHtml(proj.technologies ? proj.technologies.join(', ') : '')}</div>
                    <ul style="margin: 0; padding-left: 20px; font-size: 12px; line-height: 1.5;">
                        ${[].concat(proj.description || []).filter(Boolean).map(item => `
                            <li style="margin-bottom: 4px;">${escapeHtml(item)}</li>
                        `).join('')}
                    </ul>
                </div>
            `).join('')}
        </div>
    ` : '';

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {
                    font-family: 'Times New Roman', Times, serif; /* ATS systems highly prefer standard fonts */
                    margin: 0;
                    padding: 40px;
                    color: #000;
                }
                * { box-sizing: border-box; }
            </style>
        </head>
        <body>
            ${header}
            ${summary}
            ${experience}
            ${education}
            ${projects}
            ${skills}
        </body>
        </html>
    `;
};

/**
 * Generates a PDF buffer from a JSON resume using Playwright.
 */
const generatePdfFromResume = async (resumeJson) => {
    logger.info('Generating PDF from JSON Resume using Playwright...');
    const htmlContent = generateHTML(resumeJson);
    
    // Launch headless chromium
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    // Set HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
    // Generate PDF Buffer
    const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' }
    });
    
    await browser.close();
    logger.info('Successfully generated PDF buffer.');
    return pdfBuffer;
};

module.exports = {
    generatePdfFromResume
};
