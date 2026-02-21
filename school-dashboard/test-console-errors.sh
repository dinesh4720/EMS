#!/bin/bash

# Playwright Console Error Test Runner
# This script runs console error detection tests on the Student Dashboard

echo "🚀 Starting Playwright Console Error Detection Tests..."
echo "========================================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if Playwright browsers are installed
if ! npx playwright --version > /dev/null 2>&1; then
    echo "📦 Installing Playwright browsers..."
    npm run test:install
fi

echo ""
echo "🔍 Running console error detection tests..."
echo "========================================================"
echo ""

# Run the console error tests
npm run test tests/console-error-check.spec.js

echo ""
echo "========================================================"
echo "✅ Tests completed!"
echo ""
echo "📊 View detailed reports:"
echo "  HTML Report: npm run test:report"
echo "  Or open: playwright-report/index.html"
echo ""
