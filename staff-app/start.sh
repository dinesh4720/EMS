#!/bin/bash

echo "========================================"
echo "  Staff App - Quick Start"
echo "========================================"
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo
fi

echo "Starting Expo development server..."
echo
echo "Press 'i' to open iOS simulator"
echo "Press 'a' to open Android emulator"
echo "Press 'w' to open in web browser"
echo

npx expo start
