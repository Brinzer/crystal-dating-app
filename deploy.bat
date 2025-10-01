@echo off
REM Crystal Dating App - Quick Deployment Script
REM Automates git commit and push for instant deployment

echo.
echo ======================================
echo   Crystal Dating - Quick Deploy
echo ======================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo ERROR: Not a git repository!
    echo Run: git init
    echo Then: git remote add origin YOUR_GITHUB_URL
    pause
    exit /b 1
)

REM Get commit message from user
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "

if "%COMMIT_MSG%"=="" (
    set COMMIT_MSG=Update Crystal Dating App
)

echo.
echo 📝 Commit message: %COMMIT_MSG%
echo.

REM Add all changes
echo 📦 Adding all changes...
git add -A

if errorlevel 1 (
    echo ERROR: Failed to add files
    pause
    exit /b 1
)

REM Commit
echo 💾 Committing changes...
git commit -m "%COMMIT_MSG%

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

if errorlevel 1 (
    echo WARNING: Commit failed (maybe no changes?)
    echo Continuing anyway...
)

REM Push to main branch
echo 🚀 Pushing to GitHub (main branch)...
git push origin main

if errorlevel 1 (
    echo.
    echo ❌ Push failed!
    echo.
    echo Possible issues:
    echo 1. Remote not configured: git remote add origin YOUR_URL
    echo 2. Branch not set: git branch -M main
    echo 3. Authentication failed: Check GitHub credentials
    echo.
    pause
    exit /b 1
)

echo.
echo ✅ Deployment successful!
echo.
echo 🌐 Your changes will be live in 2-5 minutes at:
echo    - Render URL: https://crystal-dating.onrender.com
echo    - Your Domain: https://yourdomain.com
echo.
echo 📊 Check deployment status:
echo    - Render Dashboard: https://dashboard.render.com
echo    - Git log: git log --oneline -5
echo.

pause
