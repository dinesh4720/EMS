# Remove E2E Test Suite - Complete Removal Guide

This guide provides instructions to completely remove all E2E testing components, files, and dependencies from your EMS School Management System.

## ⚠️ Warning

**Removing this will delete:**
- 124+ automated E2E tests
- All test infrastructure
- Test dependencies
- Test configuration files
- Test documentation

**Make sure you want to permanently remove these before proceeding.**

---

## Method 1: Automatic Removal (Recommended)

### Step 1: Create Removal Script

Create a file called `remove-tests.sh` in your project root:

**For Windows (PowerShell):**
Create `remove-tests.ps1`:

```powershell
# E2E Test Removal Script for Windows
Write-Host "=== Removing E2E Test Suite ===" -ForegroundColor Yellow

# Remove test directories
Write-Host "Removing test directories..." -ForegroundColor Cyan
$testDirs = @(
    "tests\auth",
    "tests\attendance",
    "tests\classes",
    "tests\dashboard",
    "tests\fees",
    "tests\messaging",
    "tests\pages",
    "tests\permissions",
    "tests\reports",
    "tests\responsive",
    "tests\staff",
    "tests\students",
    "tests\timetable",
    "tests\fixtures",
    "tests\utils",
    "tests"
)

foreach ($dir in $testDirs) {
    if (Test-Path $dir) {
        Remove-Item -Path $dir -Recurse -Force
        Write-Host "Removed: $dir" -ForegroundColor Green
    }
}

# Remove test configuration files
Write-Host "`nRemoving configuration files..." -ForegroundColor Cyan
$configFiles = @(
    "playwright.config.ts",
    ".env.test",
    "E2E_TEST_SUITE_SUMMARY.md",
    "TEST_COVERAGE_ANALYSIS.md",
    "REMOVE_TEST_SUITE.md"
)

foreach ($file in $configFiles) {
    if (Test-Path $file) {
        Remove-Item -Path $file -Force
        Write-Host "Removed: $file" -ForegroundColor Green
    }
}

# Remove test results directory
if (Test-Path "test-results") {
    Remove-Item -Path "test-results" -Recurse -Force
    Write-Host "Removed: test-results" -ForegroundColor Green
}

# Update package.json
Write-Host "`nUpdating package.json..." -ForegroundColor Cyan
$packageJsonPath = "package.json"
if (Test-Path $packageJsonPath) {
    $packageJson = Get-Content $packageJsonPath -Raw | ConvertFrom-Json

    # Remove test scripts
    $scriptsToRemove = @("test", "test:headed", "test:debug", "test:ui", "test:report", "test:install")
    foreach ($script in $scriptsToRemove) {
        if ($packageJson.scripts.PSObject.Properties.Name -contains $script) {
            $packageJson.scripts.PSObject.Properties.Remove($script)
            Write-Host "Removed script: $script" -ForegroundColor Green
        }
    }

    # Remove Playwright from devDependencies
    if ($packageJson.devDependencies.PSObject.Properties.Name -contains "@playwright/test") {
        $packageJson.devDependencies.PSObject.Properties.Remove("@playwright/test")
        Write-Host "Removed dependency: @playwright/test" -ForegroundColor Green
    }

    # Save updated package.json
    $packageJson | ConvertTo-Json -Depth 10 | Set-Content $packageJsonPath
    Write-Host "Updated: package.json" -ForegroundColor Green
}

Write-Host "`n=== E2E Test Suite Removed Successfully ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install (to update package-lock.json)" -ForegroundColor White
Write-Host "2. Delete this script: remove-tests.ps1" -ForegroundColor White
```

**For Mac/Linux (Bash):**
Create `remove-tests.sh`:

```bash
#!/bin/bash

# E2E Test Removal Script for Mac/Linux
echo "=== Removing E2E Test Suite ==="

# Remove test directories
echo "Removing test directories..."
testDirs=(
    "tests/auth"
    "tests/attendance"
    "tests/classes"
    "tests/dashboard"
    "tests/fees"
    "tests/messaging"
    "tests/pages"
    "tests/permissions"
    "tests/reports"
    "tests/responsive"
    "tests/staff"
    "tests/students"
    "tests/timetable"
    "tests/fixtures"
    "tests/utils"
    "tests"
)

for dir in "${testDirs[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo "✓ Removed: $dir"
    fi
done

# Remove test configuration files
echo ""
echo "Removing configuration files..."
configFiles=(
    "playwright.config.ts"
    ".env.test"
    "E2E_TEST_SUITE_SUMMARY.md"
    "TEST_COVERAGE_ANALYSIS.md"
    "REMOVE_TEST_SUITE.md"
)

