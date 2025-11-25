# Backend Implementation Summary - Prompts 11 & 12

This document summarizes the backend endpoints implementation for teacher and student operations, as well as the AI summarization tool.

## Files Created

### 1. `/apps/api/src/middleware/courseMembership.ts`
**Purpose:** Role-based access control middleware for course operations.

**Exports:**
- `requireCourseRole(courseIdParam, allowedRoles)` - Generic middleware for role checking
- `requireInstructorOfCourse(courseIdParam)` - Convenience wrapper for instructor-only routes
- `requireCourseMember(courseIdParam)` - Middleware for any course member (student or instructor)

**Features:**
- Validates user's CourseMembership for the specified course
- Checks if user's role is in the allowed roles list
- Ensures course belongs to user's tenant
- Attaches `req.membership` and `req.course` for use in route handlers
- Returns 403 Forbidden if unauthorized

### 2. `/apps/api/src/routes/modules.ts`
**Purpose:** Module and page creation endpoints.

**Endpoints:**
- `POST /courses/:courseId/modules` - Create a module (instructors only)
  - Auto-calculates position if not provided
  - Returns the created module
- `POST /modules/:moduleId/pages` - Create a page in a module (instructors only)
  - Validates module exists and user is an instructor
  - Links page to both module and course
  - Returns the created page

### 3. `/apps/api/src/routes/assignments.ts`
**Purpose:** Assignment management endpoints.

**Endpoints:**
- `POST /courses/:courseId/assignments` - Create an assignment (instructors only)
  - Validates required fields (name, description, dueAt)
  - Optionally links to a module
  - Auto-creates a matching CalendarEvent
  - Returns the created assignment
- `GET /courses/:courseId/assignments` - List assignments (members only)
  - Returns assignments sorted by dueAt
  - Includes module information
- `GET /assignments/:assignmentId` - Get assignment details (members only)
  - Returns full assignment with course and module context
  - Validates course membership

### 4. `/apps/api/src/routes/events.ts`
**Purpose:** Calendar event management endpoints.

**Endpoints:**
- `POST /courses/:courseId/events` - Create a calendar event (instructors only)
  - Validates date formats and logic (endAt > startAt)
  - Creates standalone events (assignmentId = null)
  - Returns the created event
- `GET /courses/:courseId/events` - List calendar events (members only)
  - Returns all events including assignment-linked ones
  - Sorted by startAt
  - Includes assignment information if linked

## Files Modified

### 1. `/apps/api/src/routes/courses.ts`
**New Endpoints:**
- `POST /courses` - Create a course (instructors only, global role check)
  - Creates Course record
  - Auto-creates CourseMembership for creator as instructor
  - Returns the created course
- `POST /courses/:courseId/enroll` - Enroll a user (instructors only)
  - Finds or creates user by email in same tenant
  - Creates/updates CourseMembership
  - Supports both student and instructor roles
  - Returns the membership
- `GET /courses/:courseId/enrollments` - List enrollments (instructors only)
  - Returns all memberships with user details
  - Sorted by creation date

**Modified Endpoints:**
- `GET /courses` - Now filters by course membership
  - Returns only courses where user has a CourseMembership
  - Works for both instructors and students
- `GET /courses/:courseId` - Now uses `requireCourseMember` middleware
  - Only accessible to course members
- `GET /courses/:courseId/modules` - Now uses `requireCourseMember` middleware
  - Only accessible to course members
- `GET /modules/:moduleId/pages` - Enhanced membership check
  - Validates course membership before returning pages
- `GET /pages/:pageId` - Enhanced membership check
  - Validates course membership before returning page

### 2. `/apps/api/src/index.ts`
**Changes:**
- Imported new routers: `modulesRoutes`, `assignmentsRoutes`, `eventsRoutes`
- Mounted new routes:
  - `/` - modulesRoutes (for `/courses/:courseId/modules` and `/modules/:moduleId/pages`)
  - `/` - assignmentsRoutes (for assignment endpoints)
  - `/` - eventsRoutes (for event endpoints)

## Key Features Implemented

### 1. Role-Based Access Control
- **Global roles:** Checked from `User.role` (student, instructor, admin)
- **Course roles:** Checked from `CourseMembership.role` (student, instructor)
- **Middleware approach:** Declarative role requirements on routes
- **Tenant isolation:** All checks validate tenant membership

