# AI协作教学系统 V7.0 - 模块化版本

## 🎉 重构完成！

本版本将原始的单文件HTML应用重构为模块化架构，便于维护和扩展。

## 📁 项目结构

```
项目目录/
├── learn3D_v2.html          # 主入口文件（模块化版本）
├── learn3D.html              # 原版文件（保留作为参考）
├── css/
│   └── styles.css            # 主样式表
├── js/
│   ├── core/                 # 核心逻辑
│   │   ├── App.js            # 主应用程序
│   │   ├── SceneManager.js   # 场景管理器
│   │   └── PPTManager.js     # PPT管理器
│   ├── scenes/               # 3D场景模块
│   │   ├── BaseScene.js      # 场景基类
│   │   ├── EngineScene.js    # V6发动机场景
│   │   ├── QuantumScene.js   # 双缝干涉场景
│   │   ├── HydraulicScene.js # 液压系统场景
│   │   └── LLMScene.js       # LLM注意力网络场景
│   ├── data/                 # 数据文件
│   │   ├── slides.js         # PPT幻灯片数据
│   │   └── codeSnippets.js   # 代码演示片段
│   └── utils/                # 工具函数（待扩展）
└── README_模块化版本.md      # 本文件
```

## 🚀 使用方法

### 启动应用

直接在浏览器中打开 `learn3D_v2.html` 即可。

**注意**：由于使用了ES6模块（import/export），需要通过HTTP服务器运行，不能直接使用file://协议。

推荐方法：
```bash
# 使用Python
python -m http.server 8000

# 或使用Node.js
npx http-server

# 或使用VS Code的Live Server扩展
```

然后访问：`http://localhost:8000/learn3D_v2.html`

### 添加新场景

1. **创建场景类文件** `js/scenes/YourScene.js`:

```javascript
import { BaseScene } from './BaseScene.js';

export default class YourScene extends BaseScene {
    async setup() {
        // 初始化场景
        this.camera.position.set(0, 5, 20);
        // ... 创建3D对象
    }
    
    animate(time) {
        // 动画逻辑
    }
    
    getTips() {
        return '💡 场景提示信息';
    }
}
```

2. **添加代码片段** 到 `js/data/codeSnippets.js`:

```javascript
export const codeSnippets = {
    // ... 现有代码
    yourscene: `// 你的代码演示`
};
```

3. **更新意图识别** 在 `js/core/App.js` 的 `analyzeIntent()` 方法中添加关键词识别。

4. **更新场景映射** 在 `js/core/App.js` 的 `runScene()` 方法中添加映射。

完成！新场景会自动集成到系统中。

## ✨ 功能增强

相比原版，模块化版本增强了以下功能：

### 1. 交互式信息弹框
- 点击3D场景中的任何部件查看详细说明
- 优雅的动画效果
- 点击背景或关闭按钮关闭

### 2. 增强的双缝干涉场景
- 所有设备可点击查看原理
- 更真实的粒子系统
- 动态探测屏幕图案
- 观察者按钮切换

### 3. 增强的液压系统场景
- 交互式气缸和活塞
- 实时流体动画
- 帕斯卡定律可视化

### 4. 增强的LLM场景
- 点击Token查看注意力关系
- 贝塞尔曲线连接
- 强度可视化
- 星空背景

### 5. 增强的发动机场景
- 点击各部件查看说明
- 真实的点火顺序
- 等离子燃烧效果

## 🎨 设计特点

- **模块化架构**：每个场景独立，易于维护
- **统一接口**：BaseScene提供标准化的生命周期
- **资源管理**：自动清理3D对象，避免内存泄漏
- **事件处理**：统一的点击和交互处理
- **标签系统**：可复用的3D标签组件
- **信息弹框**：优雅的提示信息展示

## 📖 场景API

每个场景继承`BaseScene`，必须实现以下方法：

### 必需方法
- `setup()`: 初始化场景（异步）
- `animate(time)`: 每帧更新

### 可选方法
- `getControls()`: 返回控制按钮HTML
- `getTips()`: 返回场景提示信息
- `handleClick(mouse, raycaster)`: 自定义点击处理

### 工具方法
- `createLabel(text, position, icon)`: 创建3D标签
- `showInfoModal(title, content, icon)`: 显示信息弹框
- `updateLabels()`: 更新标签位置（自动调用）
- `dispose()`: 清理资源（自动调用）

## 🛠️ 技术栈

- **Three.js** r128 - 3D渲染引擎
- **GSAP** 3.9.1 - 动画库
- **Tailwind CSS** 2.2.19 - CSS框架
- **Font Awesome** 6.0.0 - 图标库
- **ES6 Modules** - 模块化系统

## 🐛 已知问题

1. ~~右侧展示面板位置偏离~~ ✅ 已修复
2. 需要HTTP服务器运行（ES Module限制）

## 📝 开发日志

### 2025-12-19 重构完成
- ✅ 创建模块化文件结构
- ✅ 提取场景为独立模块
- ✅ 创建场景基类和管理器
- ✅ 增强所有场景的交互性
- ✅ 提取样式和数据文件
- ✅ 创建主应用程序
- ✅ 修复右侧面板定位

## 🎯 下一步计划

- [ ] 添加更多教学场景（电磁感应、牛顿运动定律等）
- [ ] 优化移动端体验
- [ ] 添加场景转场动画
- [ ] 实现场景历史记录
- [ ] 添加语音讲解功能

## 📄 许可证

本项目仅供教学演示使用。

---

**作者**: AI开发团队  
**版本**: V7.0 - 模块化版  
**更新日期**: 2025-12-19