for file in "${configFiles[@]}"; do
    if [ -f "$file" ]; then
        rm -f "$file"
        echo "✓ Removed: $file"
    fi
done

# Remove test results directory
if [ -d "test-results" ]; then
    rm -rf "test-results"
    echo "✓ Removed: test-results"
fi

# Update package.json
echo ""
echo "Updating package.json..."
if [ -f "package.json" ]; then
    # Remove test scripts using node
    node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const scriptsToRemove = ['test', 'test:headed', 'test:debug', 'test:ui', 'test:report', 'test:install'];
    scriptsToRemove.forEach(s => delete pkg.scripts[s]);
    delete pkg.devDependencies['@playwright/test'];
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
    "
    echo "✓ Updated: package.json"
fi

echo ""
echo "=== E2E Test Suite Removed Successfully ==="
echo ""
echo "Next steps:"
echo "1. Run: npm install (to update package-lock.json)"
echo "2. Delete this script: remove-tests.sh"
```

### Step 2: Run the Removal Script

**Windows:**
```powershell
# Open PowerShell in school-dashboard directory
cd "C:\Users\bdk47\Desktop\kiro bp\EMS\school-dashboard"

# Allow script execution (if needed)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

# Run the script
.\remove-tests.ps1
```

**Mac/Linux:**
```bash
cd school-dashboard

# Make script executable
chmod +x remove-tests.sh

# Run the script
./remove-tests.sh
```

### Step 3: Clean Up Dependencies

```bash
npm install
```

This will update `package-lock.json` to reflect the removed dependencies.

### Step 4: Delete the Removal Script

```bash
# Windows
del remove-tests.ps1

# Mac/Linux
rm remove-tests.sh
```

---

## Method 2: Manual Removal

If you prefer to remove everything manually, follow these steps:

### Step 1: Remove Test Directories

**Windows (Command Prompt):**
```cmd
cd "C:\Users\bdk47\Desktop\kiro bp\EMS\school-dashboard"
rmdir /s /q tests
rmdir /s /q test-results
```

**Mac/Linux (Terminal):**
```bash
cd school-dashboard
rm -rf tests test-results
```

### Step 2: Remove Configuration Files

**Windows (PowerShell):**
```powershell
cd "C:\Users\bdk47\Desktop\kiro bp\EMS\school-dashboard"
Remove-Item playwright.config.ts
Remove-Item .env.test
Remove-Item E2E_TEST_SUITE_SUMMARY.md
Remove-Item TEST_COVERAGE_ANALYSIS.md
Remove-Item REMOVE_TEST_SUITE.md
```

**Mac/Linux (Terminal):**
```bash
cd school-dashboard
rm -f playwright.config.ts .env.test E2E_TEST_SUITE_SUMMARY.md TEST_COVERAGE_ANALYSIS.md REMOVE_TEST_SUITE.md
```

### Step 3: Update package.json

Open `package.json` and remove:

1. **Test scripts** from `"scripts"` section:
```json
// Remove these lines:
"test": "playwright test",
"test:headed": "playwright test --headed",
"test:debug": "playwright test --debug",
"test:ui": "playwright test --ui",
"test:report": "playwright show-report",
"test:install": "playwright install chromium"
```

2. **Playwright dependency** from `"devDependencies"`:
```json
// Remove this line:
"@playwright/test": "^1.57.0"
```

### Step 4: Update Node Modules

```bash
npm install
```

### Step 5: Remove Playwright Browsers (Optional)

If you want to remove Playwright browser binaries:

```bash
npx playwright uninstall --all
```

---

## Files Being Removed

### Test Files (24 files)
```
tests/
├── auth/auth.spec.ts
├── attendance/attendance.spec.ts
├── classes/classes.spec.ts
├── dashboard/dashboard.spec.ts
├── fees/fees.spec.ts
├── fixtures/users.ts
├── messaging/messaging.spec.ts
├── pages/BasePage.ts
├── pages/DashboardPage.ts
├── pages/FeesPage.ts
├── pages/LoginPage.ts
├── pages/MessagingPage.ts
├── pages/StaffPage.ts
├── pages/StudentsPage.ts
├── permissions/permissions.spec.ts
├── reports/reports.spec.ts
├── responsive/responsive.spec.ts
├── staff/staff.spec.ts
├── students/students.spec.ts
├── timetable/timetable.spec.ts
└── utils/test-helpers.ts
```

### Configuration Files (5 files)
```
playwright.config.ts
.env.test
E2E_TEST_SUITE_SUMMARY.md
TEST_COVERAGE_ANALYSIS.md
REMOVE_TEST_SUITE.md
```

### Generated Files (if exists)
```
test-results/
├── html-report/
├── screenshots/
├── videos/
├── results.json
└── results.xml
```

### package.json Changes
- Remove 6 test scripts
- Remove @playwright/test dependency

---

## Verification Steps

After removal, verify everything is clean:

### 1. Check No Test Files Remain

**Windows:**
```powershell
dir tests -Recurse
# Should show: "File Not Found" or empty

