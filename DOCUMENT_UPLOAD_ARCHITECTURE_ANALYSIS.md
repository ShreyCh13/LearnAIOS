# 📋 DOCUMENT UPLOAD ARCHITECTURE ANALYSIS & SOLUTION PLAN

## 🔍 EXECUTIVE SUMMARY

**Problem:** Document uploads are breaking because:
1. Prisma schema has NO `Document` model
2. Code references `documents` relation that doesn't exist
3. RAG system only searches `Page.bodyMarkdown` (text), not uploaded files
4. No document processing pipeline for AI/RAG integration

**Critical Requirement:** Documents MUST work because they're the foundation for RAG-powered AI agent tools that students will interact with.

---

## 🏗️ CURRENT ARCHITECTURE ANALYSIS

### 1. **Database Layer (Prisma Schema)**

**Current State:**
- ✅ Multi-tenant structure (Tenant → User → Course → Module → Page)
- ✅ AI conversation tracking (AIConversation, AIConversationMessage)
- ✅ Tool/Agent registry for AI system
- ❌ **NO Document model** - This is the root cause

**What Exists:**
```prisma
model Page {
  bodyMarkdown String @db.Text  // Only text content
  // No file attachments
}
```

**What's Missing:**
- Document storage model
- File metadata (name, size, mimeType, storage path)
- Relations to Course/Module/Assignment
- Processing status (for async extraction)

---

### 2. **RAG System Architecture**

**Current Implementation (`postgresRAG.ts`):**
```typescript
// ONLY searches Page.bodyMarkdown using keyword matching
const pages = await prisma.page.findMany({
  where: {
    bodyMarkdown: { contains: keyword }
  }
});
```

**Critical Gap:**
- ❌ Cannot search PDF content
- ❌ Cannot search Word documents
- ❌ Cannot search images (OCR)
- ❌ No vector embeddings for semantic search
- ❌ No document chunking strategy

**RAG Interface (`ragInterface.ts`):**
```typescript
interface VectorStore {
  addDocument(doc: Document): Promise<void>;  // Currently NO-OP!
  search(query: string, filters?: any): Promise<ScoredChunk[]>;
}
```

**The `addDocument` method is a NO-OP** - it doesn't actually process or index documents!

---

### 3. **API Layer Structure**

**What Works:**
- ✅ Upload middleware exists (`middleware/upload.ts`) with multer
- ✅ Static file serving configured (`/uploads` route)
- ✅ Auth middleware working
- ✅ Course/Module/Assignment routes structured

**What's Broken:**
- ❌ `assignments.ts` lines 88-90, 124-126: References `documents` relation that doesn't exist
- ❌ `modules.ts` lines 156-266: Has document upload code but schema doesn't support it
- ❌ No `/documents` route file (was deleted)
- ❌ Frontend calls `/api/documents/upload` but route doesn't exist

**File Storage:**
- ✅ Local storage configured: `apps/api/uploads/`
- ✅ Multer configured with unique filenames
- ❌ No database record of uploaded files
- ❌ No processing pipeline after upload

---

### 4. **Frontend Architecture**

**What Exists:**
- ✅ `DocumentUpload.tsx` - Drag & drop component (ready)
- ✅ `DocumentList.tsx` - Display component (ready)
- ✅ Integrated into instructor dashboard and assignment pages
- ❌ Components call non-existent API endpoints

**API Calls Made:**
```typescript
POST /api/documents/upload
GET /api/documents?courseId=...&moduleId=...&assignmentId=...
GET /api/documents/:documentId/download
```

**All of these routes are MISSING!**

---

### 5. **AI Context Builder**

**Current Implementation (`contextBuilder.ts`):**
- Only builds context from `Page.bodyMarkdown`
- No document content extraction
- No integration with uploaded files

**What's Needed:**
- Extract text from PDFs/DOCX
- Chunk documents for RAG
- Include document content in AI context
- Support document-specific queries

---

## 🎯 WHY DOCUMENTS ARE CRITICAL

### **RAG-Powered AI Agent Tools**

