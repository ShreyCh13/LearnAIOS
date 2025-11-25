# API Examples - Teacher & Student Endpoints

This document provides sample curl commands for testing the teacher and student endpoints.

## Prerequisites

- API server running on `http://localhost:4000`
- Database seeded with test users:
  - `instructor@example.com` (instructor role)
  - `student@example.com` (student role)

## 1. Authentication

### Login as Instructor

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "instructor@example.com"
  }'
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_id",
    "email": "instructor@example.com",
    "name": "Instructor Name",
    "role": "instructor"
  }
}
```

Save the token for subsequent requests:
```bash
INSTRUCTOR_TOKEN="<token_from_response>"
```

### Login as Student

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@example.com"
  }'
```

Save the token:
```bash
STUDENT_TOKEN="<token_from_response>"
```

## 2. Course Management (Instructor Only)

### Create a Course

```bash
curl -X POST http://localhost:4000/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "title": "Introduction to Computer Science",
    "description": "Learn the fundamentals of programming and computer science"
  }'
```

**Response:**
```json
{
  "course": {
    "id": "course_123",
    "title": "Introduction to Computer Science",
    "description": "Learn the fundamentals of programming and computer science",
    "tenantId": "tenant_1",
    "createdAt": "2025-11-25T10:00:00.000Z"
  }
}
```

Save the course ID:
```bash
COURSE_ID="<course_id_from_response>"
```

### Enroll a Student in the Course

```bash
curl -X POST http://localhost:4000/courses/$COURSE_ID/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "email": "student@example.com",
    "role": "student"
  }'
```

**Response:**
```json
{
  "membership": {
    "id": "membership_123",
    "userId": "user_456",
    "email": "student@example.com",
    "role": "student"
  }
}
```

### List Course Enrollments

```bash
curl -X GET http://localhost:4000/courses/$COURSE_ID/enrollments \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

**Response:**
```json
{
  "enrollments": [
    {
      "id": "membership_1",
      "userId": "user_123",
      "email": "instructor@example.com",
      "name": "Instructor Name",
      "role": "instructor",
      "createdAt": "2025-11-25T10:00:00.000Z"
    },
    {
      "id": "membership_2",
      "userId": "user_456",
      "email": "student@example.com",
      "name": "Student Name",
      "role": "student",
      "createdAt": "2025-11-25T10:05:00.000Z"
    }
  ]
}
```

## 3. Module Management (Instructor Only)

### Create a Module

```bash
curl -X POST http://localhost:4000/courses/$COURSE_ID/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "name": "Week 1: Introduction to Programming",
    "position": 0
  }'
```

**Response:**
```json
{
  "module": {
    "id": "module_123",
    "courseId": "course_123",
    "name": "Week 1: Introduction to Programming",
    "position": 0,
    "createdAt": "2025-11-25T10:10:00.000Z"
  }
}
```

Save the module ID:
```bash
MODULE_ID="<module_id_from_response>"
```

### Create a Page in the Module

```bash
curl -X POST http://localhost:4000/modules/$MODULE_ID/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "title": "Introduction to Variables",
    "bodyMarkdown": "# Variables in Programming\n\nVariables are containers for storing data values..."
  }'
```

**Response:**
```json
{
  "page": {
    "id": "page_123",
    "title": "Introduction to Variables",
    "bodyMarkdown": "# Variables in Programming\n\nVariables are containers...",
    "courseId": "course_123",
    "moduleId": "module_123",
    "createdAt": "2025-11-25T10:15:00.000Z"
  }
}
```

## 4. Assignment Management

### Create an Assignment (Instructor Only)

```bash
curl -X POST http://localhost:4000/courses/$COURSE_ID/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "name": "Homework 1: Variables and Data Types",
    "description": "Complete the exercises on variables and data types from the textbook",
    "dueAt": "2025-12-01T23:59:59.000Z",
    "points": 100,
    "moduleId": "'$MODULE_ID'"
  }'
```

**Response:**
```json
{
  "assignment": {
    "id": "assignment_123",
    "courseId": "course_123",
    "moduleId": "module_123",
    "name": "Homework 1: Variables and Data Types",
    "description": "Complete the exercises on variables and data types from the textbook",
    "dueAt": "2025-12-01T23:59:59.000Z",
    "points": 100,
    "createdAt": "2025-11-25T10:20:00.000Z"
  }
}
```

Note: This also automatically creates a calendar event for the assignment.

Save the assignment ID:
```bash
ASSIGNMENT_ID="<assignment_id_from_response>"
```

### List Assignments (Student or Instructor)

As instructor:
```bash
curl -X GET http://localhost:4000/courses/$COURSE_ID/assignments \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

