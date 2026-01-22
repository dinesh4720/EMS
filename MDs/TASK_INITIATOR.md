# Task Initiator - Automated Testing Workflow

> **🤖 AUTONOMOUS MODE:** Proceed automatically with all actions EXCEPT file deletions. Fix errors, install packages, create/modify files, run tests WITHOUT asking. Only ask confirmation for: file deletions, major architecture changes, breaking API changes, production deployments.

**Quick Reference:**
- ✅ Auto-do: Install, create, modify, fix, test, iterate
- ⚠️ Ask first: Delete files, break APIs, deploy to production

## Overview

This document defines the standard workflow for implementing features with automated console error detection using Puppeteer.

## 🤖 AUTONOMOUS MODE RULES

**CRITICAL:** When working with Claude Code or AI assistants, follow these autonomous behavior rules:

### Automatic Actions (Proceed Without Asking)
✅ **DO automatically:**
- Install packages/dependencies
- Create new files
- Modify existing files
- Execute commands (npm, git, curl, etc.)
- Fix errors and bugs
- Refactor code
- Run tests and checks
- Make decisions based on best practices
- Choose the most robust approach when multiple options exist
- Continue iterating on errors without permission

### Actions Requiring Confirmation
⚠️ **ASK before:**
- **Deleting files** - Always get explicit confirmation
- **Major architecture changes** - Discuss significant refactors
- **Breaking changes** - Confirm API changes that affect other systems
- **Database migrations** - Verify before running destructive migrations
- **Deployment to production** - Confirm production deployments

### Examples

