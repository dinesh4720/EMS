@echo off
REM Playwright Console Error Test Runner for Windows
REM This script runs console error detection tests on the Student Dashboard

echo.
echo 🚀 Starting Playwright Console Error Detection Tests...
echo ========================================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
)

REM Check if Playwright browsers are installed
where npx playwright >nul 2>nul
if errorlevel 1 (
    echo 📦 Installing Playwright browsers...
    call npm run test:install
)

echo.
echo 🔍 Running console error detection tests...
echo ========================================================
echo.

REM Run the console error tests
call npm run test tests/console-error-check.spec.js

echo.
echo ========================================================
echo ✅ Tests completed!
echo.
echo 📊 View detailed reports:
echo   HTML Report: npm run test:report
echo   Or open: playwright-report\index.html
echo.

pause
