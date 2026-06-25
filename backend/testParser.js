const https = require('https');
const pdfParse = require('pdf-parse');

const downloadBuffer = (url) => {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            console.log("Status Code:", res.statusCode);
            if (res.statusCode !== 200) {
                return reject(new Error(`Failed to download, status code: ${res.statusCode}`));
            }
            const data = [];
            res.on('data', (chunk) => data.push(chunk));
            res.on('end', () => resolve(Buffer.concat(data)));
        }).on('error', reject);
    });
};

async function main() {
    try {
        const url = "https://res.cloudinary.com/dl0cmrznp/raw/upload/v1782385756/resumes/kfb8ugf5r3qorraoomek";
        console.log("Downloading...");
        const buffer = await downloadBuffer(url);
        console.log("Downloaded buffer size:", buffer.length);
        console.log("Parsing PDF...");
        const data = await pdfParse(buffer);
        console.log("Extracted text length:", data.text.length);
        console.log("Text preview:", data.text.substring(0, 200));

        const Groq = require('groq-sdk');
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
        
        console.log("Calling Groq...");
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
                { 
                    role: "user", 
                    content: data.text 
                }
            ],
            model: "llama-3.3-70b-versatile",
            response_format: { type: "json_object" }
        });
        console.log("Groq Response:", completion.choices[0].message.content);
    } catch (err) {
        console.error("Error:", err);
    }
}
main();
