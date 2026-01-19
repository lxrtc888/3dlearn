/**
 * 熵增定律场景 - Entropy Increase Visualization
 * ============================================
 * 核心原理：
 * - 熵 = 系统的混乱度/无序度
 * - 封闭系统中，熵只能增加或保持不变
 * - 时间的方向 = 熵增加的方向
 * - 打碎的杯子无法复原（概率太低）
 * ============================================
 */
window.EntropyScene = class EntropyScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.container = null;          // 容器
        this.divider = null;            // 隔板
        this.redParticles = [];         // 红色粒子
        this.blueParticles = [];        // 蓝色粒子
        this.entropyGraph = null;       // 熵值曲线

        // 场景参数
        this.params = {
            particleCount: 60,           // 每边粒子数量
            containerSize: { x: 20, y: 12, z: 12 },
            particleRadius: 0.3,
            maxSpeed: 0.15,
            dividerRemoved: false,       // 隔板是否移除
            isRunning: false,            // 是否在运动
            temperature: 1.0             // 温度（影响速度）
        };

        // 熵值历史
        this.entropyHistory = [];
        this.maxHistoryLength = 200;

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 15, z: 35 };
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

        // 背景
        this.scene.background = new THREE.Color(0x0a0a15);
        this.scene.fog = new THREE.FogExp2(0x0a0a15, 0.015);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);

        // 主方向光
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.7);
        mainLight.position.set(10, 20, 15);
        this.scene.add(mainLight);

        // 红色点光源
        const redLight = new THREE.PointLight(0xff4444, 0.5, 30);
        redLight.position.set(-8, 5, 0);
        this.scene.add(redLight);

        // 蓝色点光源
        const blueLight = new THREE.PointLight(0x4444ff, 0.5, 30);
        blueLight.position.set(8, 5, 0);
        this.scene.add(blueLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建容器
        this.createContainer();

        // 创建隔板
        this.createDivider();

        // 创建粒子
        this.createParticles();

        // 创建熵值显示
        this.createEntropyDisplay();

        // 创建网格地面
        const grid = new THREE.GridHelper(40, 40, 0x222244, 0x111122);
        grid.position.y = -8;
        this.mainGroup.add(grid);
    }

    /**
     * 创建容器
     */
    createContainer() {
        const { x, y, z } = this.params.containerSize;
        
        // 容器边框（线框）
        const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(x, y, z));
        const lineMat = new THREE.LineBasicMaterial({ color: 0x4488ff, linewidth: 2 });
        this.container = new THREE.LineSegments(edges, lineMat);
        this.mainGroup.add(this.container);

        // 透明面板（半透明）
        const panelMat = new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide
        });

        // 前面板
        const frontPanel = new THREE.Mesh(
            new THREE.PlaneGeometry(x, y),
            panelMat
        );
        frontPanel.position.z = z / 2;
        this.mainGroup.add(frontPanel);

        // 后面板
        const backPanel = frontPanel.clone();
        backPanel.position.z = -z / 2;
        this.mainGroup.add(backPanel);
    }

    /**
     * 创建隔板
     */
    createDivider() {
        const { y, z } = this.params.containerSize;
        
        const dividerGeo = new THREE.BoxGeometry(0.3, y - 0.5, z - 0.5);
        const dividerMat = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa,
            metalness: 0.5,
            roughness: 0.3
        });
        this.divider = new THREE.Mesh(dividerGeo, dividerMat);
        this.divider.position.x = 0;
        this.mainGroup.add(this.divider);

        // 添加交互
        this.interactables.push({
            object: this.divider,
            info: {
                title: '隔板',
                content: `
                    <p>🔲 <strong>分隔容器的隔板</strong></p>
                    <p>隔板将容器分成两半：</p>
                    <p>• 左边：红色粒子</p>
                    <p>• 右边：蓝色粒子</p>
                    <br>
                    <p>💡 <strong>有序状态</strong></p>
                    <p>粒子被整齐分隔，系统<span class="text-green-400">熵值低</span></p>
                    <br>
                    <p>点击"移除隔板"观察熵增过程！</p>
                `
            }
        });
    }

    /**
     * 创建粒子
     */
    createParticles() {
        const { x, y, z } = this.params.containerSize;
        const count = this.params.particleCount;
        const r = this.params.particleRadius;

        // 红色粒子（左半边）
        const redGeo = new THREE.SphereGeometry(r, 16, 16);
        const redMat = new THREE.MeshStandardMaterial({
            color: 0xff4444,
            emissive: 0x441111,
            metalness: 0.3,
            roughness: 0.4
        });

        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(redGeo, redMat.clone());
            particle.position.set(
                -x / 4 + (Math.random() - 0.5) * (x / 2 - r * 3),
                (Math.random() - 0.5) * (y - r * 3),
                (Math.random() - 0.5) * (z - r * 3)
            );
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * this.params.maxSpeed,
                    (Math.random() - 0.5) * this.params.maxSpeed,
                    (Math.random() - 0.5) * this.params.maxSpeed
                ),
                type: 'red'
            };
            this.redParticles.push(particle);
            this.mainGroup.add(particle);
        }

        // 蓝色粒子（右半边）
        const blueGeo = new THREE.SphereGeometry(r, 16, 16);
        const blueMat = new THREE.MeshStandardMaterial({
            color: 0x4444ff,
            emissive: 0x111144,
            metalness: 0.3,
            roughness: 0.4
        });

        for (let i = 0; i < count; i++) {
            const particle = new THREE.Mesh(blueGeo, blueMat.clone());
            particle.position.set(
                x / 4 + (Math.random() - 0.5) * (x / 2 - r * 3),
                (Math.random() - 0.5) * (y - r * 3),
                (Math.random() - 0.5) * (z - r * 3)
            );
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * this.params.maxSpeed,
                    (Math.random() - 0.5) * this.params.maxSpeed,
                    (Math.random() - 0.5) * this.params.maxSpeed
                ),
                type: 'blue'
            };
            this.blueParticles.push(particle);
            this.mainGroup.add(particle);
        }
    }

    /**
     * 创建熵值显示
     */
    createEntropyDisplay() {
        // 背景面板
        const bgGeo = new THREE.PlaneGeometry(12, 6);
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        this.entropyGraph = new THREE.Mesh(bgGeo, bgMat);
        this.entropyGraph.position.set(0, 12, 0);
        this.mainGroup.add(this.entropyGraph);

        // 熵值曲线将在update中动态更新
        this.entropyLine = null;
    }

    /**
     * 计算当前熵值
     */
    calculateEntropy() {
        const { x } = this.params.containerSize;
        const allParticles = [...this.redParticles, ...this.blueParticles];
        
        // 统计左右两边的红蓝粒子数量
        let redLeft = 0, redRight = 0, blueLeft = 0, blueRight = 0;
        
        allParticles.forEach(p => {
            const isLeft = p.position.x < 0;
            if (p.userData.type === 'red') {
                if (isLeft) redLeft++; else redRight++;
            } else {
                if (isLeft) blueLeft++; else blueRight++;
            }
        });

        // 使用简化的熵计算：混合程度
        // 完全分离时熵=0，完全混合时熵=1
        const total = this.params.particleCount * 2;
        const leftTotal = redLeft + blueLeft;
        const rightTotal = redRight + blueRight;

        // 每边的混合程度
        let entropyLeft = 0, entropyRight = 0;
        
        if (leftTotal > 0) {
            const pRed = redLeft / leftTotal;
            const pBlue = blueLeft / leftTotal;
            if (pRed > 0 && pBlue > 0) {
                entropyLeft = -(pRed * Math.log2(pRed) + pBlue * Math.log2(pBlue));
            }
        }
        
        if (rightTotal > 0) {
            const pRed = redRight / rightTotal;
            const pBlue = blueRight / rightTotal;
            if (pRed > 0 && pBlue > 0) {
                entropyRight = -(pRed * Math.log2(pRed) + pBlue * Math.log2(pBlue));
            }
        }

        // 总熵
        const totalEntropy = (entropyLeft * leftTotal + entropyRight * rightTotal) / total;
        return totalEntropy; // 0到1之间
    }

    /**
     * 更新熵值曲线
     */
    updateEntropyGraph() {
        const entropy = this.calculateEntropy();
        this.entropyHistory.push(entropy);
        
        if (this.entropyHistory.length > this.maxHistoryLength) {
            this.entropyHistory.shift();
        }

        // 移除旧曲线
        if (this.entropyLine) {
            this.mainGroup.remove(this.entropyLine);
            this.entropyLine.geometry.dispose();
            this.entropyLine.material.dispose();
        }

        // 创建新曲线
        const points = [];
        const width = 10;
        const height = 4;
        
        for (let i = 0; i < this.entropyHistory.length; i++) {
            const x = (i / this.maxHistoryLength) * width - width / 2;
            const y = this.entropyHistory[i] * height + 10;
            points.push(new THREE.Vector3(x, y, 0.1));
        }

        if (points.length > 1) {
            const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
            const lineMat = new THREE.LineBasicMaterial({ color: 0x00ff88 });
            this.entropyLine = new THREE.Line(lineGeo, lineMat);
            this.mainGroup.add(this.entropyLine);
        }
    }

    /**
     * 移除隔板
     */
    removeDivider() {
        if (this.params.dividerRemoved) return;
        
        this.params.dividerRemoved = true;
        this.params.isRunning = true;

        // 动画移除隔板
        gsap.to(this.divider.position, {
            y: 15,
            duration: 1,
            ease: 'power2.in',
            onComplete: () => {
                this.divider.visible = false;
            }
        });

        gsap.to(this.divider.rotation, {
            z: Math.PI / 4,
            duration: 1,
            ease: 'power2.in'
        });
    }

    /**
     * 尝试逆转（演示不可能）
     */
    attemptReverse() {
        // 显示说明：逆转在理论上可能，但概率极低
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            title.textContent = '⏪ 尝试逆转...';
            content.innerHTML = `
                <p><strong>逆转失败！</strong></p>
                <br>
                <p>为什么粒子不会自动分开？</p>
                <br>
                <p>📊 <strong>概率计算：</strong></p>
                <p>假设有N个粒子，每个粒子有50%概率在左边或右边。</p>
                <p>所有粒子同时恰好回到原位的概率：</p>
                <p class="text-yellow-400 text-lg">(1/2)^${this.params.particleCount * 2} ≈ 10^-${Math.floor(this.params.particleCount * 2 * 0.301)}</p>
                <br>
                <p>💡 这个概率<span class="text-red-400">极其微小</span>，</p>
                <p>即使等到宇宙终结也不会发生！</p>
                <br>
                <p>🕐 这就是为什么<span class="text-cyan-400">时间只能向前</span>。</p>
                <p>熵增定律定义了"时间的箭头"。</p>
            `;
            panel.classList.add('visible');
        }

        // 给粒子一些随机扰动，表示"尝试"
        [...this.redParticles, ...this.blueParticles].forEach(p => {
            p.userData.velocity.x += (Math.random() - 0.5) * 0.1;
            p.userData.velocity.y += (Math.random() - 0.5) * 0.1;
            p.userData.velocity.z += (Math.random() - 0.5) * 0.1;
        });
    }

    /**
     * 重置场景
     */
    resetScene() {
        const { x, y, z } = this.params.containerSize;
        const r = this.params.particleRadius;

        // 重置隔板
        this.params.dividerRemoved = false;
        this.params.isRunning = false;
        this.divider.visible = true;
        this.divider.position.set(0, 0, 0);
        this.divider.rotation.set(0, 0, 0);

        // 重置红色粒子位置
        this.redParticles.forEach(p => {
            p.position.set(
                -x / 4 + (Math.random() - 0.5) * (x / 2 - r * 3),
                (Math.random() - 0.5) * (y - r * 3),
                (Math.random() - 0.5) * (z - r * 3)
            );
            p.userData.velocity.set(
                (Math.random() - 0.5) * this.params.maxSpeed,
                (Math.random() - 0.5) * this.params.maxSpeed,
                (Math.random() - 0.5) * this.params.maxSpeed
            );
        });

        // 重置蓝色粒子位置
        this.blueParticles.forEach(p => {
            p.position.set(
                x / 4 + (Math.random() - 0.5) * (x / 2 - r * 3),
                (Math.random() - 0.5) * (y - r * 3),
                (Math.random() - 0.5) * (z - r * 3)
            );
            p.userData.velocity.set(
                (Math.random() - 0.5) * this.params.maxSpeed,
                (Math.random() - 0.5) * this.params.maxSpeed,
                (Math.random() - 0.5) * this.params.maxSpeed
            );
        });

        // 清除熵历史
        this.entropyHistory = [];
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;

        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn primary" id="btn-remove-divider">
                <i class="fas fa-border-none"></i> 移除隔板
            </button>
            <button class="control-btn" id="btn-play">
                <i class="fas fa-play"></i> 开始运动
            </button>
            <button class="control-btn" id="btn-reverse">
                <i class="fas fa-undo"></i> 尝试逆转
            </button>
            <div class="control-slider-group">
                <label>温度: <span id="temp-value">${this.params.temperature.toFixed(1)}</span></label>
                <input type="range" id="temp-slider" min="0.2" max="2.0" step="0.1" 
                       value="${this.params.temperature}" class="styled-slider">
            </div>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 视角
            </button>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 移除隔板
        document.getElementById('btn-remove-divider')?.addEventListener('click', () => {
            this.removeDivider();
        });

        // 播放/暂停
        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.params.isRunning = !this.params.isRunning;
            const btn = document.getElementById('btn-play');
            btn.innerHTML = this.params.isRunning ? 
                '<i class="fas fa-pause"></i> 暂停' : 
                '<i class="fas fa-play"></i> 开始运动';
        });

        // 尝试逆转
        document.getElementById('btn-reverse')?.addEventListener('click', () => {
            this.attemptReverse();
        });

        // 温度调节
        document.getElementById('temp-slider')?.addEventListener('input', (e) => {
            this.params.temperature = parseFloat(e.target.value);
            document.getElementById('temp-value').textContent = 
                this.params.temperature.toFixed(1);
        });

        // 重置
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.resetScene();
        });

        // 重置视角
        document.getElementById('btn-reset-view')?.addEventListener('click', () => {
            gsap.to(this.camera.position, {
                x: this.defaultCameraPos.x,
                y: this.defaultCameraPos.y,
                z: this.defaultCameraPos.z,
                duration: 1,
                ease: 'power2.out'
            });
        });
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            title.textContent = '🔥 熵增定律';
            content.innerHTML = `
                <p><strong>热力学第二定律</strong></p>
                <br>
                <p>观察容器中的粒子：</p>
                <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                    <li>• <span class="text-red-400">红色粒子</span>在左边</li>
                    <li>• <span class="text-blue-400">蓝色粒子</span>在右边</li>
                </ul>
                <br>
                <p>这是一个<span class="text-green-400">有序状态</span>（低熵）</p>
                <br>
                <p><strong>实验步骤：</strong></p>
                <p>1. 点击"移除隔板"</p>
                <p>2. 观察粒子如何混合</p>
                <p>3. 尝试"逆转"看看会发生什么</p>
                <br>
                <p>💡 顶部绿色曲线显示<span class="text-cyan-400">熵值变化</span></p>
            `;
            panel.classList.add('visible');
        }
    }

    /**
     * 更新粒子物理
     */
    updateParticles(delta) {
        if (!this.params.isRunning) return;

        const { x, y, z } = this.params.containerSize;
        const r = this.params.particleRadius;
        const halfX = x / 2 - r;
        const halfY = y / 2 - r;
        const halfZ = z / 2 - r;
        const speed = this.params.temperature;

        const allParticles = [...this.redParticles, ...this.blueParticles];

        allParticles.forEach(p => {
            const vel = p.userData.velocity;

            // 更新位置
            p.position.x += vel.x * speed * delta * 60;
            p.position.y += vel.y * speed * delta * 60;
            p.position.z += vel.z * speed * delta * 60;

            // 边界碰撞
            if (p.position.x > halfX) { p.position.x = halfX; vel.x *= -1; }
            if (p.position.x < -halfX) { p.position.x = -halfX; vel.x *= -1; }
            if (p.position.y > halfY) { p.position.y = halfY; vel.y *= -1; }
            if (p.position.y < -halfY) { p.position.y = -halfY; vel.y *= -1; }
            if (p.position.z > halfZ) { p.position.z = halfZ; vel.z *= -1; }
            if (p.position.z < -halfZ) { p.position.z = -halfZ; vel.z *= -1; }

            // 隔板碰撞（如果未移除）
            if (!this.params.dividerRemoved) {
                if (Math.abs(p.position.x) < r + 0.15) {
                    if (p.userData.type === 'red' && p.position.x > -r) {
                        p.position.x = -r - 0.15;
                        vel.x *= -1;
                    } else if (p.userData.type === 'blue' && p.position.x < r) {
                        p.position.x = r + 0.15;
                        vel.x *= -1;
                    }
                }
            }
        });
    }

    /**
     * 动画更新（场景管理器调用）
     */
    animate(time, delta) {
        // 更新粒子
        this.updateParticles(delta);

        // 更新熵值曲线
        if (this.params.isRunning) {
            this.updateEntropyGraph();
        }

        // 粒子发光效果
        [...this.redParticles, ...this.blueParticles].forEach((p, i) => {
            const pulse = 0.8 + 0.2 * Math.sin(time * 2 + i * 0.1);
            p.material.emissiveIntensity = pulse;
        });
    }

    /**
     * 处理点击
     */
    onMouseClick(raycaster) {
        const meshes = this.interactables.map(item => item.object);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const item = this.interactables.find(i => i.object === clickedMesh);

            if (item) {
                const panel = document.getElementById('info-panel');
                const title = document.getElementById('info-title');
                const content = document.getElementById('info-content');

                if (panel && title && content) {
                    title.textContent = item.info.title;
                    content.innerHTML = item.info.content;
                    panel.classList.add('visible');
                }
            }
        }
    }

    /**
     * 处理鼠标移动
     */
    onMouseMove(raycaster) {
        const meshes = this.interactables.map(item => item.object);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (this.highlighted) {
            if (this.highlighted.material.emissive) {
                this.highlighted.material.emissive.setHex(
                    this.highlighted.userData.originalEmissive || 0x000000
                );
            }
            this.highlighted = null;
        }

        if (intersects.length > 0) {
            this.highlighted = intersects[0].object;
            if (this.highlighted.material.emissive) {
                this.highlighted.userData.originalEmissive = 
                    this.highlighted.material.emissive.getHex();
                this.highlighted.material.emissive.setHex(0x444444);
            }
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    /**
     * 清理资源
     */
    dispose() {
        // 清除UI
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'none';
            controlsDiv.innerHTML = '';
        }

        // 清除熵曲线
        if (this.entropyLine) {
            this.mainGroup.remove(this.entropyLine);
            this.entropyLine.geometry.dispose();
            this.entropyLine.material.dispose();
        }

        // 移除主组
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
            this.mainGroup.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        }

        this.redParticles = [];
        this.blueParticles = [];
        this.entropyHistory = [];
        this.interactables = [];
    }
};
