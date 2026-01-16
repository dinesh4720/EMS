#!/bin/bash
# Complete Vite cache fix script

echo "🛑 Stopping any running Vite servers..."
pkill -f "vite" 2>/dev/null || true

echo "🧹 Clearing Vite cache..."
rm -rf node_modules/.vite
rm -rf dist
rm -rf .vite

echo "🔄 Clearing npm cache..."
npm cache clean --force

echo "✅ Cache cleared! Please restart with: npm run dev -- --force"