dir playwright.config.ts
# Should show: "File Not Found"
```

**Mac/Linux:**
```bash
ls tests/
# Should show: "No such file or directory"

ls playwright.config.ts
# Should show: "No such file or directory"
```

### 2. Check package.json

```bash
cat package.json
```

Verify:
- ❌ No `"test"` script
- ❌ No `"@playwright/test"` in devDependencies

### 3. Check Dependencies

```bash
npm list @playwright/test
# Should show: (empty)
```

### 4. Check Node Modules

```bash
ls node_modules/@playwright
# Should show: "No such file or directory"
```

---

## Impact Assessment

### What Will Be Affected:
✅ **Removed:**
- 124+ E2E automated tests
- Playwright browser binaries (~300MB)
- Test dependencies
- Test configuration

❌ **NOT Affected:**
- Application code (src/ directory)
- Backend code (backend/ directory)
- Teacher app (Teacher app/ directory)
- Production functionality
- Manual testing capability
- Application behavior

### After Removal:
- ✅ Your application will work exactly the same
- ✅ No changes to functionality
- ✅ Smaller node_modules size
- ❌ No automated testing capability
- ❌ Must test manually before deployments

---

## Reinstalling Tests (If Needed)

If you want to restore the E2E test suite later:

1. **Restore from Git** (if committed):
```bash
git checkout HEAD -- tests/
git checkout HEAD -- playwright.config.ts
git checkout HEAD -- package.json
npm install
npx playwright install
```

2. **Or recreate from scratch**:
- Follow the original setup instructions from the test documentation

---

## Troubleshooting

### Issue: Files Won't Delete

**Solution:**
- Close all IDEs/editors (VS Code, etc.)
- Close terminal windows
- Run as administrator:
  ```bash
  # Windows (Run as Administrator)
  sudo . # Mac/Linux
  ```

### Issue: "Permission Denied"

**Solution:**
```bash
# Mac/Linux
sudo chmod -R 755 tests
sudo rm -rf tests
```

### Issue: package.json Won't Update

**Solution:**
1. Open `package.json` in text editor
2. Manually delete the test scripts and @playwright/test line
3. Save file
4. Run `npm install`

### Issue: npm install Fails After Removal

**Solution:**
```bash
# Clear cache
npm cache clean --force

# Remove node_modules and package-lock
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## Checklist

Before considering removal complete:

- [ ] All files in `tests/` directory deleted
- [ ] `test-results/` directory deleted
- [ ] `playwright.config.ts` deleted
- [ ] `.env.test` deleted
- [ ] `E2E_TEST_SUITE_SUMMARY.md` deleted
- [ ] `TEST_COVERAGE_ANALYSIS.md` deleted
- [ ] `REMOVE_TEST_SUITE.md` deleted (this file)
- [ ] Test scripts removed from `package.json`
- [ ] `@playwright/test` removed from `package.json`
- [ ] `npm install` run successfully
- [ ] Application still works correctly
- [ ] No test-related files remain

---

## Quick Reference Commands

### Remove Everything (One-liner)

**Windows:**
```powershell
cd "C:\Users\bdk47\Desktop\kiro bp\EMS\school-dashboard"; Remove-Item -Recurse -Force tests,test-results,playwright.config.ts,.env.test,E2E_TEST_SUITE_SUMMARY.md,TEST_COVERAGE_ANALYSIS.md,REMOVE_TEST_SUITE.md; npm install
```

**Mac/Linux:**
```bash
cd school-dashboard && rm -rf tests test-results playwright.config.ts .env.test E2E_TEST_SUITE_SUMMARY.md TEST_COVERAGE_ANALYSIS.md REMOVE_TEST_SUITE.md && npm install
```

---

## Support

If you encounter issues:
1. Make sure you're in the correct directory (`school-dashboard`)
2. Close all programs that might be using the files
3. Try running as administrator/root
4. Use the manual removal method if automation fails

---

**⚠️ Remember: This action cannot be easily undone. Make sure this is what you want before proceeding.**