The user's vision:
> "Later we will use RAG to create AI agent tools for students to interact with"

**This means:**
1. **Students upload assignments** → AI needs to read them
2. **Instructors upload course materials** → AI needs to search them
3. **Documents contain key information** → Must be in RAG context
4. **Multi-format support** → PDF, DOCX, images, etc.

**Current RAG can only search markdown pages** - completely inadequate for real-world use!

---

## 🚨 ROOT CAUSE ANALYSIS

### **Why It Keeps Breaking:**

1. **Schema-Client Mismatch:**
   - Code references `prisma.document` but schema has no `Document` model
   - Prisma client generated without `Document` type
   - TypeScript errors everywhere

2. **Incomplete Implementation:**
   - Upload middleware exists but no route uses it
   - Frontend components ready but API missing
   - RAG system designed but not connected to documents

3. **No Migration Strategy:**
   - Adding `Document` model requires migration
   - Existing code breaks during transition
   - No incremental rollout plan

4. **Missing Processing Pipeline:**
   - Files uploaded but not processed
   - No text extraction
   - No chunking/indexing
   - RAG can't use them

---

## 💡 COMPREHENSIVE SOLUTION ARCHITECTURE

### **Phase 1: Foundation (Database & Storage)**

#### **1.1 Prisma Schema Design**

```prisma
model Document {
  id           String   @id @default(cuid())
  courseId     String
  moduleId     String?
  assignmentId String?
  
  // File metadata
  title        String
  fileName     String   // Stored filename (unique)
  originalName String   // User's filename
  mimeType     String
  size         Int      // Bytes
  url          String   // Access URL
  
  // Processing status
  processingStatus String @default("pending") // "pending" | "processing" | "completed" | "failed"
  extractedText    String? @db.Text  // Extracted text for RAG
  chunkCount       Int     @default(0)
  
  // Metadata
  uploadedBy   String
  createdAt    DateTime @default(now())
  processedAt  DateTime?
  
  // Relations
  course      Course      @relation(fields: [courseId], references: [id], onDelete: Cascade)
  module      Module?     @relation(fields: [moduleId], references: [id], onDelete: SetNull)
  assignment  Assignment? @relation(fields: [assignmentId], references: [id], onDelete: SetNull)
  uploader     User        @relation(fields: [uploadedBy], references: [id], onDelete: Cascade)
  
  // Chunks for RAG (optional, for future vector search)
  chunks      DocumentChunk[]
  
  @@index([courseId])
  @@index([moduleId])
  @@index([assignmentId])
  @@index([processingStatus])
  @@unique([fileName])
}

model DocumentChunk {
  id         String   @id @default(cuid())
  documentId String
  chunkIndex Int
  content    String   @db.Text
  metadata   Json?    // Page number, section, etc.
  
  document   Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  @@index([documentId])
  @@unique([documentId, chunkIndex])
}
```

**Why This Design:**
- ✅ Polymorphic relations (Course/Module/Assignment)
- ✅ Processing status for async workflows
- ✅ Extracted text for immediate keyword search
- ✅ Chunks table for future vector embeddings
- ✅ Proper indexing for performance

#### **1.2 Update Existing Models**

```prisma
model Course {
  // ... existing fields
  documents Document[]  // Add this relation
}

model Module {
  // ... existing fields
  documents Document[]  // Add this relation
}

model Assignment {
  // ... existing fields
  documents Document[]  // Add this relation
}

model User {
  // ... existing fields
  uploadedDocuments Document[]  // Add this relation
}
```

---

### **Phase 2: API Layer (Upload & Management)**

#### **2.1 Create `/routes/documents.ts`**

**Endpoints Needed:**

```typescript
// POST /documents/upload
// - Multer middleware for file handling
// - Create Document record
// - Queue processing job (async)
// - Return document metadata

// GET /documents
// - Query by courseId/moduleId/assignmentId
// - Filter by processingStatus
// - Include uploader info

// GET /documents/:documentId
// - Get single document with full metadata

// GET /documents/:documentId/download
// - Stream file from disk
// - Check permissions

// DELETE /documents/:documentId
// - Remove file from disk
// - Delete database record
// - Clean up chunks
```

