@echo off
echo ========================================
echo   Staff App - Quick Start
echo ========================================
echo.

:: Check if node_modules exists
if not exist "node_modules\" (
    echo Installing dependencies...
    call npm install
    echo.
)

echo Starting Expo development server...
echo.
echo Press 'i' to open iOS simulator
echo Press 'a' to open Android emulator
echo Press 'w' to open in web browser
echo.

call npx expo start
