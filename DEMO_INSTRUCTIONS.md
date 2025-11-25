# Demo Instructions - LearnAI OS Frontend (Prompt 13)

This guide will help you test all the new instructor and student features.

## Prerequisites

Make sure both the API and Web servers are running:

```bash
# Terminal 1 - API Server
cd apps/api
npm run dev

# Terminal 2 - Web Server
cd apps/web
npm run dev
```

Access the application at: http://localhost:3000

---

## Part 1: Instructor Experience

### 1. Login as Instructor

1. Navigate to http://localhost:3000/login
2. Login with email: **instructor@example.com**
3. Leave name blank or enter any name
4. Click "Login"

### 2. Access Instructor Dashboard

1. After login, look at the left sidebar
2. You should see a **"📚 Instructor Dashboard"** button at the top (green background)
3. Click it to navigate to the Instructor Dashboard

### 3. Create a New Course

1. On the Instructor Dashboard, click **"+ Add Course"**
2. Fill in:
   - **Title**: "Introduction to Machine Learning"
   - **Description**: "Learn the fundamentals of ML and AI"
3. Click **"Create"**
4. The course should appear in the list below

### 4. Add Modules to the Course

1. Find your newly created course
2. Click **"+ Add Module"** button (green)
3. Fill in:
   - **Title**: "Module 1: Python Basics"
   - **Description**: "Introduction to Python programming"
4. Click **"Create"**
5. Repeat to add another module:
   - **Title**: "Module 2: Data Analysis"
   - **Description**: "Working with pandas and numpy"

### 5. Add Pages to Modules

1. Find "Module 1: Python Basics" under your course
2. Click **"+ Add Page"** button (purple)
3. Fill in:
   - **Title**: "Variables and Data Types"
   - **Content**: 
     ```markdown
     # Variables in Python
     
     Python supports several data types:
     - Integers (int)
     - Floating point (float)
     - Strings (str)
     - Booleans (bool)
     
     ## Example
     ```python
     name = "Alice"
     age = 25
     ```
     ```
4. Click **"Create"**
5. Add another page to Module 1:
   - **Title**: "Control Flow"
   - **Content**: "Learn about if statements, loops, and more..."

### 6. Create Assignments

1. Click **"+ Add Assignment"** button (orange/yellow)
2. Fill in:
   - **Name**: "Python Variables Quiz"
   - **Description**: "Complete exercises on variables and data types"
   - **Due Date**: Select a future date and time
   - **Module**: Select "Module 1: Python Basics"
3. Click **"Create"**
4. You should see a success message

### 7. Create Events

1. Click **"+ Add Event"** button (purple)
2. Fill in:
   - **Title**: "Office Hours"
   - **Description**: "Weekly Q&A session"
   - **Start Date/Time**: Select a date/time
   - **End Date/Time**: Select an end time (1-2 hours later)
3. Click **"Create"**
4. You should see a success message

### 8. Enroll Student

1. Click **"+ Enroll Student"** button (blue)
2. Enter email: **student@example.com**
3. Click **"Enroll"**
4. You should see a success message

---

## Part 2: Student Experience

### 1. Logout and Login as Student

1. Click **"Logout"** button in the top-right corner
2. Login with email: **student@example.com**
3. Click "Login"

### 2. Navigate to Course Content

1. In the left sidebar, you should see "Introduction to Machine Learning"
2. Click on the course name
3. You should see the modules expand below it
4. Click on "Module 1: Python Basics"
5. Click on "Variables and Data Types" page

### 3. View Page Content

1. The main content area should display the page content in formatted Markdown
2. The page title should appear in the top bar breadcrumb

### 4. View Assignments

1. Scroll down below the page content
2. You should see a **"📝 Assignments"** section
3. The "Python Variables Quiz" assignment should be listed with its due date
4. Click on the assignment

### 5. View Assignment Details

1. You should be taken to the assignment detail page
2. You should see:
   - Assignment name
   - Course and module information
   - Due date highlighted in red
   - Assignment description
   - Placeholder for file attachments (coming later)
   - Disabled "Submit Assignment" button (placeholder)
3. Click **"← Back"** to return to the course page

### 6. View Events

1. Back on the course page, scroll down past the assignments
2. You should see a **"📅 Events"** section
3. The "Office Hours" event should be listed with start/end times

---

## Part 3: Command Palette & AI Features

### 1. Test Command Palette

