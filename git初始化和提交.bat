@echo off
chcp 65001
echo ========================================
echo   Git 版本控制初始化
echo ========================================
echo.

REM 检查是否已经初始化
if exist .git (
    echo Git仓库已存在，跳过初始化
) else (
    echo 初始化Git仓库...
    git init
    echo.
)

REM 配置用户信息
echo 配置用户信息...
git config user.email "lxrtc8@gmail.com"
git config user.name "lxrtc888"
echo.

REM 添加所有文件
echo 添加文件到暂存区...
git add .
echo.

REM 提交
echo 提交更改...
git commit -m "feat: 完成模块化重构 V7.0

✨ 新功能
- 创建模块化文件结构（13个模块文件）
- 实现场景基类和管理器模式
- 增强所有4个3D交互场景
- 添加统一的信息弹框系统
- 支持点击查看详细说明

🎨 改进
- 修复右侧展示面板位置
- 提取CSS到独立文件
- 提取数据到独立文件
- 优化代码结构和可读性

📝 文档
- 添加README_模块化版本.md
- 添加快速开始指南
- 添加项目改造总结
- 添加启动脚本"

echo.
echo ========================================
echo   提交完成！
echo ========================================
echo.
echo 查看提交历史: git log --oneline
echo.
pause

