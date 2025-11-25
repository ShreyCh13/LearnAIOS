# Manual Testing Guide - LearnAI OS

## ✅ System Status
- **API Server**: Running on port 3001 ✓
- **Web Server**: Running on port 3000 ✓
- **Database**: Seeded with test data ✓
- **Login Fix**: Applied (using FormData) ✓
- **Pages API Route**: Added ✓

---

## 🐛 Known Issue & Workaround

The form-based login had a React state timing issue. This has been **FIXED** by:
- Using FormData to read values directly from the form
- Adding proper `name` attributes to form inputs
- Added logging for debugging

**The login should now work correctly!**

---

## 🧪 Testing Steps

### Test 1: Login as Instructor

1. Open browser to: **http://localhost:3000**
2. You should be redirected to: **http://localhost:3000/login**
3. Enter email: **instructor@example.com**
4. Click **"Sign In"**
5. ✅ Should redirect to home page showing "My Courses"
6. ✅ Should see the course: "Introduction to AI-Powered Learning"

### Test 2: Navigate to Course Content

1. Click on the **"Introduction to AI-Powered Learning"** course card
2. ✅ Should automatically navigate to the first page
3. ✅ URL should be: `/courses/[courseId]/modules/[moduleId]/pages/[pageId]`
4. ✅ Should see:
   - Left Sidebar: Course name and expandable modules
   - Top Bar: "LearnAI OS / Introduction to AI-Powered Learning / Welcome to the Course"
   - Main Content: The "Welcome!" page with markdown rendered
   - Right Panel: AI Content Helper chat

### Test 3: Check Instructor Dashboard Link

1. Look at the **left sidebar**
2. ✅ At the top, you should see a **green button**: "📚 Instructor Dashboard"
3. Click on it
4. ✅ Navigate to: **http://localhost:3000/instructor**
5. ✅ Should see:
   - Page title: "Instructor Dashboard"
   - Subtitle: "Manage your courses, modules, assignments, and events"
   - "+ Add Course" button
   - The seeded course listed below with action buttons

### Test 4: View Assignments & Events

1. From the Instructor Dashboard or sidebar, navigate back to a course page
2. Click any page in a module
3. **Scroll down** past the page content
4. ✅ Should see two sections:
   - **📝 Assignments** - Lists "Getting Started Quiz" and "AI Fundamentals Assignment"
   - **📅 Events** - Lists "Welcome Webinar" and assignment-related events
5. Click on an assignment
6. ✅ Navigate to: **http://localhost:3000/assignments/[id]**
7. ✅ Should see full assignment details with due date

### Test 5: Create New Course (Instructor)

1. Go to: **http://localhost:3000/instructor**
2. Click **"+ Add Course"**
3. Fill in:
   - Title: "My New Course"
   - Description: "Test course description"
4. Click **"Create"**
5. ✅ New course should appear in the list below

### Test 6: Add Module

1. On the Instructor Dashboard, find your new course
2. Click **"+ Add Module"** (green button)
3. Fill in:
   - Title: "Test Module"
   - Description: "Test description"
4. Click **"Create"**
5. ✅ Module should appear under the course

### Test 7: Add Page to Module

1. Under the module you just created, click **"+ Add Page"** (purple button)
2. Fill in:
   - Title: "Test Page"
   - Content (Markdown): 
     ```markdown
     # Test Page
     
     This is a **test** page with _markdown_ support!
     
     ## Features
     - Lists work
     - So do **bold** and *italic*
     ```
3. Click **"Create"**
4. ✅ Page should appear in the list under the module

### Test 8: Create Assignment

1. Click **"+ Add Assignment"** (orange button)
2. Fill in:
   - Name: "Test Assignment"
   - Description: "Complete this test"
   - Due Date: Select any future date/time
   - Module: Select "Test Module"
3. Click **"Create"**
4. ✅ Success alert should appear

### Test 9: Create Event

