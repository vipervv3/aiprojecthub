@echo off
echo ========================================
echo   AI ProjectHub - Auto Deploy Script
echo ========================================
echo.

REM Check if git is initialized
if not exist ".git" (
    echo Initializing git repository...
    git init
    git branch -M main
    git remote add origin https://github.com/vipervv3/aiprojecthub.git
    echo.
)

echo Checking for changes...
git status
echo.

echo Adding all files...
git add .
echo.

echo Committing changes...
set /p COMMIT_MSG="Enter commit message (or press Enter for default): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=Update AI ProjectHub

git commit -m "%COMMIT_MSG%"
echo.

echo Pushing to GitHub...
git push -u origin main
echo.

if %ERRORLEVEL% EQU 0 (
    echo ========================================
    echo   SUCCESS! Code pushed to GitHub
    echo ========================================
    echo.
    echo Your code is now at:
    echo https://github.com/vipervv3/aiprojecthub
    echo.
    echo Next steps:
    echo 1. Go to https://vercel.com/new
    echo 2. Import your GitHub repo
    echo 3. Click Deploy
    echo.
    echo Vercel will auto-deploy on every future push!
    echo.
) else (
    echo ========================================
    echo   ERROR: Push failed
    echo ========================================
    echo.
    echo If you see authentication error:
    echo 1. Go to https://github.com/settings/tokens
    echo 2. Generate new token (classic)
    echo 3. Give it 'repo' permissions
    echo 4. Use token as password when prompted
    echo.
)

pause