**Key Implementation Details:**
- Use existing `upload` middleware from `middleware/upload.ts`
- Validate file types (PDF, DOCX, images, etc.)
- Set size limits (50MB default)
- Create database record immediately
- Return 202 Accepted for processing status

#### **2.2 Fix Broken References**

**In `assignments.ts`:**
- Remove `include: { documents: ... }` until schema updated
- Or make it conditional: `include: { documents: true }` (only if relation exists)

**In `modules.ts`:**
- Remove document upload code (lines 156-266) OR
- Move to dedicated `/routes/documents.ts`

---

### **Phase 3: Document Processing Pipeline**

#### **3.1 Text Extraction Service**

**Create `modules/content/documentProcessor.ts`:**

```typescript
interface DocumentProcessor {
  extractText(filePath: string, mimeType: string): Promise<string>;
  chunkText(text: string, maxChunkSize: number): Promise<string[]>;
}

class DocumentProcessorImpl {
  async extractText(filePath: string, mimeType: string): Promise<string> {
    if (mimeType === 'application/pdf') {
      return await this.extractFromPDF(filePath);
    }
    if (mimeType.includes('word') || mimeType.includes('docx')) {
      return await this.extractFromDOCX(filePath);
    }
    if (mimeType.startsWith('image/')) {
      return await this.extractFromImage(filePath); // OCR
    }
    if (mimeType === 'text/plain' || mimeType === 'text/markdown') {
      return await fs.readFile(filePath, 'utf-8');
    }
    throw new Error(`Unsupported file type: ${mimeType}`);
  }
}
```

**Libraries Needed:**
- `pdf-parse` - PDF text extraction
- `mammoth` - DOCX to HTML/text
- `tesseract.js` - OCR for images
- `sharp` - Image processing

#### **3.2 Async Processing Job**

**Create `modules/infra/documentProcessingJob.ts`:**

```typescript
// Queue job after upload
async function processDocument(documentId: string) {
  // 1. Mark as "processing"
  // 2. Extract text
  // 3. Chunk text
  // 4. Store chunks in database
  // 5. Mark as "completed"
  // 6. Trigger RAG index update (if using vector DB)
}
```

**Options:**
- **Simple:** Process synchronously on upload (blocks request)
- **Better:** Use job queue (Bull/BullMQ with Redis)
- **Best:** Use background worker process

---

### **Phase 4: RAG Integration**

#### **4.1 Update RAG Interface**

**Extend `PostgresKeywordRAG` to search documents:**

```typescript
async search(query: string, filters?: { courseId?: string }): Promise<ScoredChunk[]> {
  const keywords = extractKeywords(query);
  
  // Search Pages (existing)
  const pages = await prisma.page.findMany({...});
  
  // Search Documents (NEW!)
  const documents = await prisma.document.findMany({
    where: {
      courseId: filters?.courseId,
      processingStatus: 'completed',  // Only search processed docs
      OR: [
        { extractedText: { contains: keyword } },
        { title: { contains: keyword } }
      ]
    },
    include: { chunks: true }  // Include chunks for better matching
  });
  
  // Combine and score results
  return [...pages, ...documents].map(toScoredChunk);
}
```

#### **4.2 Update Context Builder**

**Modify `contextBuilder.ts` to include documents:**

```typescript
// After fetching pages, also fetch relevant documents
const relevantDocuments = await prisma.document.findMany({
  where: {
    courseId,
    processingStatus: 'completed',
    OR: keywordQuery.map(kw => ({
      extractedText: { contains: kw, mode: 'insensitive' }
    }))
  },
  take: 5
});

// Include document content in context
const documentContext = relevantDocuments
  .map(doc => `--- Document: ${doc.title} ---\n${doc.extractedText.substring(0, 1000)}...`)
  .join('\n\n');

contextText = `${pageContext}\n\n${documentContext}`;
```

#### **4.3 Future: Vector Embeddings**

**For semantic search (not keyword):**
- Use OpenAI embeddings API
- Store in `DocumentChunk.embedding` (vector column)
- Use pgvector extension for PostgreSQL
- Enable semantic similarity search

