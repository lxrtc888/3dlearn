@echo off
chcp 65001
echo ============================================
echo   AI协作教学系统 V7.1 - 本地服务器启动
echo ============================================
echo.
echo 正在启动HTTP服务器...
echo 服务器地址: http://localhost:8000
echo.
echo ⭐ 推荐使用:
echo   http://localhost:8000/learn3D.html (原版+视频老师)
echo.
echo 其他版本:
echo   http://localhost:8000/learn3D_final.html  (模块化版本)
echo.
echo 按 Ctrl+C 停止服务器
echo.
python -m http.server 8000

