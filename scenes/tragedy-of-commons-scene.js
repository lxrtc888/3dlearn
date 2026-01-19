/**
 * 公地悲剧场景 - Tragedy of the Commons
 * ============================================
 * "每个人的理性选择导致集体的灾难"
 * 
 * 核心概念（Garrett Hardin 1968年提出）：
 * - 共享资源的过度开发
 * - 个体理性 vs 集体理性
 * - 外部性与可持续性
 * 
 * 经典案例：公共牧场、渔业资源、环境污染
 * ============================================
 */
window.TragedyOfCommonsScene = class TragedyOfCommonsScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 参数
        this.params = {
            farmers: 5,            // 牧民数量
            initialSheep: 2,       // 每人初始羊数
            maxCapacity: 50,       // 草地最大承载量
            greediness: 0.3,       // 贪婪程度（每轮增加羊的概率）
            regenerationRate: 0.1  // 草地恢复率
        };

        // 状态
        this.grassHealth = 100;    // 草地健康度 0-100
        this.sheepCounts = [];     // 每个牧民的羊数
        this.sheepMeshes = [];     // 羊的3D模型
        this.farmerMeshes = [];    // 牧民模型
        this.isSimulating = false;
        this.round = 0;
        this.history = [];         // 历史记录

        // 颜色
        this.colors = {
            background: 0x87ceeb,  // 天空蓝
            grassHealthy: 0x228b22,
            grassDying: 0xdaa520,
            grassDead: 0x8b4513,
            sheep: 0xffffff,
            farmer: 0x8b4513
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 25, z: 30 };
    }

    /**
     * 初始化场景
     */
    init() {
        // 设置相机
        this.camera.position.set(
            this.defaultCameraPos.x,
            this.defaultCameraPos.y,
            this.defaultCameraPos.z
        );
        this.camera.lookAt(0, 0, 0);

        // 背景 - 天空
        this.scene.background = new THREE.Color(this.colors.background);
        this.scene.fog = new THREE.Fog(this.colors.background, 40, 80);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();

        // 初始化牧场
        this.initFarm();
    }

    /**
     * 设置光照
     */
    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        const sun = new THREE.DirectionalLight(0xffffff, 0.8);
        sun.position.set(20, 30, 10);
        sun.castShadow = true;
        this.scene.add(sun);

        // 暖色调补光
        const warmLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 0.3);
        this.scene.add(warmLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建草地
        this.createGrassland();

        // 创建围栏
        this.createFence();

        // 创建装饰
        this.createDecorations();
    }

    /**
     * 创建草地
     */
    createGrassland() {
        const grassGeom = new THREE.CircleGeometry(18, 32);
        const grassMat = new THREE.MeshStandardMaterial({
            color: this.colors.grassHealthy,
            roughness: 0.8
        });
        this.grassMesh = new THREE.Mesh(grassGeom, grassMat);
        this.grassMesh.rotation.x = -Math.PI / 2;
        this.grassMesh.position.y = 0;
        this.mainGroup.add(this.grassMesh);

        // 草地纹理点缀
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * 16;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;

            const grassBladeGeom = new THREE.ConeGeometry(0.1, 0.4, 4);
            const grassBladeMat = new THREE.MeshStandardMaterial({
                color: 0x32cd32
            });
            const blade = new THREE.Mesh(grassBladeGeom, grassBladeMat);
            blade.position.set(x, 0.2, z);
            blade.rotation.x = (Math.random() - 0.5) * 0.3;
            this.mainGroup.add(blade);
        }
    }

    /**
     * 创建围栏
     */
    createFence() {
        const fenceGroup = new THREE.Group();
        const postCount = 24;

        for (let i = 0; i < postCount; i++) {
            const angle = (i / postCount) * Math.PI * 2;
            const x = Math.cos(angle) * 19;
            const z = Math.sin(angle) * 19;

            // 栅栏柱
            const postGeom = new THREE.CylinderGeometry(0.15, 0.15, 2);
            const postMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
            const post = new THREE.Mesh(postGeom, postMat);
            post.position.set(x, 1, z);
            fenceGroup.add(post);

            // 横杆
            if (i > 0) {
                const prevAngle = ((i - 1) / postCount) * Math.PI * 2;
                const px = Math.cos(prevAngle) * 19;
                const pz = Math.sin(prevAngle) * 19;

                const railGeom = new THREE.CylinderGeometry(0.08, 0.08, 5);
                const railMat = new THREE.MeshStandardMaterial({ color: 0xa0522d });
                const rail = new THREE.Mesh(railGeom, railMat);
                rail.position.set((x + px) / 2, 1.5, (z + pz) / 2);
                rail.rotation.z = Math.PI / 2;
                rail.lookAt(x, 1.5, z);
                fenceGroup.add(rail);
            }
        }

        this.mainGroup.add(fenceGroup);
    }

    /**
     * 创建装饰物
     */
    createDecorations() {
        // 树木
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + 0.3;
            const x = Math.cos(angle) * 25;
            const z = Math.sin(angle) * 25;

            this.createTree(x, z);
        }
    }

    /**
     * 创建树
     */
    createTree(x, z) {
        const treeGroup = new THREE.Group();

        // 树干
        const trunkGeom = new THREE.CylinderGeometry(0.3, 0.5, 3);
        const trunkMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const trunk = new THREE.Mesh(trunkGeom, trunkMat);
        trunk.position.y = 1.5;
        treeGroup.add(trunk);

        // 树冠
        const crownGeom = new THREE.SphereGeometry(2, 8, 8);
        const crownMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
        const crown = new THREE.Mesh(crownGeom, crownMat);
        crown.position.y = 4;
        treeGroup.add(crown);

        treeGroup.position.set(x, 0, z);
        this.mainGroup.add(treeGroup);
    }

    /**
     * 初始化牧场
     */
    initFarm() {
        this.clearFarm();

        const { farmers, initialSheep } = this.params;
        this.grassHealth = 100;
        this.round = 0;
        this.history = [];

        // 初始化每个牧民
        for (let i = 0; i < farmers; i++) {
            this.sheepCounts[i] = initialSheep;
            this.createFarmer(i);
        }

        // 创建羊
        this.updateSheepMeshes();
        this.updateGrassColor();
        this.updateInfoDisplay();
    }

    /**
     * 创建牧民
     */
    createFarmer(index) {
        const angle = (index / this.params.farmers) * Math.PI * 2;
        const x = Math.cos(angle) * 15;
        const z = Math.sin(angle) * 15;

        const group = new THREE.Group();

        // 身体
        const bodyGeom = new THREE.CapsuleGeometry(0.4, 1, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: [0x8b4513, 0x4a5568, 0x2d3748, 0x744210, 0x553c9a][index % 5]
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 1.2;
        group.add(body);

        // 头
        const headGeom = new THREE.SphereGeometry(0.35, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xdeb887 });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 2.2;
        group.add(head);

        // 帽子
        const hatGeom = new THREE.CylinderGeometry(0.5, 0.4, 0.3, 8);
        const hatMat = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const hat = new THREE.Mesh(hatGeom, hatMat);
        hat.position.y = 2.6;
        group.add(hat);

        group.position.set(x, 0, z);
        group.lookAt(0, 0, 0);
        group.userData = {
            index,
            hoverTitle: `牧民 ${index + 1}`,
            hoverDesc: `当前有 ${this.sheepCounts[index]} 只羊`
        };

        this.mainGroup.add(group);
        this.farmerMeshes.push(group);
        this.interactables.push(group);
    }

    /**
     * 创建羊模型
     */
    createSheep(x, z) {
        const group = new THREE.Group();

        // 身体
        const bodyGeom = new THREE.SphereGeometry(0.5, 8, 8);
        bodyGeom.scale(1.2, 0.8, 0.8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.5;
        group.add(body);

        // 头
        const headGeom = new THREE.SphereGeometry(0.25, 6, 6);
        const headMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.set(0.5, 0.6, 0);
        group.add(head);

        // 腿
        for (let i = 0; i < 4; i++) {
            const legGeom = new THREE.CylinderGeometry(0.08, 0.08, 0.4);
            const legMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
            const leg = new THREE.Mesh(legGeom, legMat);
            leg.position.set(
                (i < 2 ? 0.3 : -0.3),
                0.2,
                (i % 2 === 0 ? 0.2 : -0.2)
            );
            group.add(leg);
        }

        group.position.set(x, 0, z);
        group.rotation.y = Math.random() * Math.PI * 2;

        return group;
    }

    /**
     * 更新羊群模型
     */
    updateSheepMeshes() {
        // 清除旧的羊
        this.sheepMeshes.forEach(sheep => this.mainGroup.remove(sheep));
        this.sheepMeshes = [];

        // 计算总羊数
        const totalSheep = this.sheepCounts.reduce((a, b) => a + b, 0);

        // 创建新的羊（限制显示数量）
        const displayCount = Math.min(totalSheep, 50);

        for (let i = 0; i < displayCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = 2 + Math.random() * 12;
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;

            const sheep = this.createSheep(x, z);
            this.mainGroup.add(sheep);
            this.sheepMeshes.push(sheep);
        }
    }

    /**
     * 更新草地颜色
     */
    updateGrassColor() {
        const health = this.grassHealth;
        let color;

        if (health > 60) {
            color = new THREE.Color(this.colors.grassHealthy);
        } else if (health > 30) {
            // 健康到枯黄
            const t = (health - 30) / 30;
            color = new THREE.Color(this.colors.grassDying).lerp(
                new THREE.Color(this.colors.grassHealthy), t
            );
        } else {
            // 枯黄到死亡
            const t = health / 30;
            color = new THREE.Color(this.colors.grassDead).lerp(
                new THREE.Color(this.colors.grassDying), t
            );
        }

        this.grassMesh.material.color = color;
    }

    /**
     * 模拟一轮
     */
    simulateRound() {
        const { farmers, greediness, maxCapacity, regenerationRate } = this.params;

        // 1. 牧民决策：是否增加羊
        for (let i = 0; i < farmers; i++) {
            if (Math.random() < greediness && this.grassHealth > 20) {
                this.sheepCounts[i]++;
            }
        }

        // 2. 计算总羊数和消耗
        const totalSheep = this.sheepCounts.reduce((a, b) => a + b, 0);
        const consumption = totalSheep * 2;  // 每只羊消耗2点

        // 3. 草地变化
        const regeneration = this.grassHealth * regenerationRate;
        this.grassHealth = Math.max(0, Math.min(100, 
            this.grassHealth + regeneration - consumption
        ));

        // 4. 如果草地太差，羊会死
        if (this.grassHealth < 10) {
            for (let i = 0; i < farmers; i++) {
                const deaths = Math.floor(this.sheepCounts[i] * 0.3);
                this.sheepCounts[i] = Math.max(0, this.sheepCounts[i] - deaths);
            }
        }

        // 5. 记录历史
        this.round++;
        this.history.push({
            round: this.round,
            grassHealth: this.grassHealth,
            totalSheep: this.sheepCounts.reduce((a, b) => a + b, 0)
        });

        // 6. 更新视觉
        this.updateSheepMeshes();
        this.updateGrassColor();
        this.updateInfoDisplay();

        // 更新牧民信息
        this.farmerMeshes.forEach((mesh, i) => {
            mesh.userData.hoverDesc = `当前有 ${this.sheepCounts[i]} 只羊`;
        });
    }

    /**
     * 开始自动模拟
     */
    startSimulation() {
        if (this.isSimulating) return;
        this.isSimulating = true;

        const simulate = () => {
            if (!this.isSimulating) return;

            this.simulateRound();

            if (this.grassHealth <= 0) {
                this.isSimulating = false;
                this.showGuide('💀 公地悲剧！草地完全退化，所有人都失去了牧场！');
                return;
            }

            setTimeout(simulate, 800);
        };

        simulate();
    }

    /**
     * 停止模拟
     */
    stopSimulation() {
        this.isSimulating = false;
    }

    /**
     * 清除牧场
     */
    clearFarm() {
        this.sheepMeshes.forEach(mesh => this.mainGroup.remove(mesh));
        this.farmerMeshes.forEach(mesh => this.mainGroup.remove(mesh));
        this.sheepMeshes = [];
        this.farmerMeshes = [];
        this.sheepCounts = [];
        this.interactables = [];
    }

    /**
     * 更新信息显示
     */
    updateInfoDisplay() {
        let panel = document.getElementById('commons-info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'commons-info-panel';
            panel.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(10, 30, 20, 0.95);
                border: 1px solid #228b22;
                border-radius: 8px;
                padding: 16px;
                color: #fff;
                font-size: 14px;
                z-index: 100;
                min-width: 200px;
            `;
            document.getElementById('scene-canvas-container')?.appendChild(panel);
        }

        const totalSheep = this.sheepCounts.reduce((a, b) => a + b, 0);
        const healthColor = this.grassHealth > 60 ? '#228b22' : 
                           this.grassHealth > 30 ? '#daa520' : '#8b4513';

        panel.innerHTML = `
            <div style="color: #228b22; font-size: 16px; margin-bottom: 12px;">
                <i class="fas fa-leaf"></i> 公地悲剧模拟
            </div>
            
            <div style="margin-bottom: 10px;">
                <div style="color: #888;">回合</div>
                <div style="font-size: 20px;">${this.round}</div>
            </div>
            
            <div style="margin-bottom: 10px;">
                <div style="color: #888;">草地健康度</div>
                <div style="background: #333; height: 12px; border-radius: 6px; overflow: hidden;">
                    <div style="width: ${this.grassHealth}%; height: 100%; background: ${healthColor};
                        transition: width 0.3s;"></div>
                </div>
                <div style="color: ${healthColor}; font-size: 12px; margin-top: 2px;">
                    ${this.grassHealth.toFixed(0)}%
                </div>
            </div>
            
            <div style="margin-bottom: 10px;">
                <div style="color: #888;">总羊数</div>
                <div style="font-size: 20px; color: #fff;">🐑 ${totalSheep}</div>
            </div>
            
            <div style="border-top: 1px solid #333; padding-top: 10px;">
                <div style="color: #888; font-size: 12px;">各牧民羊数</div>
                <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px;">
                    ${this.sheepCounts.map((count, i) => 
                        `<span style="background: #2a3a2a; padding: 2px 6px; border-radius: 4px; font-size: 12px;">
                            牧民${i+1}: ${count}
                        </span>`
                    ).join('')}
                </div>
            </div>
            
            ${this.grassHealth < 30 ? `
                <div style="margin-top: 10px; padding: 8px; background: rgba(255,0,0,0.2); 
                    border-radius: 4px; color: #ff6b6b; font-size: 12px;">
                    ⚠️ 警告：草地正在退化！
                </div>
            ` : ''}
        `;
    }

    /**
     * 设置UI控制按钮
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-start">
                <i class="fas fa-play"></i> 开始模拟
            </button>
            <button class="control-btn" id="btn-step">
                <i class="fas fa-step-forward"></i> 单步
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-adjust">
                <i class="fas fa-sliders-h"></i> 调整参数
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        document.getElementById('btn-start').onclick = () => {
            if (this.isSimulating) {
                this.stopSimulation();
                document.getElementById('btn-start').innerHTML = '<i class="fas fa-play"></i> 开始模拟';
            } else {
                this.startSimulation();
                document.getElementById('btn-start').innerHTML = '<i class="fas fa-pause"></i> 暂停';
            }
        };
        document.getElementById('btn-step').onclick = () => {
            if (!this.isSimulating) {
                this.simulateRound();
            }
        };
        document.getElementById('btn-reset').onclick = () => {
            this.stopSimulation();
            this.initFarm();
            document.getElementById('btn-start').innerHTML = '<i class="fas fa-play"></i> 开始模拟';
            this.showGuide('🔄 已重置牧场');
        };
        document.getElementById('btn-adjust').onclick = () => this.showAdjustPanel();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    /**
     * 显示参数调整面板
     */
    showAdjustPanel() {
        let panel = document.getElementById('adjust-panel');
        if (panel) {
            panel.remove();
            return;
        }

        panel = document.createElement('div');
        panel.id = 'adjust-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(10, 30, 20, 0.98);
            border: 1px solid #228b22;
            border-radius: 12px;
            padding: 24px;
            z-index: 1000;
            min-width: 300px;
        `;

        panel.innerHTML = `
            <h3 style="color: #228b22; margin-bottom: 20px;">
                <i class="fas fa-sliders-h"></i> 调整参数
            </h3>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    牧民数量: <span id="farmers-val">${this.params.farmers}</span>
                </label>
                <input type="range" id="param-farmers" min="2" max="10" step="1" 
                    value="${this.params.farmers}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    贪婪程度: <span id="greed-val">${(this.params.greediness * 100).toFixed(0)}%</span>
                </label>
                <input type="range" id="param-greed" min="0" max="80" step="10"
                    value="${this.params.greediness * 100}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    初始羊数/人: <span id="sheep-val">${this.params.initialSheep}</span>
                </label>
                <input type="range" id="param-sheep" min="1" max="5" step="1"
                    value="${this.params.initialSheep}" style="width: 100%;">
            </div>
            
            <button id="adjust-apply" style="width: 100%; padding: 12px; background: #228b22; 
                border: none; color: #fff; border-radius: 6px; cursor: pointer; font-weight: bold;">
                <i class="fas fa-check"></i> 应用并重置
            </button>
            <button id="adjust-close" style="width: 100%; padding: 10px; background: #333;
                border: none; color: #fff; border-radius: 6px; cursor: pointer; margin-top: 8px;">
                关闭
            </button>
        `;

        document.body.appendChild(panel);

        // 绑定事件
        document.getElementById('param-farmers').oninput = (e) => {
            document.getElementById('farmers-val').textContent = e.target.value;
        };
        document.getElementById('param-greed').oninput = (e) => {
            document.getElementById('greed-val').textContent = e.target.value + '%';
        };
        document.getElementById('param-sheep').oninput = (e) => {
            document.getElementById('sheep-val').textContent = e.target.value;
        };
        document.getElementById('adjust-apply').onclick = () => {
            this.params.farmers = parseInt(document.getElementById('param-farmers').value);
            this.params.greediness = document.getElementById('param-greed').value / 100;
            this.params.initialSheep = parseInt(document.getElementById('param-sheep').value);
            this.stopSimulation();
            this.initFarm();
            panel.remove();
            document.getElementById('btn-start').innerHTML = '<i class="fas fa-play"></i> 开始模拟';
        };
        document.getElementById('adjust-close').onclick = () => panel.remove();
    }

    /**
     * 重置视角
     */
    resetView() {
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: this.defaultCameraPos.x,
                y: this.defaultCameraPos.y,
                z: this.defaultCameraPos.z,
                duration: 0.8,
                ease: 'power2.out'
            });
        } else {
            this.camera.position.set(
                this.defaultCameraPos.x,
                this.defaultCameraPos.y,
                this.defaultCameraPos.z
            );
        }
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 显示引导消息
     */
    showGuide(message) {
        const container = document.getElementById('scene-canvas-container');
        if (!container) return;

        const oldGuide = container.querySelector('.scene-guide-message');
        if (oldGuide) oldGuide.remove();

        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        guide.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(34, 139, 34, 0.2);
            border: 1px solid rgba(34, 139, 34, 0.4);
            padding: 12px 24px;
            border-radius: 8px;
            color: #228b22;
            font-size: 14px;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s;
            max-width: 400px;
            text-align: center;
        `;
        container.appendChild(guide);

        setTimeout(() => guide.style.opacity = '1', 100);
        setTimeout(() => {
            guide.style.opacity = '0';
            setTimeout(() => guide.remove(), 300);
        }, 4000);
    }

    /**
     * 初始引导
     */
    showInitialGuide() {
        setTimeout(() => {
            this.showGuide('🏞️ 公地悲剧：每个人的理性选择导致集体的灾难');
        }, 1000);
        setTimeout(() => {
            this.showGuide('💡 每个牧民都想多养羊，但草地承载有限...');
        }, 5000);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        // 羊轻微移动
        this.sheepMeshes.forEach((sheep, i) => {
            const t = time * 0.001 + i;
            sheep.position.x += Math.sin(t) * 0.002;
            sheep.position.z += Math.cos(t * 0.7) * 0.002;

            // 限制在草地范围内
            const dist = Math.sqrt(sheep.position.x ** 2 + sheep.position.z ** 2);
            if (dist > 15) {
                sheep.position.x *= 0.99;
                sheep.position.z *= 0.99;
            }
        });
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return this.interactables;
    }

    /**
     * 清理场景
     */
    dispose() {
        this.stopSimulation();
        this.clearFarm();
        
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
        }

        // 移除UI元素
        ['commons-info-panel', 'adjust-panel'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    /**
     * 背景点击处理
     */
    onBackgroundClick() {
        const adjustPanel = document.getElementById('adjust-panel');
        if (adjustPanel) adjustPanel.remove();
    }
};
