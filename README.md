# 🚀 HireFlow -- AI Job Discovery & Application Automation Platform

> **Stop searching for jobs. Start getting interviews.**

HireFlow is an AI-powered platform that automates the entire job
application workflow---from discovering relevant jobs and semantically
matching them to your resume, to tailoring application materials and
automatically submitting applications on supported ATS platforms.

------------------------------------------------------------------------

## ✨ Why HireFlow?

Job seekers waste hours every day: - Searching across multiple job
boards - Reading repetitive job descriptions - Checking if they're a
good fit - Tailoring resumes - Writing cover letters - Filling the same
application forms repeatedly

**HireFlow automates this workflow using AI and intelligent
automation.**

------------------------------------------------------------------------

# 🎯 Key Features

-   🔐 Google OAuth Authentication
-   📄 AI Resume Parsing & Profile Extraction
-   ☁️ Resume Storage with Cloudinary
-   🧠 Semantic Job Matching using Vector Embeddings
-   📊 AI Match Score & Gap Analysis
-   🤖 AI Resume & Cover Letter Generation
-   ⚡ Background Processing with Inngest
-   🌍 Job Discovery from External Job Boards
-   🗄 PostgreSQL + pgvector Semantic Search
-   🎭 Browser Automation using Playwright
-   🌐 Automatic ATS Job Applications
-   📈 Dashboard for Jobs, Matches & Applications

------------------------------------------------------------------------

# 🏗 System Architecture

The platform is built as an event-driven pipeline.

``` text
Google Login
      │
Resume Upload
      │
Resume Parsing
      │
Embedding Generation
      │
Semantic Job Search
      │
Top Candidates Retrieval
      │
AI Re-ranking & Gap Analysis
      │
Auto Resume/Cover Letter
      │
Playwright Automation
      │
ATS Submission
```

------------------------------------------------------------------------

# ⚙️ Architecture Modules

## 1. Authentication

-   Google OAuth
-   Firebase Authentication
-   JWT Session Management
-   PostgreSQL User Storage

## 2. Resume Intelligence

-   Resume upload
-   Cloudinary storage
-   Background parsing with Inngest
-   Structured profile generation using OpenAI

## 3. Job Discovery

-   Scheduled scraping
-   Public Job APIs
-   Embedding generation (BGE)
-   pgvector indexing

## 4. AI Matching

-   Semantic retrieval
-   Cross-encoder reranking
-   Match score
-   Skill-gap analysis

## 5. Automated Applications

-   Playwright browser automation
-   Residential proxy support
-   AI-generated resumes
-   AI-generated cover letters
-   ATS form submission

------------------------------------------------------------------------

# 🧠 Tech Stack

## Frontend

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS

## Backend

-   FastAPI
-   Node.js
-   PostgreSQL
-   pgvector

## AI

-   OpenAI Agent SDK
-   OpenAI APIs
-   BGE Embeddings
-   BGE Cross Encoder

## Background Jobs

-   Inngest

## Automation

-   Playwright
-   Residential Proxies

## Authentication

-   Firebase Auth
-   Google OAuth
-   JWT

## Storage

-   Cloudinary

------------------------------------------------------------------------

# 📂 Project Structure

``` text
hireflow/
├── apps/
│   ├── web
│   └── api
├── workers/
│   ├── scraper
│   ├── matcher
│   └── applier
├── database/
├── docs/
├── public/
└── README.md
```

------------------------------------------------------------------------

# 🚀 Workflow

1.  User signs in with Google.
2.  Resume is uploaded and parsed into a structured profile.
3.  Jobs are continuously collected from supported job boards.
4.  Jobs are embedded and indexed in pgvector.
5.  Resume embedding retrieves the most relevant jobs.
6.  AI reranks results and provides match score & gap analysis.
7.  User can auto-apply.
8.  Playwright completes ATS applications using AI-generated documents.

------------------------------------------------------------------------

# 📸 Screenshots

Create a `/docs` folder and add:

``` text
docs/
├── dashboard.png
├── job-matching.png
├── resume-analysis.png
├── automation.png
├── architecture-auth.png
├── architecture-matching.png
└── architecture-automation.png
```

Then embed them:

``` md
![Dashboard](docs/dashboard.png)
```

------------------------------------------------------------------------

# 🛠 Local Setup

``` bash
git clone https://github.com/Utkarsh450/HireFlow.git
cd HireFlow

npm install

cp .env.example .env

npm run dev
```

------------------------------------------------------------------------

# 🔑 Environment Variables

``` env
DATABASE_URL=
OPENAI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_API_KEY=
CLOUDINARY_URL=
JWT_SECRET=
```

------------------------------------------------------------------------

# 🗺 Roadmap

-   Chrome Extension
-   LinkedIn Integration
-   Email Notifications
-   Resume Versioning
-   Multi-Resume Support
-   AI Interview Preparation
-   Analytics Dashboard

------------------------------------------------------------------------

# 🤝 Contributing

Contributions, feature requests, and bug reports are welcome.

1.  Fork the repository.
2.  Create a feature branch.
3.  Commit your changes.
4.  Open a Pull Request.

------------------------------------------------------------------------

# 📄 License

MIT License.

------------------------------------------------------------------------

# 👨‍💻 Author

**Utkarsh Barnwal**

If you found this project useful, consider giving it a ⭐ on GitHub.
