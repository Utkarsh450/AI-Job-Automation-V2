const prisma = require('./src/config/db');
const https = require('https');
const pdfParse = require('pdf-parse');
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const downloadBuffer = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download, status code: ${res.statusCode}`));
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
};

async function processResumes() {
    const resumes = await prisma.resume.findMany({
        where: { parsedData: { equals: null } }
    });
    console.log(`Found ${resumes.length} unparsed resumes.`);

    for (const resume of resumes) {
        try {
            console.log(`Processing resume ${resume.id}...`);
            const buffer = await downloadBuffer(resume.s3Url);
            const data = await pdfParse(buffer);
            
            const completion = await groq.chat.completions.create({
                messages: [
                    { 
                        role: "system", 
                        content: `You are an expert ATS resume parser. Extract ALL possible information from the raw text. Return ONLY a valid JSON object matching exactly this structure with no markdown wrapping:
{
"personal_info": { "name": "", "email": "", "phone": "", "location": "", "linkedin": "", "github": "", "portfolio": "" },
"professional_summary": "",
"skills": ["", ""],
"experience": [ { "company": "", "role": "", "duration": "", "description": ["bullet 1", "bullet 2"] } ],
"education": [ { "institution": "", "degree": "", "year": "", "gpa": "" } ],
"projects": [ { "name": "", "description": "", "technologies": [""] } ],
"certifications": [""]
}` 
                    },
                    { role: "user", content: data.text }
                ],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            });

            const parsedJson = JSON.parse(completion.choices[0].message.content);
            await prisma.resume.update({
                where: { id: resume.id },
                data: { parsedData: parsedJson }
            });
            console.log(`Successfully parsed resume ${resume.id}`);
        } catch (err) {
            console.error(`Failed to parse resume ${resume.id}:`, err.message);
        }
    }
}

processResumes().finally(async () => {
    await prisma.$disconnect();
});