As student:
```bash
curl -X GET http://localhost:4000/courses/$COURSE_ID/assignments \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Response:**
```json
{
  "assignments": [
    {
      "id": "assignment_123",
      "courseId": "course_123",
      "moduleId": "module_123",
      "name": "Homework 1: Variables and Data Types",
      "description": "Complete the exercises on variables and data types from the textbook",
      "dueAt": "2025-12-01T23:59:59.000Z",
      "points": 100,
      "createdAt": "2025-11-25T10:20:00.000Z",
      "module": {
        "id": "module_123",
        "name": "Week 1: Introduction to Programming"
      }
    }
  ]
}
```

### Get Assignment Details (Student or Instructor)

```bash
curl -X GET http://localhost:4000/assignments/$ASSIGNMENT_ID \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Response:**
```json
{
  "assignment": {
    "id": "assignment_123",
    "courseId": "course_123",
    "moduleId": "module_123",
    "name": "Homework 1: Variables and Data Types",
    "description": "Complete the exercises on variables and data types from the textbook",
    "dueAt": "2025-12-01T23:59:59.000Z",
    "points": 100,
    "createdAt": "2025-11-25T10:20:00.000Z",
    "course": {
      "id": "course_123",
      "title": "Introduction to Computer Science",
      "description": "Learn the fundamentals of programming and computer science",
      "tenantId": "tenant_1",
      "createdAt": "2025-11-25T10:00:00.000Z"
    },
    "module": {
      "id": "module_123",
      "name": "Week 1: Introduction to Programming"
    }
  }
}
```

## 5. Calendar Event Management

### Create a Calendar Event (Instructor Only)

```bash
curl -X POST http://localhost:4000/courses/$COURSE_ID/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "title": "Office Hours",
    "description": "Weekly office hours for questions and discussion",
    "startAt": "2025-11-26T14:00:00.000Z",
    "endAt": "2025-11-26T15:00:00.000Z"
  }'
```

**Response:**
```json
{
  "event": {
    "id": "event_123",
    "courseId": "course_123",
    "title": "Office Hours",
    "description": "Weekly office hours for questions and discussion",
    "startAt": "2025-11-26T14:00:00.000Z",
    "endAt": "2025-11-26T15:00:00.000Z",
    "assignmentId": null,
    "createdAt": "2025-11-25T10:25:00.000Z"
  }
}
```

### List Calendar Events (Student or Instructor)

As instructor:
```bash
curl -X GET http://localhost:4000/courses/$COURSE_ID/events \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

As student:
```bash
curl -X GET http://localhost:4000/courses/$COURSE_ID/events \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Response:**
```json
{
  "events": [
    {
      "id": "event_123",
      "courseId": "course_123",
      "title": "Office Hours",
      "description": "Weekly office hours for questions and discussion",
      "startAt": "2025-11-26T14:00:00.000Z",
      "endAt": "2025-11-26T15:00:00.000Z",
      "assignmentId": null,
      "createdAt": "2025-11-25T10:25:00.000Z",
      "assignment": null
    },
    {
      "id": "event_456",
      "courseId": "course_123",
      "title": "Homework 1: Variables and Data Types",
      "description": "Complete the exercises on variables and data types from the textbook",
      "startAt": "2025-12-01T23:59:59.000Z",
      "endAt": "2025-12-01T23:59:59.000Z",
      "assignmentId": "assignment_123",
      "createdAt": "2025-11-25T10:20:00.000Z",
      "assignment": {
        "id": "assignment_123",
        "name": "Homework 1: Variables and Data Types"
      }
    }
  ]
}
```

## 6. Course Listing (Student vs Instructor)

### List Courses as Instructor

```bash
curl -X GET http://localhost:4000/courses \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN"
```

Returns all courses where the instructor is a member.

### List Courses as Student

```bash
curl -X GET http://localhost:4000/courses \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

Returns only courses where the student is enrolled (has a CourseMembership).

**Response:**
```json
{
  "courses": [
    {
      "id": "course_123",
      "title": "Introduction to Computer Science",
      "description": "Learn the fundamentals of programming and computer science",
      "tenantId": "tenant_1",
      "createdAt": "2025-11-25T10:00:00.000Z"
    }
  ]
}
```

## 7. View Course Content (Student)

### View Course Details

```bash
curl -X GET http://localhost:4000/courses/$COURSE_ID \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### View Course Modules

```bash
curl -X GET http://localhost:4000/courses/$COURSE_ID/modules \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### View Pages in a Module

```bash
curl -X GET http://localhost:4000/modules/$MODULE_ID/pages \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

### View a Specific Page

```bash
PAGE_ID="<page_id>"
curl -X GET http://localhost:4000/pages/$PAGE_ID \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

## Error Responses

### 401 Unauthorized
Missing or invalid authentication token.

```json
{
  "error": "Missing or invalid authorization header"
}
```

### 403 Forbidden
User doesn't have the required role or course membership.

```json
{
  "error": "Only instructors can create courses"
}
```

or

```json
{
  "error": "You are not a member of this course"
}
```

### 404 Not Found
Resource doesn't exist.

```json
{
  "error": "Course not found"
}
```

### 400 Bad Request
Invalid or missing required fields.

```json
{
  "error": "Title is required"
}
```

## Complete Workflow Example

Here's a complete workflow demonstrating the teacher and student operations:

```bash
# 1. Login as instructor
INSTRUCTOR_TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "instructor@example.com"}' | jq -r '.token')

