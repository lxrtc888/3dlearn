@echo off
chcp 65001
cd /d "%~dp0"
echo Starting 3Dlearn local server...
echo Open http://localhost:8000/app.html
echo Do not open app.html directly with file://

REM 用独立用户数据目录 + 关闭手势限制启动 Chrome，实现无须点击即可自动播放语音
set "APP_URL=http://localhost:8000/app.html"
set "CHROME_FLAGS=--autoplay-policy=no-user-gesture-required --user-data-dir=%TEMP%\3dlearn-chrome"

set "CHROME="
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not defined CHROME if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" set "CHROME=%LocalAppData%\Google\Chrome\Application\chrome.exe"

if defined CHROME (
    echo Launching Chrome with autoplay enabled...
    start "" "%CHROME%" %CHROME_FLAGS% "%APP_URL%"
) else (
    echo [!] Chrome not found. Please open %APP_URL% manually.
    echo     For auto voice, launch Chrome with: --autoplay-policy=no-user-gesture-required
)

node local-server.mjs
pause
