@echo off
chcp 65001 >nul
echo ========================================
echo    Update code to GitHub
echo ========================================
echo.

cd /d "%~dp0"

:: clear proxy
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=

echo [1/5] Current changes:
git status --short
echo.

set /p COMMIT_MSG="Enter update message (e.g. fix xxx): "

if "%COMMIT_MSG%"=="" set COMMIT_MSG=update

echo.
echo [2/5] Adding files...
git add -A

echo [3/5] Committing...
git commit -m "%COMMIT_MSG%"

echo [4/5] Pulling remote changes (rebase)...
git pull --rebase origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [X] Pull/rebase failed - there may be conflicts.
    echo     Resolve conflicts then run:  git rebase --continue
    echo     Or cancel the rebase:        git rebase --abort
    echo.
    pause
    exit /b 1
)

echo [5/5] Pushing to GitHub...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo [OK] Update success!
    echo Repo: https://github.com/lxrtc888/3dlearn
) else (
    echo [!] Push may have failed, check messages above.
)

echo.
pause
