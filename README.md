# 🧑‍💻 RepoLens Backend – Agentic Workspace & Intelligence Hub

<div align="center">

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js%2015-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma%20ORM-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Supabase pgvector](https://img.shields.io/badge/Supabase%20pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Gemini%202.0%20Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)
![AssemblyAI](https://img.shields.io/badge/AssemblyAI-FF6F61?style=for-the-badge&logo=assemblyai&logoColor=white)

**Engineered and Maintained by [Yogesh Pant](https://github.com/Yogeshpant942)**

*A production-grade AI Backend powering intelligent codebase understanding, autonomous agentic PR reviews, meeting speaker diarization, and LLM observability.*

</div>

---

## 🌟 Executive Overview

**RepoLens Backend** is an enterprise-grade AI backend designed for engineering teams. Unlike simplistic LLM wrappers, RepoLens implements state-of-the-art **AI Engineering patterns**:

1. **3-Stage Hybrid RAG Engine:** Combines dense pgvector embeddings with BM25 keyword frequency and Gemini 2.0 Flash cross-encoder re-ranking.
2. **Autonomous PR Review Agent:** A 4-phase cognitive pipeline (`Plan` ➔ `Retrieve` ➔ `Review` ➔ `Reflect`) that inspects pull request diffs, retrieves relevant codebase context, and posts structured inline reviews directly on GitHub.
3. **AI Software Architect Agent:** Evaluates feature requests against live codebase embeddings to generate complete, step-by-step implementation plans and code scaffolds.
4. **Autonomous Meeting Intelligence:** Integrates Recall.ai and AssemblyAI for multi-speaker diarization and Gemini 2.0 for actionable issue/solution extraction.
5. **AI Observability & RAGAS Faithfulness Scoring:** Real-time logging of latency, token usage, cost projections, and ground truth faithfulness scoring (0–100) to eliminate hallucinations.

---

## 🏗️ Architecture & AI Pipelines

### 1. 3-Stage Hybrid RAG Pipeline

```mermaid
graph TD
    A[Developer Query] --> B[Generate Query Vector: text-embedding-004]
    B --> C[Stage 1: pgvector Cosine Similarity Search]
    C -->|Top 20 candidates| D[Stage 2: BM25 Keyword Scoring in TypeScript]
    D -->|Top 10 candidates| E[Stage 3: Gemini 2.0 Flash Cross-Encoder Re-ranker]
    E -->|Top 5 Context Chunks| F[Gemini 2.0 Contextual Answer Generation]
    F --> G[RAGAS Faithfulness Evaluator]
    G --> H[Final Response + Faithfulness Score + Latency Metrics]
    
    style A fill:#4338ca,stroke:#fff,color:#fff
    style C fill:#0284c7,stroke:#fff,color:#fff
    style E fill:#9333ea,stroke:#fff,color:#fff
    style H fill:#059669,stroke:#fff,color:#fff
```

### 2. Autonomous PR Review Agent (`Plan` ➔ `Retrieve` ➔ `Review` ➔ `Reflect`)

```mermaid
graph LR
    P[1. PLAN: Fetch PR Diffs via Octokit] --> R[2. RETRIEVE: Hybrid RAG for Changed Files]
    R --> Rev[3. REVIEW: Multi-category Audit with Gemini 2.0]
    Rev --> Ref[4. REFLECT: Verification Filter to Eliminate Hallucinations]
    Ref --> GH[Post Structured Inline Review to GitHub PR]

    style P fill:#2563eb,stroke:#fff,color:#fff
    style R fill:#7c3aed,stroke:#fff,color:#fff
    style Rev fill:#d97706,stroke:#fff,color:#fff
    style Ref fill:#dc2626,stroke:#fff,color:#fff
    style GH fill:#16a34a,stroke:#fff,color:#fff
```

---

## 📡 REST API Reference

All endpoints accept and return JSON and include comprehensive CORS and authentication headers.

### 🔐 Authentication (`/api/auth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Registers a new user with bcrypt password hashing and creates a session. |
| `POST` | `/api/auth/signin` | Authenticates user credentials and sets secure HTTP-only session cookie. |
| `GET` | `/api/auth/me` | Fetches currently authenticated user identity. |
| `POST` | `/api/auth/signout` | Invalidates active user session and clears cookies. |

### 📁 Projects & Repositories (`/api/projects`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/projects` | Creates project, connects GitHub repo, chunks code, and generates pgvector embeddings. |
| `GET` | `/api/projects` | Lists all active projects for the authenticated user. |
| `GET` | `/api/projects/:id` | Returns single project details with linked members and embeddings. |
| `DELETE` | `/api/projects/:id` | Cascading deletion of project, embeddings, questions, and commits. |
| `GET` | `/api/projects/:id/commits` | Polls latest repository commits and generates AI diff summaries. |
| `GET` | `/api/projects/:id/team` | Returns team members and collaborator roles for the project. |

### 🤖 Intelligent Q&A & Hybrid RAG (`/api/questions`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/questions/ask` | Executes the 3-Stage Hybrid RAG pipeline and returns streamed answers with confidence score. |
| `POST` | `/api/questions/save` | Persists question, answer, code references, and RAG evaluation metrics. |
| `GET` | `/api/questions/:projectId` | Retrieves chronological history of questions and faithfulness evaluations for a project. |

### 🔍 Agentic PR Reviews (`/api/pr-review`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/pr-review` | Triggers the 4-phase PR Review Agent for a GitHub PR URL and optionally posts directly to GitHub. |

### 🏛️ AI Architect (`/api/architect`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/architect` | Retrieves relevant codebase context and generates step-by-step implementation specifications. |

### 🎙️ Meeting Intelligence (`/api/meetings`, `/api/process-meeting`, `/api/bot`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/meetings?projectId=ID` | Fetches recorded meetings and extracted issues. |
| `POST` | `/api/meetings` | Registers a new meeting recording URL. |
| `DELETE` | `/api/meetings/:id` | Deletes meeting and associated issue transcripts. |
| `POST` | `/api/process-meeting` | Transcribes audio via AssemblyAI and extracts actionable issues using Gemini. |
| `POST` | `/api/bot/join` | Dispatches Recall.ai bot to join Google Meet or Zoom. |
| `POST` | `/api/bot/webhook` | Webhook receiver for Recall.ai recording completion events. |

### 🔄 Webhooks & Real-Time Sync (`/api/webhooks`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/webhooks/github` | Receives GitHub push and pull_request events for continuous vector sync and automated review bots. |

### 📊 AI Observability & Health (`/api/analytics`, `/api/health`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics?projectId=ID` | Returns telemetry on token consumption, estimated USD costs, latency percentiles, and RAGAS quality. |
| `GET` | `/api/health` | Health check verifying database connectivity and service readiness. |

---

## 💾 Database Schema (Prisma + pgvector)

- **`User` & `Session`:** Secure token-based session authentication with bcrypt hashing.
- **`Project` & `UserToProject`:** Multi-tenant project workspace management with team membership relations.
- **`SourceCodeEmbedding`:** Code chunks stored with `Vector(768)` embeddings for dense similarity search.
- **`Commit`:** Tracked git commits with AI-generated diff summaries.
- **`Meeting` & `Issue`:** Meeting transcripts with speaker diarization timestamps, gist, and proposed solutions.
- **`Question` & `RAGEvaluation`:** User questions paired with RAGAS-style faithfulness scores, latency, and retrieved chunk counts.
- **`LLMCallLog`:** Full observability table recording every model call, prompt/completion tokens, latency, and cost.

---

## ⚡ Quick Start & Setup

### 1. Clone the repository
```bash
git clone https://github.com/Yogeshpant942/repo_lens.git
cd repo_lens
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
Create a `.env` file based on [.env.example](file:///.env.example):
```bash
cp .env.example .env
```
Fill in your credentials:
```ini
DATABASE_URL="postgresql://postgres:password@db.supabase.co:5432/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:password@db.supabase.co:5432/postgres"
NEXT_PUBLIC_SUPABASE_URL="https://your_project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
GEMINI_API_KEY="your_gemini_api_key"
ASSEMBLY_API_KEY="your_assemblyai_api_key"
RECALL_API_KEY="your_recall_api_key"
GITHUB_ACCESS_TOKEN="your_github_token"
GITHUB_WEBHOOK_SECRET="your_webhook_secret"
```

### 4. Run database migrations
```bash
npx prisma generate
npx prisma migrate dev
```

### 5. Launch development server
```bash
npm run dev
```
The backend API server will be live at `http://localhost:3000`. Test the health check endpoint:
```bash
curl http://localhost:3000/api/health
```

---

## 👨‍💻 Author

**Yogesh Pant**
- **GitHub:** [@Yogeshpant942](https://github.com/Yogeshpant942)
- **Email:** yogeshpant942@gmail.com

---

## 📜 License
Licensed under the **MIT License**.