### 2. Course Creation Workflow
1. Only users with global role 'instructor' can create courses
2. Course is created in the creator's tenant
3. CourseMembership is automatically created for the creator as instructor
4. Creator becomes the first member with full control

### 3. Enrollment Workflow
1. Instructor can enroll users by email
2. If user doesn't exist, they are created (with email prefix as name)
3. If user exists, tenant is validated
4. CourseMembership is upserted (create or update role)
5. Supports both 'student' and 'instructor' enrollment roles

### 4. Content Creation Flow (Instructor Only)
1. Create Course → Auto-membership as instructor
2. Create Module → Linked to course
3. Create Page → Linked to module and course
4. Create Assignment → Optionally linked to module
5. Assignment auto-creates CalendarEvent

### 5. Student View Permissions
- Students can only see courses they're enrolled in
- Students can view all content (modules, pages, assignments, events)
- Students cannot create or modify content
- Students cannot enroll other students

### 6. Automatic Calendar Integration
- When an assignment is created, a CalendarEvent is automatically generated
- Event has same title/description as assignment
- Event startAt/endAt are set to assignment dueAt
- Event is linked to assignment via `assignmentId`
- Instructors can also create standalone events (no assignment link)

## Error Handling

### Standardized Error Responses

**401 Unauthorized**
- Missing or invalid JWT token
- Expired token

**403 Forbidden**
- Global role check failed (e.g., student trying to create course)
- Course membership check failed (not a member)
- Course role check failed (student trying to create content)

**404 Not Found**
- Course, module, page, assignment, or event doesn't exist

