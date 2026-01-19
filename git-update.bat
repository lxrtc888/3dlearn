@echo off
chcp 65001 >nul
echo ========================================
echo    更新代码到 GitHub
echo ========================================
echo.

cd /d "D:\卓越工作\AI驱动交互式3D教学"

:: 清除代理设置
set HTTP_PROXY=
set HTTPS_PROXY=
set http_proxy=
set https_proxy=

:: 显示当前状态
echo 📊 当前修改状态：
git status --short
echo.

:: 请求输入提交信息
set /p COMMIT_MSG="📝 请输入本次更新说明（如：修复XX功能）: "

:: 如果没输入，使用默认信息
if "%COMMIT_MSG%"=="" set COMMIT_MSG=代码更新 %date% %time:~0,5%

:: 添加所有更改
echo.
echo 📦 添加文件...
git add -A

:: 提交
echo 💾 提交中...
git commit -m "%COMMIT_MSG%"

:: 推送
echo 🚀 推送到 GitHub...
git push origin main

echo.
if %ERRORLEVEL% EQU 0 (
    echo ✅ 更新成功！
    echo 📍 仓库地址: https://github.com/lxrtc888/3dlearn
) else (
    echo ⚠️ 推送可能有问题，请检查上方信息
)

echo.
pause