# 2. Create a course
COURSE_ID=$(curl -s -X POST http://localhost:4000/courses \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{"title": "CS101", "description": "Intro to CS"}' | jq -r '.course.id')

# 3. Create a module
MODULE_ID=$(curl -s -X POST http://localhost:4000/courses/$COURSE_ID/modules \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{"name": "Week 1", "position": 0}' | jq -r '.module.id')

# 4. Create a page
curl -X POST http://localhost:4000/modules/$MODULE_ID/pages \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{"title": "Introduction", "bodyMarkdown": "# Welcome to CS101"}'

# 5. Create an assignment
curl -X POST http://localhost:4000/courses/$COURSE_ID/assignments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "name": "HW1",
    "description": "First homework",
    "dueAt": "2025-12-01T23:59:59.000Z",
    "points": 100
  }'

# 6. Create a calendar event
curl -X POST http://localhost:4000/courses/$COURSE_ID/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "title": "Lecture 1",
    "description": "Introduction to programming",
    "startAt": "2025-11-26T10:00:00.000Z",
    "endAt": "2025-11-26T11:30:00.000Z"
  }'

# 7. Enroll a student
curl -X POST http://localhost:4000/courses/$COURSE_ID/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{"email": "student@example.com", "role": "student"}'

# 8. Login as student
STUDENT_TOKEN=$(curl -s -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "student@example.com"}' | jq -r '.token')

# 9. View courses as student
curl -X GET http://localhost:4000/courses \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# 10. View assignments
curl -X GET http://localhost:4000/courses/$COURSE_ID/assignments \
  -H "Authorization: Bearer $STUDENT_TOKEN"

# 11. View calendar events
curl -X GET http://localhost:4000/courses/$COURSE_ID/events \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

## 8. AI Assistant - Module Summarization

### List Available AI Agents

```bash
curl -X GET http://localhost:4000/ai/agents \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Response:**
```json
{
  "agents": [
    {
      "name": "content_helper",
      "description": "Helps students and instructors understand course pages, answer questions using course content, generate practice questions, and summarize modules.",
      "uiSurfaces": "side_panel",
      "targetRoles": "student,instructor"
    }
  ]
}
```

### List Available AI Tools

```bash
curl -X GET http://localhost:4000/ai/tools \
  -H "Authorization: Bearer $STUDENT_TOKEN"
```

**Response:**
```json
{
  "tools": [
    {
      "name": "search_course_content",
      "displayName": "Search course content",
      "description": "Searches pages in the current course by query and returns snippets.",
      "contextTypes": "course_page",
      "latencyClass": "sync"
    },
    {
      "name": "generate_practice_questions",
      "displayName": "Generate practice questions",
      "description": "Generate practice questions based on pages in a module.",
      "contextTypes": "course_page,module_page",
      "latencyClass": "sync"
    },
    {
      "name": "summarize_module",
      "displayName": "Summarize Module",
      "description": "Summarize the pages and assignments in a module into a study guide.",
      "contextTypes": "module_page",
      "latencyClass": "sync"
    }
  ]
}
```

### Summarize a Module (Student)

Students can request a study guide summary of a module:

```bash
curl -X POST http://localhost:4000/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "agentName": "content_helper",
    "message": "Summarize this module.",
    "moduleId": "'$MODULE_ID'"
  }'
```

**Response:**
```json
{
  "conversationId": "conv_123",
  "reply": "# Study Guide: Week 1 - Introduction to Programming\n\n## Overview\nThis module covers the fundamentals of programming...\n\n## Key Topics\n- Variables and data types\n- Basic programming syntax\n- Problem-solving strategies\n\n## Assignments\n- **Homework 1: Variables and Data Types** - Due: December 1, 2025\n  Complete the exercises on variables and data types from the textbook.",
  "toolCalls": [
    {
      "name": "summarize_module",
      "arguments": {
        "moduleId": "module_123"
      },
      "result": {
        "summary": "# Study Guide: Week 1 - Introduction to Programming..."
      }
    }
  ]
}
```

### Summarize a Module (Instructor)

Instructors can also request module summaries:

```bash
curl -X POST http://localhost:4000/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $INSTRUCTOR_TOKEN" \
  -d '{
    "agentName": "content_helper",
    "message": "Can you create a study guide for this module?",
    "moduleId": "'$MODULE_ID'"
  }'
```

### Continue a Conversation

To continue an existing conversation, include the `conversationId`:

```bash
curl -X POST http://localhost:4000/ai/chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -d '{
    "agentName": "content_helper",
    "message": "Can you make it more concise?",
    "conversationId": "conv_123",
    "moduleId": "'$MODULE_ID'"
  }'
```

