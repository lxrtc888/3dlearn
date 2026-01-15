@echo off
chcp 65001
cd /d "%~dp0"
echo 正在启动服务器...
echo 请访问: http://localhost:8000
python -m http.server 8000
pause
