@echo off
chcp 65001 >nul
echo ========================================
echo    推送项目到 GitHub
echo ========================================
echo.

cd /d "D:\卓越工作\AI驱动交互式3D教学"

echo 清除代理设置...
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=

echo 推送中，请稍候...
git push -u origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ 推送成功！
    echo 访问: https://github.com/lxrtc888/3dlearn
) else (
    echo ❌ 推送失败，请检查网络或GitHub权限
)

echo.
pause
