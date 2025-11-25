# AI-Native LMS Architecture Plan & Roadmap

## 1. Vision & Objectives
Transition LearnAIOS from a "Canvas wrapper" prototype to an **AI-Native Operating System** for education.
- **Scalable Domain Model**: Move beyond simple CRUD to rich educational primitives (Sections, Terms, Submissions, Versions).
- **Agentic AI Core**: Replace simple chatbots with an **AI Orchestrator** capable of RAG (Retrieval Augmented Generation), tool use, and context-aware actions.
- **Production Readiness**: robust error logging, background job processing, and modular frontend architecture.

---

## 2. Architecture Specifications

### 2.1. Database Schema (Prisma)
We will expand the schema to support the "Missing Middle" identified in research.

**New/Modified Models:**
- **`Term`**: Time-bound containers for courses (e.g., "Fall 2025").
- **`Section`**: Sub-divisions of a course for enrollment management.
- **`Enrollment`**: Replaces `CourseMembership`. Links User <-> Section. Tracks state (`active`, `invited`, `concluded`).
- **`Submission`**: The artifact of a student's work. Links User <-> Assignment. Supports text/URL initially.
- **`SubmissionComment`**: Threaded feedback on submissions (for AI grading feedback).
- **`ContentVersion`**: Stores snapshots of `Page` and `Assignment` content for undo/safety.
- **`Job`**: A database-backed queue for async tasks (AI grading, batch enrollments).

### 2.2. Backend Services (Layered Architecture)
We will move away from monolithic Express routes to a Service-Repository pattern.

**Directory Structure (`apps/api/src/`):**
```
├── core/
│   ├── config.ts          # Env vars & constants
│   ├── logger.ts          # Structured logging (Winston/Pino wrapper)
│   ├── database.ts        # Prisma client instance
│   └── errors.ts          # Standardized error classes
├── modules/
│   ├── auth/              # Authentication & User management
│   ├── access/            # RBAC & Policy Engine
│   ├── content/           # Courses, Modules, Pages
│   ├── assessment/        # Assignments, Submissions, Grades
│   └── infra/             # Jobs, File Uploads
├── ai/
│   ├── orchestrator/      # Main AI Router
│   ├── rag/               # Retrieval Engine (Interface + Implementation)
│   ├── tools/             # Tool Registry & Definitions
│   └── agents/            # Agent Personas (Content Helper, Grader)
└── server.ts              # Express App entry point
```

### 2.3. AI Infrastructure (Routers & RAG)
The AI subsystem will be decoupled from the HTTP layer.

- **`AIRouter`**: Directs intent to the right Agent (Routing Agent -> Specialist Agent).
- **`RAGInterface`**:
    ```typescript
    interface VectorStore {
        addDocument(doc: Document): Promise<void>;
        search(query: string, filters: any): Promise<ScoredChunk[]>;
    }
    ```
    *Implementation*: For MVP without external Vector DB, we will implement `PostgresKeywordRAG` using Prisma's full-text capabilities, but structured to swap for Pinecone later.
- **`ContextEngine`**: Builds the "Manifest" (Permissions + Current View + Relevant Data) instead of just dumping text.

### 2.4. Frontend Modularization
Refactoring the "Super-Component" `InstructorDashboard` into Feature Modules.

**Directory Structure (`apps/web/`):**
```
├── components/
│   ├── features/
│   │   ├── instructor/    # Dashboard & Analytics
│   │   ├── course/        # Course Editor & List
│   │   ├── module/        # Module Management
│   │   └── grading/       # SpeedGrader-lite interface
│   └── ui/                # Shared Atoms (Buttons, Cards)
```

---

## 3. Implementation Steps

### Step 1: Foundation (Data & Core)
1.  Update `schema.prisma` with new models.
2.  Run migrations.
3.  Setup `Logger` and `AppError` utilities.

### Step 2: Backend Service Migration
1.  Create `AccessControlService` (RBAC).
2.  Refactor `Courses` and `Modules` routes to use new Services.
3.  Implement `SubmissionService` (Submit, Grade, Comment).

### Step 3: AI Engine Construction
1.  Implement `RAGService` (Ingestion & Retrieval).
2.  Build `AIOrchestrator` to handle tool execution loop (Thought -> Tool -> Observation -> Answer).
3.  Expose via refined `/api/ai/chat` and `/api/ai/action` endpoints.

### Step 4: Frontend Overhaul
1.  Refactor `InstructorDashboard` to use new components.
2.  Build `AssignmentSubmission` view for Students.
3.  Build `AIActionPanel` to allow "Applying" AI suggestions to content.

### Step 5: Polish & Docs
1.  Update API documentation.
2.  Final "Deploy Ready" checks (Lint, Build).

---

## 4. Execution Priorities
We will prioritize **deployability**. This means we won't introduce external dependencies (Redis/Pinecone) yet. We will build robust "In-Box" versions (DB Job Queue, Postgres Search) that scale vertically before needing horizontal infrastructure.


