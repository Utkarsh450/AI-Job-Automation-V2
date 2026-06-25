const inngest = require('../config/inngest');
const prisma = require('../config/db');
const groq = require('../config/groq');
const { getEmbedding, rerankJobs } = require('../utils/embeddings');
const logger = require('../utils/logger');

const matcherWorker = inngest.createFunction(
  { 
    id: "ai-job-matcher",
    triggers: [
      { event: "app/scrape.completed" }, // Triggered after a scrape cycle finishes
      { event: "app/matches.evaluate" }  // Triggered after a specific resume is parsed
    ]
  },
  async ({ event, step }) => {
    logger.info("Starting AI Job Matcher Worker with BGE ReRanker...");

    // If triggered by a specific user upload, only match for them. Otherwise, match for everyone.
    const userFilter = event?.data?.userId ? { userId: event.data.userId } : {};
    
    const resumes = await prisma.resume.findMany({ 
        where: userFilter,
        include: { user: true } 
    });

    for (const resume of resumes) {
        if (!resume.parsedData) continue;

        await step.run(`Match jobs for user ${resume.user.email}`, async () => {
            try {
                const profileText = JSON.stringify(resume.parsedData);
                const userEmbedding = await getEmbedding(profileText);
                const vectorString = `[${userEmbedding.join(',')}]`;

                // 1. Vector Search (Bi-Encoder): Get Top 200
                const top200Jobs = await prisma.$queryRaw`
                    SELECT id, title, company, description, 1 - (embedding <=> ${vectorString}::vector) as similarity
                    FROM "Job"
                    ORDER BY embedding <=> ${vectorString}::vector
                    LIMIT 200
                `;
                
                if (top200Jobs.length === 0) return;

                // 2. Cross-Encoder ReRanking (BGE): Get Top 20
                logger.info(`ReRanking candidates for ${resume.user.email}...`);
                const rerankedJobs = await rerankJobs(profileText, top200Jobs);
                const top20Jobs = rerankedJobs.slice(0, 20);

                // 3. LLM Agent Scoring (Groq): Final filtering and matching
                logger.info(`Sending Top 20 jobs to Groq for ${resume.user.email}...`);
                let highScoringJobs = 0;
                
                for (const job of top20Jobs) {
                    const existingApp = await prisma.application.findFirst({
                        where: { userId: resume.userId, jobId: job.id }
                    });
                    if (existingApp) continue;

                    const prompt = `You are an expert technical recruiter. Score how well this candidate fits the job.
Candidate Profile: ${profileText}
Job Description: ${job.description}
Return ONLY a valid JSON object: {"score": <number 1-100>, "reason": "<1 sentence explanation>", "gap_analysis": "<1 sentence explanation>"}`;

                    const completion = await groq.chat.completions.create({
                        messages: [
                            { role: "system", content: "You output only pure JSON." },
                            { role: "user", content: prompt }
                        ],
                        model: "llama-3.3-70b-versatile",
                        response_format: { type: "json_object" }
                    });

                    const analysis = JSON.parse(completion.choices[0].message.content);

                    // 4. Save to Database
                    if (analysis.score >= 0) {
                        await prisma.jobMatch.create({
                            data: {
                                userId: resume.userId,
                                jobId: job.id,
                                fitScore: analysis.score,
                                reason: analysis.reason,
                                gapAnalysis: analysis.gap_analysis
                            }
                        });
                        logger.info(`🔥 MATCH EVALUATED! ${resume.user.email} -> ${job.title} at ${job.company} (Score: ${analysis.score})`);
                        if (analysis.score >= 80) {
                            highScoringJobs++;
                        }
                    }
                }

                // 5. Send Email Notification
                if (highScoringJobs > 0) {
                    await inngest.send({
                        name: 'app/matches.found',
                        data: { email: resume.user.email, count: highScoringJobs }
                    });
                }
            } catch (err) {
                logger.error(`Matching error for ${resume.user.email}: ${err.message}`);
            }
        });
    }

    return { status: "success" };
  }
);

module.exports = { matcherWorker };
