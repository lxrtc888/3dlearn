/**
 * 洛伦兹吸引子（蝴蝶效应）场景 - Lorenz Attractor Visualization
 * ============================================
 * "一只蝴蝶扇动翅膀，能引发大洋彼岸的风暴"
 * 
 * 核心概念（Edward Lorenz 1963年发现）：
 * 洛伦兹方程：
 *   dx/dt = σ(y - x)
 *   dy/dt = x(ρ - z) - y
 *   dz/dt = xy - βz
 * 
 * 经典参数：σ=10, ρ=28, β=8/3
 * 
 * 蝴蝶效应：初始条件的微小差异 → 完全不同的结果
 * 这就是为什么天气预报无法长期准确！
 * ============================================
 */
window.LorenzAttractorScene = class LorenzAttractorScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 洛伦兹参数
        this.params = {
            sigma: 10,      // σ：普朗特数
            rho: 28,        // ρ：瑞利数
            beta: 8 / 3,    // β：几何因子
            dt: 0.005,      // 时间步长
            speed: 2,       // 模拟速度
            trailLength: 2000  // 轨迹点数
        };

        // 粒子状态
        this.particles = [];
        this.trails = [];
        this.trailGeometries = [];
        this.trailMaterials = [];

        // 状态
        this.isPlaying = true;
        this.showSecondParticle = false;
        this.time = 0;

        // 颜色
        this.colors = {
            background: 0x0a0a18,
            particle1: 0x00ffff,
            particle2: 0xff6b6b,
            trail1Start: 0x00ffff,
            trail1End: 0x0066ff,
            trail2Start: 0xff6b6b,
            trail2End: 0xff00ff,
            grid: 0x1a1a3e,
            glow: 0x4488ff
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 30, z: 60 };
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
        this.scene.background = new THREE.Color(this.colors.background);
        this.scene.fog = new THREE.FogExp2(this.colors.background, 0.008);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();

        // 初始化粒子
        this.initParticles();
    }

    /**
     * 设置光照
     */
    setupLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.4);
        directional.position.set(10, 20, 10);
        this.scene.add(directional);

        // 添加点光源增强效果
        const pointLight = new THREE.PointLight(this.colors.glow, 0.5, 100);
        pointLight.position.set(0, 25, 0);
        this.scene.add(pointLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建坐标轴
        this.createAxes();

        // 创建网格平面
        this.createGrid();

        // 创建背景星空
        this.createStars();

        // 创建信息面板
        this.createInfoPanel();
    }

    /**
     * 创建坐标轴
     */
    createAxes() {
        const axisLength = 35;
        const axisGroup = new THREE.Group();

        // X轴 - 红色
        const xGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ]);
        const xMat = new THREE.LineBasicMaterial({ color: 0xff4444, opacity: 0.5, transparent: true });
        axisGroup.add(new THREE.Line(xGeom, xMat));

        // Y轴 - 绿色
        const yGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -axisLength, 0),
            new THREE.Vector3(0, axisLength, 0)
        ]);
        const yMat = new THREE.LineBasicMaterial({ color: 0x44ff44, opacity: 0.5, transparent: true });
        axisGroup.add(new THREE.Line(yGeom, yMat));

        // Z轴 - 蓝色
        const zGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -axisLength),
            new THREE.Vector3(0, 0, axisLength)
        ]);
        const zMat = new THREE.LineBasicMaterial({ color: 0x4444ff, opacity: 0.5, transparent: true });
        axisGroup.add(new THREE.Line(zGeom, zMat));

        this.mainGroup.add(axisGroup);
    }

    /**
     * 创建网格
     */
    createGrid() {
        const grid = new THREE.GridHelper(80, 40, this.colors.grid, this.colors.grid);
        grid.position.y = -25;
        grid.material.opacity = 0.15;
        grid.material.transparent = true;
        this.mainGroup.add(grid);
    }

    /**
     * 创建星空背景
     */
    createStars() {
        const starsGeom = new THREE.BufferGeometry();
        const starCount = 1500;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const radius = 100 + Math.random() * 200;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }

        starsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starsMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.5,
            transparent: true,
            opacity: 0.6
        });

        this.stars = new THREE.Points(starsGeom, starsMat);
        this.scene.add(this.stars);
    }

    /**
     * 创建3D信息面板
     */
    createInfoPanel() {
        // 距离差显示标签（将在动画中更新）
        this.distanceLabel = null;
    }

    /**
     * 初始化粒子
     */
    initParticles() {
        // 清除旧的
        this.clearParticles();

        // 粒子1 - 青色
        this.createParticle(0, {
            x: 0.1,
            y: 0,
            z: 0
        }, this.colors.particle1, this.colors.trail1Start, this.colors.trail1End);

        // 粒子2 - 红色（初始偏移极小）
        if (this.showSecondParticle) {
            this.createParticle(1, {
                x: 0.1 + 0.0001,  // 仅差0.0001！
                y: 0,
                z: 0
            }, this.colors.particle2, this.colors.trail2Start, this.colors.trail2End);
        }
    }

    /**
     * 创建单个粒子
     */
    createParticle(index, initialPos, color, trailStartColor, trailEndColor) {
        // 粒子球体
        const geometry = new THREE.SphereGeometry(0.6, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.8
        });
        const mesh = new THREE.Mesh(geometry, material);

        // 发光效果
        const glowGeom = new THREE.SphereGeometry(1.2, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        mesh.add(glow);

        // 设置初始位置
        mesh.position.set(initialPos.x, initialPos.z, initialPos.y);
        this.mainGroup.add(mesh);

        // 粒子数据
        this.particles[index] = {
            mesh: mesh,
            x: initialPos.x,
            y: initialPos.y,
            z: initialPos.z,
            trail: [],
            color: color
        };

        // 轨迹线
        const trailPositions = new Float32Array(this.params.trailLength * 3);
        const trailColors = new Float32Array(this.params.trailLength * 3);
        
        const trailGeom = new THREE.BufferGeometry();
        trailGeom.setAttribute('position', new THREE.BufferAttribute(trailPositions, 3));
        trailGeom.setAttribute('color', new THREE.BufferAttribute(trailColors, 3));

        const trailMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const trail = new THREE.Line(trailGeom, trailMat);
        this.mainGroup.add(trail);

        this.trails[index] = trail;
        this.trailGeometries[index] = trailGeom;

        // 存储颜色用于渐变
        this.particles[index].startColor = new THREE.Color(trailStartColor);
        this.particles[index].endColor = new THREE.Color(trailEndColor);
    }

    /**
     * 清除粒子
     */
    clearParticles() {
        this.particles.forEach(p => {
            if (p && p.mesh) {
                this.mainGroup.remove(p.mesh);
            }
        });
        this.trails.forEach(t => {
            if (t) {
                this.mainGroup.remove(t);
            }
        });
        this.particles = [];
        this.trails = [];
        this.trailGeometries = [];
        this.time = 0;
    }

    /**
     * 洛伦兹方程迭代
     */
    lorenzStep(x, y, z) {
        const { sigma, rho, beta, dt } = this.params;

        const dx = sigma * (y - x) * dt;
        const dy = (x * (rho - z) - y) * dt;
        const dz = (x * y - beta * z) * dt;

        return {
            x: x + dx,
            y: y + dy,
            z: z + dz
        };
    }

    /**
     * 设置UI控制按钮
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-toggle-play">
                <i class="fas fa-pause"></i> 暂停
            </button>
            <button class="control-btn" id="btn-add-particle">
                <i class="fas fa-plus"></i> 添加对比粒子
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重新开始
            </button>
            <button class="control-btn" id="btn-params">
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
        document.getElementById('btn-toggle-play').onclick = () => this.togglePlay();
        document.getElementById('btn-add-particle').onclick = () => this.addSecondParticle();
        document.getElementById('btn-reset').onclick = () => this.reset();
        document.getElementById('btn-params').onclick = () => this.showParamsPanel();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    /**
     * 切换播放/暂停
     */
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-toggle-play');
        btn.innerHTML = this.isPlaying
            ? '<i class="fas fa-pause"></i> 暂停'
            : '<i class="fas fa-play"></i> 继续';
    }

    /**
     * 添加第二个粒子（用于对比蝴蝶效应）
     */
    addSecondParticle() {
        if (this.showSecondParticle) {
            this.showGuide('⚠️ 已经添加了对比粒子');
            return;
        }

        this.showSecondParticle = true;
        this.initParticles();  // 重新初始化两个粒子

        this.showGuide('🦋 红色粒子初始位置仅差0.0001！观察轨迹如何分离');

        const btn = document.getElementById('btn-add-particle');
        btn.innerHTML = '<i class="fas fa-check"></i> 已添加对比';
        btn.disabled = true;
        btn.style.opacity = 0.5;
    }

    /**
     * 重置
     */
    reset() {
        this.showSecondParticle = false;
        this.isPlaying = true;
        this.initParticles();

        const btn = document.getElementById('btn-add-particle');
        btn.innerHTML = '<i class="fas fa-plus"></i> 添加对比粒子';
        btn.disabled = false;
        btn.style.opacity = 1;

        const playBtn = document.getElementById('btn-toggle-play');
        playBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';

        this.showGuide('🔄 已重置，点击"添加对比粒子"体验蝴蝶效应');
    }

    /**
     * 显示参数调节面板
     */
    showParamsPanel() {
        // 创建参数面板
        let panel = document.getElementById('params-panel');
        if (panel) {
            panel.remove();
            return;
        }

        panel = document.createElement('div');
        panel.id = 'params-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(10, 10, 30, 0.95);
            border: 1px solid #4488ff;
            border-radius: 12px;
            padding: 24px;
            z-index: 1000;
            min-width: 320px;
            box-shadow: 0 0 30px rgba(68, 136, 255, 0.3);
        `;

        panel.innerHTML = `
            <h3 style="color: #00ffff; margin-bottom: 20px; font-size: 18px;">
                <i class="fas fa-sliders-h"></i> 洛伦兹方程参数
            </h3>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    σ (普朗特数): <span id="sigma-val">${this.params.sigma}</span>
                </label>
                <input type="range" id="param-sigma" min="1" max="20" step="0.5" 
                    value="${this.params.sigma}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    ρ (瑞利数): <span id="rho-val">${this.params.rho}</span>
                </label>
                <input type="range" id="param-rho" min="1" max="50" step="0.5"
                    value="${this.params.rho}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    β (几何因子): <span id="beta-val">${this.params.beta.toFixed(2)}</span>
                </label>
                <input type="range" id="param-beta" min="0.5" max="5" step="0.1"
                    value="${this.params.beta}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    模拟速度: <span id="speed-val">${this.params.speed}x</span>
                </label>
                <input type="range" id="param-speed" min="0.5" max="5" step="0.5"
                    value="${this.params.speed}" style="width: 100%;">
            </div>
            
            <div style="display: flex; gap: 10px; margin-top: 20px;">
                <button id="params-classic" style="flex: 1; padding: 8px; background: #2a4a7a; border: none; 
                    color: #fff; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-star"></i> 经典参数
                </button>
                <button id="params-close" style="flex: 1; padding: 8px; background: #4488ff; border: none;
                    color: #fff; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-check"></i> 关闭
                </button>
            </div>
            
            <p style="color: #666; font-size: 12px; margin-top: 15px; text-align: center;">
                经典参数：σ=10, ρ=28, β=8/3
            </p>
        `;

        document.body.appendChild(panel);

        // 绑定事件
        document.getElementById('param-sigma').oninput = (e) => {
            this.params.sigma = parseFloat(e.target.value);
            document.getElementById('sigma-val').textContent = this.params.sigma;
        };
        document.getElementById('param-rho').oninput = (e) => {
            this.params.rho = parseFloat(e.target.value);
            document.getElementById('rho-val').textContent = this.params.rho;
        };
        document.getElementById('param-beta').oninput = (e) => {
            this.params.beta = parseFloat(e.target.value);
            document.getElementById('beta-val').textContent = this.params.beta.toFixed(2);
        };
        document.getElementById('param-speed').oninput = (e) => {
            this.params.speed = parseFloat(e.target.value);
            document.getElementById('speed-val').textContent = this.params.speed + 'x';
        };
        document.getElementById('params-classic').onclick = () => {
            this.params.sigma = 10;
            this.params.rho = 28;
            this.params.beta = 8 / 3;
            document.getElementById('param-sigma').value = 10;
            document.getElementById('param-rho').value = 28;
            document.getElementById('param-beta').value = 8 / 3;
            document.getElementById('sigma-val').textContent = 10;
            document.getElementById('rho-val').textContent = 28;
            document.getElementById('beta-val').textContent = (8 / 3).toFixed(2);
            this.showGuide('✨ 已恢复经典参数');
        };
        document.getElementById('params-close').onclick = () => {
            panel.remove();
        };
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

        // 移除旧消息
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
            background: rgba(0, 255, 255, 0.15);
            border: 1px solid rgba(0, 255, 255, 0.3);
            padding: 12px 24px;
            border-radius: 8px;
            color: #00ffff;
            font-size: 14px;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        container.appendChild(guide);

        setTimeout(() => guide.style.opacity = '1', 100);
        setTimeout(() => {
            guide.style.opacity = '0';
            setTimeout(() => guide.remove(), 300);
        }, 3500);
    }

    /**
     * 初始引导
     */
    showInitialGuide() {
        setTimeout(() => {
            this.showGuide('🦋 洛伦兹吸引子：混沌理论的起源');
        }, 1000);
        setTimeout(() => {
            this.showGuide('💡 点击"添加对比粒子"体验蝴蝶效应！');
        }, 5000);
    }

    /**
     * 更新距离显示
     */
    updateDistanceDisplay() {
        if (!this.showSecondParticle || this.particles.length < 2) return;

        const p1 = this.particles[0];
        const p2 = this.particles[1];

        if (!p1 || !p2) return;

        const dx = p1.x - p2.x;
        const dy = p1.y - p2.y;
        const dz = p1.z - p2.z;
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

        // 更新信息面板
        let distPanel = document.getElementById('distance-panel');
        if (!distPanel) {
            distPanel = document.createElement('div');
            distPanel.id = 'distance-panel';
            distPanel.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(10, 10, 30, 0.9);
                border: 1px solid #ff6b6b;
                border-radius: 8px;
                padding: 16px;
                color: #fff;
                font-size: 14px;
                z-index: 100;
            `;
            document.getElementById('scene-canvas-container')?.appendChild(distPanel);
        }

        const diverged = distance > 10;
        distPanel.innerHTML = `
            <div style="color: #aaa; margin-bottom: 8px;">
                <i class="fas fa-ruler"></i> 两粒子距离差
            </div>
            <div style="font-size: 24px; color: ${diverged ? '#ff6b6b' : '#00ffff'};">
                ${distance.toFixed(4)}
            </div>
            <div style="color: #666; font-size: 12px; margin-top: 8px;">
                初始差距：0.0001
            </div>
            ${diverged ? '<div style="color: #ff6b6b; margin-top: 8px;">⚠️ 轨迹已完全分离！</div>' : ''}
        `;
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        if (!this.isPlaying) return;

        // 迭代多步
        const steps = Math.floor(this.params.speed * 3);

        for (let s = 0; s < steps; s++) {
            this.particles.forEach((particle, index) => {
                if (!particle) return;

                // 洛伦兹迭代
                const next = this.lorenzStep(particle.x, particle.y, particle.z);
                particle.x = next.x;
                particle.y = next.y;
                particle.z = next.z;

                // 更新粒子位置（注意坐标变换：y->z, z->y 便于观看）
                particle.mesh.position.set(next.x, next.z, next.y);

                // 添加到轨迹
                particle.trail.push({ x: next.x, y: next.z, z: next.y });
                if (particle.trail.length > this.params.trailLength) {
                    particle.trail.shift();
                }

                // 更新轨迹几何体
                this.updateTrail(index);
            });
        }

        // 更新距离显示
        if (this.showSecondParticle) {
            this.updateDistanceDisplay();
        }

        // 星空微微旋转
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
        }

        this.time += delta || 0.016;
    }

    /**
     * 更新轨迹
     */
    updateTrail(index) {
        const particle = this.particles[index];
        const geometry = this.trailGeometries[index];

        if (!particle || !geometry) return;

        const positions = geometry.attributes.position.array;
        const colors = geometry.attributes.color.array;
        const trail = particle.trail;

        for (let i = 0; i < this.params.trailLength; i++) {
            if (i < trail.length) {
                const point = trail[i];
                positions[i * 3] = point.x;
                positions[i * 3 + 1] = point.y;
                positions[i * 3 + 2] = point.z;

                // 渐变颜色
                const t = i / trail.length;
                const color = new THREE.Color().lerpColors(
                    particle.startColor,
                    particle.endColor,
                    t
                );
                colors[i * 3] = color.r;
                colors[i * 3 + 1] = color.g;
                colors[i * 3 + 2] = color.b;
            } else {
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
            }
        }

        geometry.attributes.position.needsUpdate = true;
        geometry.attributes.color.needsUpdate = true;
        geometry.setDrawRange(0, trail.length);
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
        this.clearParticles();
        
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
        }
        if (this.stars) {
            this.scene.remove(this.stars);
        }

        // 移除UI元素
        const distPanel = document.getElementById('distance-panel');
        if (distPanel) distPanel.remove();

        const paramsPanel = document.getElementById('params-panel');
        if (paramsPanel) paramsPanel.remove();
    }

    /**
     * 背景点击处理
     */
    onBackgroundClick() {
        // 关闭参数面板
        const paramsPanel = document.getElementById('params-panel');
        if (paramsPanel) paramsPanel.remove();
    }
};
