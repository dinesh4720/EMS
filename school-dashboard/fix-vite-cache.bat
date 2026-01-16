@echo off
echo ========================================
echo VITE CACHE FIX SCRIPT
echo ========================================
echo.

echo Step 1: Stopping any running Vite servers...
taskkill /F /IM node.exe 2>nul || echo No Node processes found
timeout /t 2 /nobreak >nul

echo.
echo Step 2: Clearing Vite cache...
if exist node_modules\.vite rmdir /s /q node_modules\.vite
if exist .vite rmdir /s /q .vite
if exist dist rmdir /s /q dist
echo Cache cleared!

echo.
echo Step 3: Clearing npm cache...
call npm cache clean --force

echo.
echo ========================================
echo ✅ FIX COMPLETE!
echo ========================================
echo.
echo NOW RUN: npm run dev -- --force
echo.
pause