1. While on a module page (e.g., "Variables and Data Types")
2. Click the **"⌘K Command Palette"** button in the top bar
3. A modal should appear showing available AI tools

### 2. Search for Tools

1. In the search box, type "summarize"
2. You should see the "Summarize Module" tool
3. You can use arrow keys (↑↓) to navigate
4. Press Enter or click to select

### 3. Use Summarize Module Tool

1. Select "Summarize Module" from the command palette
2. The palette will close automatically
3. Check the AI Chat Panel on the right side
4. You should see:
   - Your request: "Summarize this module."
   - The AI's response with a summary of the module content

### 4. Test Generate Practice Questions

1. Open the command palette again (⌘K button)
2. Select "Generate Practice Questions"
3. When prompted, enter "3" for the number of questions
4. Click OK
5. Check the AI Chat Panel for generated practice questions

---

## Part 4: Verify All Features

### Checklist for Instructor Dashboard:
- ✅ Instructor Dashboard link visible only for instructors
- ✅ Can create courses with title and description
- ✅ Can add modules to courses
- ✅ Can add pages to modules with Markdown content
- ✅ Can create assignments with due dates and module selection
- ✅ Can create events with start/end times
- ✅ Can enroll students by email
- ✅ All forms have cancel buttons
- ✅ Success messages appear after creation
- ✅ Lists refresh after creating items

### Checklist for Student View:
- ✅ Assignments section appears below page content
- ✅ Assignment cards are clickable and styled nicely
- ✅ Assignment detail page shows all information
- ✅ Events section displays with date/time
- ✅ Empty states show when no assignments/events exist
- ✅ Navigation works correctly

### Checklist for Command Palette:
- ✅ Command palette opens from top bar
- ✅ Shows available tools
- ✅ Search filters tools correctly
- ✅ Keyboard navigation works (↑↓ Enter Esc)
- ✅ Summarize Module tool works when on a module page
- ✅ Generate Practice Questions prompts for count
- ✅ AI responses appear in chat panel
- ✅ moduleId is passed correctly to the AI

---

## Troubleshooting

### Issue: "Instructor Dashboard" link not showing
- **Solution**: Make sure you're logged in as instructor@example.com

### Issue: No courses showing for student
- **Solution**: Make sure you enrolled the student from the Instructor Dashboard

### Issue: Assignments/Events not showing
- **Solution**: Make sure you created them from the Instructor Dashboard and they belong to the correct course

### Issue: Summarize Module doesn't work
- **Solution**: Make sure you're on a module page (not just any page). The URL should include both courseId and moduleId

### Issue: API errors (403, 404)
- **Solution**: 
  1. Check that the API server is running on port 3001
  2. Check that you're logged in
  3. Check browser console for detailed error messages

---

## Expected Behavior Summary

### Instructor Dashboard:
- Clean, organized layout with collapsible forms
- Color-coded buttons for different actions
- Nested structure: Courses → Modules → Pages
- Inline forms that appear/disappear as needed
- Simple validation and error handling

### Student Course Page:
- Page content displayed in Markdown
- Assignments listed with clickable cards
- Events listed with formatted dates
- Empty states for missing content
- Clean, readable design

### Assignment Detail Page:
- Full assignment information
- Back button for easy navigation
- Visual hierarchy with badges and styling
- Placeholder for future features (file upload, submission)

### Command Palette:
- Fast, keyboard-friendly interface
- Contextual tools based on current page
- Integration with AI chat panel
- Automatic tool discovery from backend

---

## What Was NOT Implemented

As per the requirements, the following were **intentionally not implemented**:
- ❌ File upload/attachment functionality
- ❌ Assignment submission functionality
- ❌ Real-time notifications
- ❌ Assignment grading
- ❌ Course analytics
- ❌ User profile pages

These are noted as "coming later" in the UI where appropriate.

---

## Success Criteria

You've successfully tested all features if:
1. ✅ Instructors can create complete course structures
2. ✅ Students can view courses, assignments, and events
3. ✅ Command palette integrates with AI features
4. ✅ All forms work and validate correctly
5. ✅ Navigation flows smoothly between all pages
6. ✅ No console errors or crashes
7. ✅ UI is clean and user-friendly

---

## Next Steps

After verifying all features work:
1. Test with multiple courses
2. Test with multiple students
3. Test edge cases (very long text, many assignments, etc.)
4. Verify error handling (invalid dates, missing fields, etc.)

Congratulations! 🎉 The instructor interface and student features are now fully functional!

