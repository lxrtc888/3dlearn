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

echo [1/6] Current changes:
git status --short
echo.

set /p COMMIT_MSG="Enter update message (e.g. fix xxx): "
if "%COMMIT_MSG%"=="" set COMMIT_MSG=update

echo.
echo [2/6] Adding files...
git add -A

echo [3/6] Committing...
git commit -m "%COMMIT_MSG%"

echo [4/6] Pulling remote changes (rebase)...
git pull --rebase origin main
if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [!] Rebase could not finish automatically. Rolling back to a clean state...
    git rebase --abort
    echo [!] Local and remote have diverged.
    goto ASK_FORCE
)

echo [5/6] Pushing to GitHub...
git push origin main
if %ERRORLEVEL% EQU 0 goto DONE_OK

echo.
echo [!] Normal push was rejected (remote has commits you do not have).
goto ASK_FORCE

:ASK_FORCE
echo.
echo ==================== CHOICE ====================
echo   Your LOCAL code is complete and safe.
echo   Force push will OVERWRITE the remote with your
echo   local version (remote-only commits will be lost).
echo ===============================================
set /p FORCE_CONFIRM="Force push and overwrite remote? (y/N): "
if /i not "%FORCE_CONFIRM%"=="y" (
    echo.
    echo [X] Cancelled. Nothing was pushed. Remote is unchanged.
    echo     Your local commits are still saved locally.
    goto END
)

echo.
echo [6/6] Force pushing (overwrite remote)...
git push --force-with-lease origin main
if %ERRORLEVEL% EQU 0 goto DONE_OK

echo.
echo [X] Force push failed. Check the messages above.
goto END

:DONE_OK
echo.
echo [OK] Update success!
echo Repo: https://github.com/lxrtc888/3dlearn
goto END

:END
echo.
pause
