# EMS School Dashboard - E2E Test Suite

## Overview

This is a comprehensive End-to-End (E2E) testing suite for the EMS School Management System using Playwright. The tests cover all major modules and user flows from a UX perspective.

## Test Coverage

### Modules Tested
1. **Authentication** (15 tests)
   - Login with valid/invalid credentials
   - Token management
   - Logout functionality
   - Session handling
   - Different user roles

2. **Dashboard** (12 tests)
   - Dashboard loading
   - Stat cards verification
   - Navigation from dashboard
   - Charts rendering
   - Activity feed
   - Quick actions
   - Responsive layout

3. **Staff Management** (15 tests)
   - Staff list display
   - Add/Edit/Delete staff
   - Staff attendance
   - Leave management
   - Search and filters
   - Export functionality

4. **Student Management** (15 tests)
   - Student list display
   - New student admission
   - Edit/Delete students
   - Class/Section filtering
   - Attendance marking
   - Fee details per student
   - Photo upload

5. **Fee Management** (13 tests)
   - Fee structure management
   - Fee collection
   - Receipt generation
   - Fee defaulters list
   - Payment methods
   - Refund processing
   - Fee reports

6. **Messaging** (15 tests)
   - Messaging interface
   - Send/receive messages
   - File attachments
   - Online status
   - Typing indicators
   - Message search
   - Group conversations

7. **Permissions & RBAC** (10 tests)
   - Role-based access control
   - Admin/Teacher/Accountant/Receptionist access
   - Permission restrictions
   - UI element visibility
   - Cross-role isolation

8. **Responsive Design** (14 tests)
   - Desktop (1920x1080)
   - Laptop (1366x768)
   - Tablet (768x1024)
   - Mobile (375x667, 320x568)
   - Touch interactions
   - Mobile navigation
   - Orientation changes

9. **Class Management** (4 tests)
10. **Attendance** (5 tests)
11. **Timetable** (3 tests)
12. **Reports** (3 tests)

**Total: 124+ comprehensive E2E tests**

## Prerequisites

- Node.js installed
- Backend server running on port 5000
- Test users created in database

## Setup

### 1. Install Dependencies
```bash
cd school-dashboard
npm install
```

### 2. Install Playwright Browsers
```bash
npx playwright install
```

### 3. Configure Test Environment

Create test users in your database (or update `.env.test`):
```
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=admin123
TEST_TEACHER_EMAIL=teacher@test.com
TEST_TEACHER_PASSWORD=teacher123
TEST_ACCOUNTANT_EMAIL=accountant@test.com
TEST_ACCOUNTANT_PASSWORD=accountant123
TEST_RECEPTIONIST_EMAIL=receptionist@test.com
TEST_RECEPTIONIST_PASSWORD=receptionist123
```

## Running Tests

### Run All Tests
```bash
npx playwright test
```

### Run Tests in Specific File
```bash
npx playwright test tests/auth/auth.spec.ts
```

### Run Tests for Specific Module
```bash
npx playwright test --project=chromium tests/staff/
```

### Run Tests in Headed Mode (See Browser)
```bash
npx playwright test --headed
```

### Run Tests in Debug Mode
```bash
npx playwright test --debug
```

### Run Specific Test
```bash
npx playwright test -g "should login successfully"
```

### Run Tests on Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### Run Mobile Viewport Tests
```bash
npx playwright test --project="Mobile Chrome"
```

## Test Reports

After tests run, reports are generated in `test-results/`:

### HTML Report
```bash
npx playwright show-report
```

### JSON Report
```bash
cat test-results/results.json
```

### Screenshots
- Screenshots of failures are saved in `test-results/screenshots/`
- Responsive test screenshots in `test-results/screenshots/responsive-*.png`

### Videos
- Test run videos are saved in `test-results/videos/`

### Traces
- Click on the trace file in the HTML report to debug

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright Browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npx playwright test

- name: Upload test results
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

## Project Structure

```
school-dashboard/
├── tests/
│   ├── auth/              # Authentication tests
│   ├── dashboard/         # Dashboard tests
│   ├── staff/             # Staff management tests
│   ├── students/          # Student management tests
│   ├── fees/              # Fee management tests
│   ├── messaging/         # Messaging tests
│   ├── permissions/       # Permission & RBAC tests
│   ├── responsive/        # Responsive design tests
│   ├── classes/           # Class management tests
│   ├── attendance/        # Attendance tests
│   ├── timetable/         # Timetable tests
│   ├── reports/           # Reports tests
│   ├── pages/             # Page Object Models
│   ├── fixtures/          # Test data fixtures
│   └── utils/             # Test helper utilities
├── playwright.config.ts   # Playwright configuration
└── .env.test             # Test environment variables
```

## Page Object Models

Reusable page objects in `tests/pages/`:
- `BasePage.ts` - Common functionality for all pages
- `LoginPage.ts` - Login/authentication page
- `DashboardPage.ts` - Dashboard page
- `StaffPage.ts` - Staff management page
- `StudentsPage.ts` - Student management page
- `FeesPage.ts` - Fee management page
- `MessagingPage.ts` - Messaging page

## Test Data

Test data fixtures in `tests/fixtures/users.ts`:
- Test user credentials for each role
- Valid/invalid data for all entities
- Reusable test data

## Troubleshooting

### Tests Fail with "Network Timeout"
- Ensure backend server is running on port 5000
- Check API endpoints are accessible

### Tests Fail with "Element Not Found"
- Verify you're logged in with correct test user
- Check if UI elements have changed
- Run tests in headed mode to debug

### Tests Fail on Authentication
- Verify test users exist in database
- Check credentials in `.env.test`
- Ensure backend authentication is working

### Screenshots Not Appearing
- Ensure `test-results/screenshots/` directory exists
- Check file permissions

## Best Practices

1. **Always run tests before deploying**
2. **Keep test data isolated** - don't use production data
3. **Run tests in CI/CD pipeline**
4. **Review test reports after each run**
5. **Update tests when UI changes**
6. **Add new tests for new features**

## Extending Tests

To add new tests:

1. Create test file in appropriate module directory
2. Use Page Object Models for interactions
3. Follow naming convention: `should <do something>`
4. Use test fixtures for test data
5. Verify both positive and negative cases

Example:
```typescript
test('should verify new feature works', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.loginAndWaitForDashboard(
    testUsers.admin.email,
    testUsers.admin.password
  );

  // Test your feature
  await page.goto('/new-feature');
  await expect(page.locator('h1')).toContainText('New Feature');
});
```

## Support

For issues or questions:
1. Check Playwright documentation: https://playwright.dev
2. Review test reports in `test-results/`
3. Run tests in debug mode: `npx playwright test --debug`
