/**
 * ============================================
 * 3D 场景模板 - 复制此文件创建新场景
 * ============================================
 * 
 * 使用说明：
 * 1. 复制此文件到 scenes/ 目录
 * 2. 重命名为 xxx-scene.js
 * 3. 将 TemplateScene 改为 XxxScene
 * 4. 实现具体的场景逻辑
 * 5. 在 cases-config.js 中注册
 * 6. 在 index.html 中引入
 * 
 * ============================================
 */

window.TemplateScene = class TemplateScene {
    constructor(scene, camera, renderer) {
        // Three.js 核心对象（由 SceneManager 传入）
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        // 场景专属对象
        this.mainGroup = null;          // 主对象组
        this.interactables = [];        // 可交互对象列表

        // 场景参数（可在UI中调整）
        this.params = {
            speed: 1.0,
            isRunning: true
        };
    }

    /**
     * 【必须实现】初始化场景
     * 在场景加载时调用一次
     */
    init() {
        // 1. 设置相机位置
        this.camera.position.set(0, 5, 20);

        // 2. 设置背景色
        this.scene.background = new THREE.Color(0x0a0a0f);

        // 3. 添加灯光
        this.setupLights();

        // 4. 创建场景内容
        this.createScene();

        // 5. 设置UI面板
        this.setupUI();
    }

    /**
     * 设置灯光
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        // 主方向光
        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 20, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        // 可选：点光源（用于强调效果）
        // const pointLight = new THREE.PointLight(0x3b82f6, 2, 20);
        // pointLight.position.set(-5, 5, 5);
        // this.scene.add(pointLight);
    }

    /**
     * 创建场景内容
     * 这是核心方法，在这里构建3D场景
     */
    createScene() {
        // 创建主对象组（便于统一管理）
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // ========================================
        // 示例：创建一个可交互的立方体
        // ========================================
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({
            color: 0x3b82f6,
            metalness: 0.5,
            roughness: 0.3
        });
        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(0, 1, 0);

        // 配置交互数据
        cube.userData = {
            name: '示例立方体',
            description: '这是一个可点击的示例对象。<br>点击后会显示此说明。',
            onClick: (target) => {
                this.onObjectClick(target);
            }
        };

        // 加入主组和交互列表
        this.mainGroup.add(cube);
        this.interactables.push(cube);

        // ========================================
        // 在这里添加更多3D对象...
        // ========================================
    }

    /**
     * 对象点击处理
     */
    onObjectClick(target) {
        // 1. 视觉反馈（高亮效果）
        gsap.to(target.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.2, yoyo: true, repeat: 1 });

        // 2. 更新信息面板
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (title) title.innerText = target.userData.name;
        if (content) {
            content.innerHTML = `
                <div class="text-gray-300 mb-4">
                    ${target.userData.description}
                </div>
            `;
        }
        if (panel) panel.classList.add('visible');
    }

    /**
     * 设置UI面板
     */
    setupUI() {
        // 信息面板标题
        const infoTitle = document.getElementById('info-title');
        const infoContent = document.getElementById('info-content');

        if (infoTitle) infoTitle.innerText = "场景标题";
        if (infoContent) {
            infoContent.innerHTML = `
                <p class="text-gray-400 mb-4">
                    场景说明文字。点击3D对象查看详细信息。
                </p>
                
                <!-- 示例：参数滑块 -->
                <div class="bg-black/30 p-4 rounded-xl border border-blue-900/40">
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-blue-400 font-bold">
                            <i class="fas fa-sliders-h"></i> 速度控制
                        </span>
                        <span id="speed-display" class="font-mono text-white">1.0x</span>
                    </div>
                    <input type="range" min="0.1" max="3" step="0.1" value="1" 
                           class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600" 
                           id="speed-slider">
                </div>
            `;

            // 绑定滑块事件
            const slider = document.getElementById('speed-slider');
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.params.speed = parseFloat(e.target.value);
                    document.getElementById('speed-display').innerText = this.params.speed.toFixed(1) + 'x';
                });
            }
        }

        // 显示信息面板
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.add('visible');

        // 可选：设置底部控制按钮
        // this.setupControls();
    }

    /**
     * 可选：设置底部控制按钮
     */
    setupControls() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;

        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-toggle">
                <i class="fas fa-pause"></i> 暂停
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
        `;

        document.getElementById('btn-toggle').onclick = () => {
            this.params.isRunning = !this.params.isRunning;
            const btn = document.getElementById('btn-toggle');
            btn.innerHTML = this.params.isRunning 
                ? '<i class="fas fa-pause"></i> 暂停' 
                : '<i class="fas fa-play"></i> 播放';
            btn.classList.toggle('active', !this.params.isRunning);
        };

        document.getElementById('btn-reset').onclick = () => {
            // 重置逻辑
            this.camera.position.set(0, 5, 20);
        };
    }

    /**
     * 【可选】创建3D标签
     * @param {SceneManager} manager - 场景管理器实例
     */
    createLabels(manager) {
        // manager.createLabel("标签文字", new THREE.Vector3(x, y, z), "icon-name");
        manager.createLabel("示例标签", new THREE.Vector3(0, 3, 0));
    }

    /**
     * 【必须实现】动画循环
     * 每帧调用
     * @param {number} time - 累计时间(秒)
     * @param {number} delta - 帧间隔(秒)
     */
    animate(time, delta) {
        if (!this.params.isRunning) return;

        // 示例：缓慢旋转
        if (this.mainGroup) {
            this.mainGroup.rotation.y = Math.sin(time * 0.2 * this.params.speed) * 0.3;
        }

        // 在这里添加动画逻辑...
    }

    /**
     * 【可选】点击空白处回调
     */
    onBackgroundClick() {
        // 例如：隐藏信息面板
        // document.getElementById('info-panel').classList.remove('visible');
    }

    /**
     * 【必须实现】返回可交互对象列表
     * @returns {Array} Three.js对象数组
     */
    getInteractables() {
        return this.interactables;
    }

    /**
     * 【必须实现】清理资源
     * 场景切换时调用
     */
    dispose() {
        // 移除主对象组
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
        }

        // 清理其他资源...
        this.interactables = [];
    }
};