---

### **Phase 5: Frontend Integration**

#### **5.1 Fix API Endpoints**

**Update `DocumentUpload.tsx`:**
- Already correct! Just needs backend route

**Update `DocumentList.tsx`:**
- Already correct! Just needs backend route

#### **5.2 Add Processing Status UI**

**Show processing indicator:**
```typescript
{doc.processingStatus === 'processing' && (
  <div>⏳ Processing document...</div>
)}
{doc.processingStatus === 'failed' && (
  <div>❌ Processing failed</div>
)}
```

---

## 📋 IMPLEMENTATION PLAN (Step-by-Step)

### **STEP 1: Database Foundation** ⚠️ CRITICAL

1. **Add Document model to schema.prisma**
   - Copy the model definition above
   - Add relations to Course/Module/Assignment/User

2. **Create migration:**
   ```bash
   cd packages/db
   npx prisma migrate dev --name add_document_model
   ```

3. **Regenerate Prisma client:**
   ```bash
   npx prisma generate
   ```

4. **Rebuild db package:**
   ```bash
   npm run build
   ```

**⚠️ This will temporarily break the app until routes are fixed!**

---

### **STEP 2: Fix Broken Code References**

1. **Remove broken `documents` includes:**
   - In `assignments.ts`: Comment out lines 88-90, 124-126
   - Or make conditional: `include: { documents: true }` (will work after schema update)

2. **Remove or move document code in `modules.ts`:**
   - Delete lines 156-266 (document upload code)
   - We'll create dedicated route instead

---

### **STEP 3: Create Documents API Route**

1. **Create `apps/api/src/routes/documents.ts`:**
   - Implement all 4 endpoints (upload, list, get, download, delete)
   - Use `upload` middleware from `middleware/upload.ts`
   - Create Document records in database
   - Set `processingStatus: 'pending'`

2. **Register route in `index.ts`:**
   ```typescript
   import documentsRoutes from './routes/documents';
   app.use('/documents', documentsRoutes);
   ```

---

### **STEP 4: Basic Text Extraction (MVP)**

1. **Install libraries:**
   ```bash
   cd apps/api
   pnpm add pdf-parse mammoth
   ```

2. **Create `modules/content/documentProcessor.ts`:**
   - Implement PDF extraction
   - Implement DOCX extraction
   - For now, skip images (add OCR later)

3. **Process synchronously on upload:**
   - Extract text immediately
   - Update `processingStatus: 'completed'`
   - Store `extractedText` in database

**⚠️ This blocks the upload request for large files!**

---

### **STEP 5: RAG Integration**

1. **Update `PostgresKeywordRAG.search()`:**
   - Add document search alongside page search
   - Filter by `processingStatus: 'completed'`
   - Search `extractedText` field

2. **Update `contextBuilder.ts`:**
   - Include documents in context
   - Combine with page content

3. **Test with AI chat:**
   - Upload a PDF
   - Ask AI a question about it
   - Verify document content is in response

---

### **STEP 6: Async Processing (Improvement)**

1. **Install job queue:**
   ```bash
   pnpm add bull @types/bull
   ```

2. **Create processing job:**
   - Queue job after upload
   - Process in background
   - Update status asynchronously

3. **Add status endpoint:**
   - `GET /documents/:id/status` - Check processing status

---

### **STEP 7: Advanced Features (Future)**

1. **Chunking:**
   - Implement `DocumentChunk` model usage
   - Split large documents into chunks
   - Store in database

2. **Vector Embeddings:**
   - Install pgvector
   - Generate embeddings for chunks
   - Enable semantic search

3. **OCR for Images:**
   - Install `tesseract.js`
   - Extract text from images
   - Add to RAG index

---

## 🎯 RECOMMENDED APPROACH

### **Option A: Incremental (Safest)**

1. ✅ Add Document model to schema
2. ✅ Create migration & regenerate
3. ✅ Fix broken code references (remove `documents` includes temporarily)
4. ✅ Create basic `/documents` route (upload, list, download)
5. ✅ Test file upload/download works
6. ✅ Add text extraction (PDF, DOCX)
7. ✅ Integrate with RAG
8. ✅ Add async processing later