**400 Bad Request**
- Missing required fields
- Invalid data format (e.g., invalid date)
- Invalid references (e.g., moduleId doesn't belong to course)

## Security Considerations

1. **Tenant Isolation:** All operations validate that resources belong to the user's tenant
2. **Course Isolation:** Users can only access courses they're members of
3. **Role Enforcement:** Instructor-only operations are protected at middleware level
4. **Token Validation:** All protected routes require valid JWT
5. **Input Validation:** Required fields are validated before processing
6. **Reference Validation:** Foreign keys are validated before creating relationships

## Testing the Implementation

See `API_EXAMPLES.md` for comprehensive curl command examples, including:
- Complete workflow from course creation to student enrollment
- All CRUD operations for courses, modules, pages, assignments, and events
- Examples for both instructor and student perspectives
- Error response examples

## Database Schema Used

The implementation leverages these Prisma models:
- `User` - Global user with role (student, instructor, admin)
- `Course` - Course with title and description
- `CourseMembership` - Many-to-many relationship with role
- `Module` - Course modules with position
- `Page` - Content pages linked to modules and courses
- `Assignment` - Assignments with due dates and points
- `CalendarEvent` - Events (standalone or assignment-linked)

## Next Steps (Not in Scope)

The following are intentionally not implemented (as specified):
- AI layer modifications
- Frontend changes
- Submission tracking for assignments
- Grading system
- Grade calculation
- Discussion forums
- Notifications
- File uploads for assignments

## Notes

- The `GET /courses` endpoint now requires membership, so unassigned courses won't be visible to students
- Instructors see all courses where they have membership (not all courses in tenant)
- The position field for modules auto-increments if not provided
- Calendar events for assignments are automatically created and maintained
- Email is used as the unique identifier for enrolling users
- New users are created with minimal information (email and role) if they don't exist

---

# Prompt 12 Implementation - AI Summarization Tool

## Overview

Extended the AI layer to add a module summarization tool that allows both instructors and students to request AI-generated study guides for course modules. The tool summarizes all pages and assignments within a module.

## Files Modified

### 1. `/apps/api/src/ai/toolRegistry.ts`

**New Tool Definition:**
- Added `summarize_module` tool to `TOOL_DEFINITIONS` array
- Tool accepts `moduleId` as input parameter
- Returns a `summary` string as output
- Permissions: Available to both `student` and `instructor` roles
- Context type: `module_page`
- Latency class: `sync`

**New Function:**
- `executeSummarizeModule(args, context)` - Implements the tool execution logic
  - Validates `moduleId` parameter
  - Fetches module with related course, pages, and assignments
  - Verifies module belongs to user's tenant
  - Verifies user has CourseMembership on the module's course
  - Builds comprehensive text block containing:
    - Module name and course title
    - All pages with titles and markdown content
    - All assignments with names, descriptions, and due dates
  - Calls LLM with specialized system prompt for study guide generation
  - Returns formatted summary

**Updated Functions:**
- `executeTool()` - Added branch for `summarize_module` tool
- `getToolDefinitionsForAgent()` - Updated comment to reflect all available tools

### 2. `/apps/api/src/ai/agentRegistry.ts`

**Updated Agent Definition:**
- Modified `content_helper` agent description to include summarization capability
- Description now mentions: "Helps students and instructors understand course pages, answer questions using course content, generate practice questions, and summarize modules."

### 3. `/apps/api/src/ai/aiRouter.ts`

**Enhanced Chat Endpoint:**
- Added `moduleId` to request body destructuring
- Passes `moduleId` to `buildContext()` function
- Includes `moduleId` in conversation context snapshot
- Ensures module context is available for AI tool execution

### 4. `/apps/api/src/ai/contextBuilder.ts`

**Updated Function Signature:**
- Added optional `moduleId` parameter to `buildContext()` function
- Allows module-specific context to be passed through the chat flow

## Tool Behavior

### Input
- `moduleId` (required): The ID of the module to summarize

### Processing
1. Validates module exists and belongs to user's tenant
2. Checks user has CourseMembership on module's course (enforces access control)
3. Fetches module data including:
   - Module name and course information
   - All pages (ordered by ID) with titles and full markdown content
   - All assignments (ordered by due date) with names, descriptions, and due dates
4. Constructs structured text block with clear sections for pages and assignments
5. Sends to LLM with system prompt optimized for study guide generation
6. Returns AI-generated summary

### Output
- `summary`: A comprehensive study guide covering module content and assignments
- Format includes clear paragraphs and bullet points
- Highlights key concepts from pages
- Lists assignments with due dates

### Permissions
- Both `student` and `instructor` roles can use this tool
- Users must be enrolled in the course (have CourseMembership)
- Tenant isolation is enforced

## AI Integration

### System Prompt
```
You are an assistant summarizing a course module. Create a concise study guide 
covering the key points and assignments. Use clear paragraphs and bullet points 
where appropriate.
```

### Model Call
- Uses `callChatModel()` from `modelGateway`
- Model: `gpt-4-turbo` (configured in agent definition)
- Temperature: 0.7 (default from modelGateway)
- Max tokens: 2000 (default from modelGateway)

## Usage

### Via AI Chat Endpoint

Students or instructors can request summaries through natural language:

```bash
POST /ai/chat
{
  "agentName": "content_helper",
  "message": "Summarize this module.",
  "moduleId": "module_123"
}
```

The AI agent will:
1. Understand the user's intent to summarize
2. Call the `summarize_module` tool with the provided moduleId
3. Return a formatted study guide summary

### Tool Call Flow

1. User sends chat message with module context
2. AI router passes message to chat model with tool definitions
3. Model decides to use `summarize_module` tool
4. Tool execution:
   - Validates permissions
   - Fetches module content
   - Generates summary via LLM
5. Result returned to user in chat response

## Security & Access Control

1. **Tenant Isolation:** Module must belong to user's tenant
2. **Course Membership:** User must have CourseMembership on module's course
3. **Role-Based:** Tool is available to both students and instructors
4. **Permission Enforcement:** Checked at tool execution time via `executeTool()`

## Error Handling

The tool returns clear error messages for:
- Missing or invalid `moduleId`
- Module not found
- Access denied (not in tenant or not enrolled in course)
- LLM generation failures

## Testing

See updated `API_EXAMPLES.md` section 8 for comprehensive examples including:
- List available AI agents
- List available AI tools
- Summarize module as student
- Summarize module as instructor
- Continue conversations with follow-up questions

## Benefits

1. **Study Aid:** Students can quickly generate study guides for exam preparation
2. **Content Review:** Instructors can review module summaries for quality checks
3. **Consistent Format:** AI ensures structured, readable summaries
4. **Comprehensive:** Includes both content pages and assignment information
5. **Natural Interface:** Works through conversational AI chat

## Technical Notes

- The tool builds its own context from the database (doesn't rely on context builder)
- All module content is included in the summary request (no pagination)
- Large modules with many pages may hit token limits (consider chunking for production)
- Summary quality depends on page content quality and structure
- Due dates are formatted as ISO 8601 strings in the summary