❌ **BAD (Don't ask):**
- "Should I install this package?" → ✅ **Just install it**
- "Would you like me to fix this error?" → ✅ **Just fix it**
- "Can I create this file?" → ✅ **Just create it**
- "Should I run the tests?" → ✅ **Just run them**

✅ **GOOD (Do ask):**
- "About to delete 15 files. Confirm?" → ⚠️ **Wait for confirmation**
- "This will break the authentication API. Proceed?" → ⚠️ **Wait for confirmation**
- "Ready to deploy to production. Confirm?" → ⚠️ **Wait for confirmation**

### Decision-Making Principles

1. **Speed Over Permission:** Default to action, ask only for destructive operations
2. **Best Practices First:** Choose industry-standard approaches automatically
3. **Error Iteration:** Keep fixing errors without asking "should I try X?"
4. **Progress Tracking:** Use todo lists to show progress, don't ask for approval
5. **Confident Execution:** If 90% sure it's right, just do it

### Anti-Patterns to Avoid

❌ Don't say: "I could try X or Y, which would you prefer?"
❌ Don't say: "Should I proceed with this fix?"
❌ Don't say: "Would you like me to create a backup?"
❌ Don't say: "Do you want me to run the console check?"

✅ Instead: "Trying fix X..." (and just do it)
✅ Instead: "Creating backup..." (and just do it)
✅ Instead: "Running console check..." (and just do it)

## Prerequisites

### Required Dependencies
```bash
npm install --save-dev puppeteer
```

### Console Error Checker Script

Save this as `check-console.js` in your project root:

```javascript
// check-console.js
const puppeteer = require('puppeteer');

async function checkConsoleErrors(url) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });

  page.on('pageerror', error => {
    errors.push(error.message);
  });

  await page.goto(url);
  await page.waitForTimeout(2000); // Wait for page to load

  await browser.close();

  if (errors.length > 0) {
    console.log(JSON.stringify({ errors }, null, 2));
    process.exit(1);
  } else {
    console.log('No errors detected');
    process.exit(0);
  }
}

checkConsoleErrors(process.argv[2] || 'http://localhost:3000');
```

## Standard Development Workflow

### Phase 0: Pre-Flight Checks ⚠️ **CRITICAL**
Before running any console checks or testing features:

1. **Check MongoDB Status:**
   ```bash
   # Windows
   tasklist | findstr mongod

   # Or if running as service
   net start MongoDB

   # If not running, start MongoDB
   # Option 1: As service
   net start MongoDB

   # Option 2: Manual start (if installed locally)
   "C:\Program Files\MongoDB\Server\X.X\bin\mongod.exe" --dbpath "C:\data\db"
   ```

2. **Check Backend Server Status:**
   ```bash
   # Check if backend is running on port 3001
   curl http://localhost:3001/api

   # Or check port
   netstat -ano | findstr :3001

   # If not running, start backend
   cd backend
   npm start

   # Or in background
   npm run dev
   ```

3. **Verify Frontend Dev Server:**
   ```bash
   # Check if Vite is running (usually port 5173)
   curl http://localhost:5173

   # If not running, start frontend
   cd school-dashboard
   npm run dev
   ```

4. **Quick Health Check:**
   ```bash
   # Test API endpoints
   curl http://localhost:3001/api/announcements
   curl http://localhost:3001/api/reminders

   # Should return JSON response (empty array or data)
   # If it hangs, MongoDB is likely not running!
   ```

5. **Check Backend Logs:** ⚠️ **CRITICAL**
   ```bash
   # If backend is running but API returns errors or hangs
   # Check the backend logs for errors

   # Option 1: If backend is running in terminal
   # Look at the terminal output for errors like:
   # - "MongooseError: Connection failed"
   # - "MongoServerError: Authentication failed"
   # - "ECONNREFUSED mongodb://localhost:27017"

   # Option 2: Check backend log file (if logging to file)
   tail -f backend/logs/error.log
   tail -f backend/logs/combined.log

   # Option 3: If running as PM2 process
   pm2 logs backend

   # Option 4: Check Windows Event Viewer (if running as service)
   eventvwr.msc

   # Common Backend Errors to Look For:
   # - "MongoNotConnectedError" → MongoDB not running
   # - "EADDRINUSE: address already in use :::3001" → Port conflict
   # - "Unauthorized" → Wrong MongoDB credentials
   # - "Database validation failed" → Data schema issues
   ```

### Phase 1: Setup
1. Ensure your development server is running:
   ```bash
   npm start
   ```

2. Verify the console checker is installed:
   ```bash
   node check-console.js --help
   ```

### Phase 2: Implementation

When implementing any new feature or bug fix, follow this workflow:

#### Step 1: Implement the Feature
- Write your code changes
- Follow project coding standards
- Include necessary error handling

#### Step 2: Run Console Error Check
```bash
node check-console.js http://localhost:3000
```

**Expected Output:**
- Success: `No errors detected` (exit code 0)
- Failure: JSON array of errors (exit code 1)

#### Step 3: Analyze and Fix Errors

If errors are detected:
1. **Check Frontend Console Errors:**
   - Review browser console for JavaScript errors
   - Check for API timeout errors
   - Look for network failures

2. **Check Backend Logs:** ⚠️ **CRITICAL**
   - View backend terminal output
   - Check for MongoDB connection errors
   - Look for database validation errors
   - Review server startup logs

3. **Identify the Root Cause:**
   - Is it a frontend issue? (UI, state management, API calls)
   - Is it a backend issue? (Database, API routes, authentication)
   - Is it a network issue? (CORS, timeouts, wrong URLs)

4. **Implement Fixes:**
   - Fix the identified issue
   - Add error handling if missing
   - Test the fix locally

5. **Document the Fix:**
   - Add comments explaining the fix
   - Update relevant documentation

#### Step 4: Repeat Testing
Continue running Steps 2-3 until:
- `check-console.js` returns exit code 0
- No console errors remain
- All functionality works as expected

#### Step 5: Completion Checklist
- [ ] Console error check passes (exit code 0)
- [ ] Manual testing confirms feature works
- [ ] No regression in existing features
- [ ] Code follows project standards
- [ ] Changes are committed with descriptive message

## Error Analysis Guide

### Common Console Errors

#### 1. API Timeout Errors
**Symptoms:**
- `⏱️ API Timeout: http://localhost:3001/api/...`
- Infinite loading spinner
- "Request timeout - please check if backend is running"

**Causes:**
- Backend server not running
- MongoDB not running
- Database connection issues
- Network connectivity problems

**Solutions:**
```javascript
// Check if backend is running
curl http://localhost:3001/api

// Check if MongoDB is running
// Windows:
net start MongoDB
// Or check process:
tasklist | findstr mongod

// Start backend server
cd backend
npm start

// Better: Add timeout and retry logic
const [error, setError] = useState(null);
const [loading, setLoading] = useState(true);

try {
  const response = await api.getData();
  setData(response);
} catch (error) {
  setError(error.message);
  toast.error(`Failed to load: ${error.message}`);
} finally {
  setLoading(false);
}

// Show error state with retry button
{error && data.length === 0 && (
  <div className="error-state">
    <p>Failed to load data: {error}</p>
    <Button onPress={() => loadData()}>Retry</Button>
  </div>
)}
```

**Best Practices:**
- Set API timeout to 10 seconds (not 90+ seconds)
- Show loading indicator with timeout message
- Display error state with retry button
- Check backend and MongoDB status first
- Use exponential backoff for retries
- **Always check backend logs when API fails** ⚠️

#### 1.5 Backend Log Analysis Guide ⚠️ **CRITICAL**

**When to Check Backend Logs:**
- API requests timeout or hang
- Frontend shows "Network Error" or 500 errors
- Data not loading or saving
- Authentication issues
- Any unexpected behavior

**How to Check Backend Logs:**

```bash
# Method 1: Backend Running in Terminal (Most Common)
# Simply look at the terminal where you ran:
# cd backend && npm start

# Method 2: Real-time Log Monitoring
# If logging to file
tail -f backend/logs/error.log
tail -f backend/logs/combined.log

# Method 3: PM2 Process Manager
pm2 logs
pm2 logs backend --lines 100

# Method 4: Docker/Container
docker logs <container-name> -f
docker-compose logs backend -f
```

**Common Backend Log Patterns:**

**MongoDB Connection Issues:**
```
❌ MongooseError: Connection failed
❌ MongoServerError: Authentication failed
❌ ECONNREFUSED mongodb://localhost:27017
❌ connect ECONNREFUSED 127.0.0.1:27017

✅ Solution: Start MongoDB service
✅ Check MongoDB connection string in .env
✅ Verify MongoDB credentials
```

**Port Conflict Issues:**
```
❌ EADDRINUSE: address already in use :::3001
❌ Error: listen EADDRINUSE: address already in use :::3001

✅ Solution: Kill process using port 3001
✅ netstat -ano | findstr :3001
✅ taskkill /PID <PID> /F
```

**Database Validation Errors:**
```
❌ ValidationError: <field> is required
❌ CastError: Cast to ObjectId failed
❌ MongoServerError: Document validation failed

✅ Solution: Check data being sent matches schema
✅ Verify required fields are present
✅ Check data types match schema definition
```

**Authentication/Authorization Errors:**
```
❌ Unauthorized: Invalid token
❌ JWT malformed
❌ 401 Unauthorized
❌ 403 Forbidden

✅ Solution: Check token in localStorage/sessionStorage
✅ Verify token hasn't expired
✅ Check user permissions
```

**Import/Module Errors:**
```
❌ Cannot find module './routes/xxx'
❌ SyntaxError: Unexpected token
❌ ReferenceError: <variable> is not defined

✅ Solution: Check file paths in imports
✅ Verify all dependencies installed
✅ Check for syntax errors in code
```

**Log Analysis Checklist:**
- [ ] Scanned entire log file for errors
- [ ] Identified first error occurrence
- [ ] Checked error stack trace for file/line numbers
- [ ] Verified error messages and codes
- [ ] Cross-referenced with frontend console errors
- [ ] Checked recent code changes that might have caused issue
- [ ] Verified environment variables are set correctly
- [ ] Confirmed all dependencies installed

#### 2. TypeError: Cannot read property 'X' of undefined
**Cause:** Accessing properties on undefined objects
**Solution:** Add null checks or optional chaining
```javascript
// Bad
user.name

// Good
user?.name
```

#### 3. TypeError: X is not a function
**Cause:** Calling non-function values
**Solution:** Verify function imports and bindings

#### 4. ReferenceError: X is not defined
**Cause:** Missing imports or typos
**Solution:** Check import statements and variable names

#### 5. Network Errors (Non-timeout)
**Cause:** Failed API calls or missing resources
**Solution:** Verify endpoints and add error handling

## Prompt Template for AI Assistants

When working with AI assistants (GLM 4.7, Claude, etc.), use this prompt template:

```
Complete this feature with the following workflow:

## Feature Requirements
[Insert feature description here]

## Implementation Workflow
1. Implement the feature following project standards
2. Run `node check-console.js http://localhost:3000` to check for errors
3. If errors are found:
   - Analyze the error output
   - Identify root causes
   - Implement fixes
4. Repeat steps 2-3 until no errors remain
5. Only mark complete when check-console.js returns exit code 0

## Success Criteria
- Zero console errors
- Feature works as specified
- No regressions in existing functionality
- Code follows project conventions

## Testing URL
http://localhost:3000[specific-route-if-needed]
```

## Automation Scripts

### Package.json Scripts

Add these to your `package.json`:

```json
{
  "scripts": {
    "check-console": "node check-console.js http://localhost:3000",
    "check-console:staging": "node check-console.js https://staging.example.com",
    "check-console:production": "node check-console.js https://example.com",
    "dev:check": "npm start & sleep 5 && npm run check-console"
  }
}
```

### Pre-commit Hook

Create `.git/hooks/pre-commit`:

```bash
#!/bin/sh
npm run check-console
if [ $? -ne 0 ]; then
  echo "❌ Console errors detected. Please fix before committing."
  exit 1
fi
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Console Error Check

on: [push, pull_request]

jobs:
  check-console:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm install
      - name: Install Puppeteer
        run: npm install --save-dev puppeteer
      - name: Start development server
        run: npm start &
      - name: Wait for server
        run: sleep 10
      - name: Check console errors
        run: node check-console.js http://localhost:3000
```

## Troubleshooting

### Puppeteer Installation Issues

If you encounter Chromium download issues:

```bash
# Skip Chromium download
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer

# Use installed Chrome
# Modify check-console.js to use:
const browser = await puppeteer.launch({
  executablePath: '/path/to/chrome'
});
```

### Timeout Issues

If pages take longer to load:

```javascript
// Increase wait time in check-console.js
await page.waitForTimeout(5000); // 5 seconds instead of 2
```

### Authentication Required

For protected pages:

```javascript
// Add authentication before goto
await page.goto(url, {
  waitUntil: 'networkidle0'
});
```

## Best Practices

1. **Run checks frequently** - Don't wait until implementation is complete
2. **Fix errors immediately** - Small fixes are easier than large refactors
3. **Document patterns** - Keep a log of common errors and solutions
4. **Test in multiple environments** - Dev, staging, production
5. **Monitor build times** - Optimize if tests become too slow

## Exit Code Reference

- `0` - Success, no errors detected
- `1` - Errors detected, check output for details
- `2` - Configuration or setup error

## Reporting

### Daily Standup Template
```
Console Error Status: ✅ Clean / ⚠️ X errors
Top Issues:
- [Issue 1]
- [Issue 2]
Fixes Implemented:
- [Fix 1]
```

### Sprint Summary
```
Total Checks Run: X
Errors Detected: Y
Errors Fixed: Z
Average Fix Time: X minutes
Most Common Error Type: [Type]
```

## Additional Resources

- [Puppeteer Documentation](https://pptr.dev/)
- [JavaScript Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error)
- [React Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary)

## Version History

- **v1.0** - Initial implementation with basic console error detection
- **v1.1** - Added CI/CD integration examples
- **v1.2** - Added comprehensive error analysis guide

---

**Last Updated:** 2025-01-21
**Maintained By:** Development Team