**Pros:** Each step is testable, less risky
**Cons:** Takes longer, multiple deployments

---

### **Option B: Big Bang (Faster, Riskier)**

1. ✅ Do everything at once
2. ✅ Add schema + routes + processing + RAG integration
3. ✅ Test everything together

**Pros:** Faster, all features at once
**Cons:** Higher risk, harder to debug

---

### **Option C: Hybrid (Recommended)**

1. ✅ **Phase 1:** Schema + Basic Upload (Steps 1-3)
   - Get files uploading and stored
   - No processing yet
   - Test that nothing breaks

2. ✅ **Phase 2:** Text Extraction (Step 4)
   - Add processing
   - Extract text synchronously
   - Store in database

3. ✅ **Phase 3:** RAG Integration (Step 5)
   - Connect to AI system
   - Test end-to-end

4. ✅ **Phase 4:** Async & Advanced (Steps 6-7)
   - Improve performance
   - Add chunking/embeddings

---

## 🔧 TECHNICAL DECISIONS

### **File Storage:**
- ✅ **Local filesystem** for MVP (already configured)
- 🔄 **S3/Cloud Storage** for production (later)

### **Text Extraction:**
- ✅ **Synchronous** for MVP (simple, works)
- 🔄 **Async job queue** for production (better UX)

### **RAG Strategy:**
- ✅ **Keyword search** for MVP (PostgreSQL LIKE queries)
- 🔄 **Vector embeddings** for production (semantic search)

### **Chunking:**
- ✅ **Skip for MVP** (search full document text)
- 🔄 **Add later** for large documents (better context)

---

## ⚠️ CRITICAL GOTCHAS

1. **Prisma Migration Order:**
   - Must add Document model BEFORE adding relations
   - Add relations to existing models AFTER Document exists
   - Run migration, then regenerate client

2. **Breaking Changes:**
   - Existing code will break during migration
   - Plan for downtime or feature flag

3. **File Size Limits:**
   - Set reasonable limits (50MB default)
   - Large PDFs take time to process
   - Consider async processing for >10MB files

4. **Error Handling:**
   - Document processing can fail
   - Set `processingStatus: 'failed'`
   - Log errors for debugging
   - Allow retry

5. **Permissions:**
   - Only instructors can upload
   - Students can download
   - Check course membership

---

## 📊 SUCCESS METRICS

**Phase 1 Complete When:**
- ✅ Documents can be uploaded
- ✅ Documents appear in list
- ✅ Documents can be downloaded
- ✅ No Prisma errors

**Phase 2 Complete When:**
- ✅ PDF text is extracted
- ✅ DOCX text is extracted
- ✅ Text stored in database

**Phase 3 Complete When:**
- ✅ AI can answer questions about uploaded documents
- ✅ Document content appears in RAG context
- ✅ End-to-end test passes

---

## 🚀 NEXT STEPS

1. **Review this analysis** - Does the architecture make sense?
2. **Choose implementation approach** - Incremental vs Big Bang
3. **Start with Phase 1** - Database foundation
4. **Test incrementally** - Don't move to next phase until current works
5. **Iterate** - Add features one at a time

---

## 💭 OUT-OF-THE-BOX IDEAS

### **1. Document Versioning**
- Track document revisions
- Allow reverting to previous versions
- Useful for assignment submissions

### **2. Document Annotations**
- Allow instructors to annotate student submissions
- Store annotations separately
- Display in UI

### **3. Smart Document Suggestions**
- AI suggests relevant documents when creating assignments
- Based on course content similarity

### **4. Document Templates**
- Pre-upload templates for common assignment types
- Instructors can customize

### **5. Collaborative Documents**
- Real-time editing (like Google Docs)
- Track changes
- Comments/feedback

### **6. Document Analytics**
- Track which documents students access most
- Time spent viewing
- Download patterns

---

**This architecture supports the RAG vision while being practical and incremental!** 🎯