1. Click **"+ Add Event"** (purple button)
2. Fill in:
   - Title: "Test Event"
   - Description: "Test event description"
   - Start Date/Time: Pick a date/time
   - End Date/Time: Pick end time
3. Click **"Create"**
4. ✅ Success alert should appear

### Test 10: Enroll Student

1. Click **"+ Enroll Student"** (blue button)
2. Enter: **student@example.com**
3. Click **"Enroll"**
4. ✅ Success alert should appear

### Test 11: Test as Student

1. Click **"Logout"** (top-right corner)
2. Login with: **student@example.com**
3. ✅ Should see enrolled courses in sidebar
4. ✅ Should NOT see "Instructor Dashboard" button
5. Navigate to a course → module → page
6. ✅ Scroll down to see assignments and events

### Test 12: Command Palette

1. While on any module page, click **"⌘K Command Palette"** button
2. ✅ Modal should open with list of AI tools
3. Search for "summarize"
4. ✅ Should show "Summarize Module"
5. Select it (click or press Enter)
6. ✅ Check right panel - AI should generate a module summary

### Test 13: Generate Practice Questions

1. Open command palette again
2. Select "Generate Practice Questions"
3. Enter "5" when prompted
4. ✅ AI should generate 5 practice questions in the chat panel

---

## 🎯 Expected Results

### Home Page (Logged In)
- "My Courses" heading
- Grid of course cards (clickable, with hover effects)
- Course titles and descriptions visible

### Instructor Dashboard
- All enrolled courses listed
- Color-coded action buttons
- Inline forms that appear/disappear
- Nested structure: Courses → Modules → Pages

### Course Content Page
- Three-column layout:
  - Left: Sidebar with course navigation
  - Center: Page content (markdown rendered)
  - Right: AI chat panel
- Top bar with breadcrumb navigation
- Assignments section below content
- Events section below assignments

### Assignment Detail Page
- Assignment name with badge
- Course and module information
- Due date highlighted
- Description
- Placeholder for file attachments

---

## 🔧 Troubleshooting

### If login still fails:
```bash
# In browser console (F12), run:
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'instructor@example.com' })
})
.then(r => r.json())
.then(data => {
  localStorage.setItem('lms_token', data.token);
  location.reload();
});
```

### If course click doesn't work:
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab to see if API calls are succeeding
- The API logs in the terminal will show request/response details

### If pages don't load:
- Check API server is still running (terminal 1)
- Check that the GET /modules/:moduleId/pages route was added
- Test the endpoint directly with curl (see commands below)

---

## 📝 Quick API Tests (Optional)

```bash
# Get a token
TOKEN=$(curl -s -X POST http://localhost:3001/auth/login -H "Content-Type: application/json" -d '{"email":"instructor@example.com"}' | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Test courses endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/courses | jq '.courses[0].title'

# Test modules endpoint  
COURSE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" http://localhost:3001/courses | jq -r '.courses[0].id')
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3001/courses/$COURSE_ID/modules" | jq '.modules[0].name'

# Test pages endpoint
MODULE_ID=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:3001/courses/$COURSE_ID/modules" | jq -r '.modules[0].id')
curl -H "Authorization: Bearer $TOKEN" "http://localhost:3001/modules/$MODULE_ID/pages" | jq '.pages[0].title'
```

---

## ✨ Success Criteria

You've successfully tested everything when:
- ✅ Can login as both instructor and student
- ✅ Can navigate to course content
- ✅ Can see sidebar navigation
- ✅ Can create courses, modules, and pages
- ✅ Can create assignments and events
- ✅ Can see assignments/events on course pages
- ✅ Can view assignment details
- ✅ Command palette works with AI tools
- ✅ AI chat responds to messages

---

## 🎉 All Features Implemented!

**What You Can Do Now:**
- 📚 Full course management (instructor)
- 👨‍🎓 Student learning interface
- 📝 Assignment tracking
- 📅 Event scheduling
- 🤖 AI-powered study assistance
- ⌨️ Command palette for quick actions
- 🔐 Role-based access control

**Happy Testing!** 🚀


