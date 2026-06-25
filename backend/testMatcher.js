require('dotenv').config();
const prisma = require('./src/config/db');
const { getEmbedding, rerankJobs } = require('./src/utils/embeddings');

(async () => {
    try {
        const resume = await prisma.resume.findFirst({ include: { user: true }});
        if (!resume) return console.log('No resume found');
        
        console.log('Testing embedding...');
        const profileText = JSON.stringify(resume.parsedData);
        const emb = await getEmbedding(profileText);
        
        // 1. Vector Search
        console.log('Testing Vector Search...');
        const vectorString = `[${emb.join(',')}]`;
        const topJobs = await prisma.$queryRaw`
            SELECT id, title, description, 1 - (embedding <=> ${vectorString}::vector) as similarity
            FROM "Job"
            ORDER BY embedding <=> ${vectorString}::vector
            LIMIT 200
        `;
        console.log(`Vector search success: found ${topJobs.length} jobs`);
        
        console.log('Testing Reranking...');
        const reranked = await rerankJobs(profileText, topJobs);
        console.log('Rerank success:', reranked.map(j => ({ id: j.id, score: j.rerankScore })));
        
        console.log('Testing Groq Llama 3...');
        const groq = require('./src/config/groq');
        const prompt = `You are an expert technical recruiter. Score how well this candidate fits the job.
Candidate Profile: ${profileText}
Job Description: ${reranked[0].description}
Return ONLY a valid JSON object: {"score": <number 1-100>, "reason": "<1 sentence explanation>", "gap_analysis": "<1 sentence explanation>"}`;

        const analysis = JSON.parse(completion.choices[0].message.content);
        console.log('Groq success:', analysis);
        
        console.log('Testing Prisma Create...');
        const app = await prisma.application.create({
            data: {
                userId: resume.userId,
                jobId: reranked[0].id,
                status: "QUEUED",
                fitScore: analysis.score,
                reason: analysis.reason,
                gapAnalysis: analysis.gap_analysis
            }
        });
        console.log('Prisma create success! App ID:', app.id);
        
    } catch (e) {
        console.error('Error occurred:', e.message);
    }
})();
