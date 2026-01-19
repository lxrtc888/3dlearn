/**
 * 三体问题场景 - Three-Body Problem Visualization
 * ============================================
 * "三个天体的引力舞蹈，混沌的起源"
 * 
 * 核心概念：
 * 1. 牛顿万有引力定律: F = G·m₁·m₂/r²
 * 2. 三体问题无解析解（庞加莱证明）
 * 3. 混沌系统：初始条件微小差异 → 结果巨大不同
 * 4. 《三体》小说背景：三颗恒星的世界
 * 
 * 可视化内容：
 * - 三个恒星的3D模型（发光球体）
 * - 实时轨迹绘制
 * - 引力线可视化
 * - 混沌轨迹演示
 * - 多种初始配置
 * ============================================
 */
window.ThreeBodyScene = class ThreeBodyScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 天体
        this.bodies = [];
        this.bodyMeshes = [];
        this.trails = [];
        this.trailPoints = [];
        this.gravityLines = [];

        // 物理参数
        this.params = {
            G: 1,                        // 引力常数（归一化）
            dt: 0.002,                   // 时间步长
            speed: 1,                    // 动画速度
            trailLength: 500,            // 轨迹长度
            showTrails: true,            // 显示轨迹
            showGravity: true,           // 显示引力
            preset: 'figure8',           // 预设配置
            chaos: false                 // 混沌模式
        };

        // 预设配置
        this.presets = {
            'figure8': {
                name: '8字轨道（稳定）',
                description: '三体问题的一个周期解，三个天体沿8字形轨道运动',
                bodies: [
                    { mass: 1, pos: [-0.97, 0, 0], vel: [0, 0.466, 0], color: 0xff6b6b },
                    { mass: 1, pos: [0.97, 0, 0], vel: [0, 0.466, 0], color: 0x4ecdc4 },
                    { mass: 1, pos: [0, 0, 0], vel: [0, -0.932, 0], color: 0xffd93d }
                ]
            },
            'lagrange': {
                name: '拉格朗日三角形',
                description: '三个天体形成等边三角形，绕公共质心旋转',
                bodies: [
                    { mass: 1, pos: [0, 2, 0], vel: [0.5, 0, 0], color: 0xff6b6b },
                    { mass: 1, pos: [-1.732, -1, 0], vel: [-0.25, 0.433, 0], color: 0x4ecdc4 },
                    { mass: 1, pos: [1.732, -1, 0], vel: [-0.25, -0.433, 0], color: 0xffd93d }
                ]
            },
            'chaos': {
                name: '混沌轨道',
                description: '不稳定配置，展示混沌行为 - 微小扰动导致完全不同的轨迹',
                bodies: [
                    { mass: 1.2, pos: [-2, 0, 0], vel: [0, 0.4, 0.1], color: 0xff6b6b },
                    { mass: 0.8, pos: [2, 0, 0], vel: [0, -0.3, -0.1], color: 0x4ecdc4 },
                    { mass: 1, pos: [0, 1.5, 0.5], vel: [0.2, 0, 0], color: 0xffd93d }
                ]
            },
            'binary': {
                name: '双星+扰动者',
                description: '两颗恒星稳定运转，第三颗闯入打破平衡',
                bodies: [
                    { mass: 1, pos: [-1, 0, 0], vel: [0, 0.6, 0], color: 0xff6b6b },
                    { mass: 1, pos: [1, 0, 0], vel: [0, -0.6, 0], color: 0x4ecdc4 },
                    { mass: 0.5, pos: [4, 2, 1], vel: [-0.3, 0, 0], color: 0xffd93d }
                ]
            },
            'trisolaris': {
                name: '三体星系（《三体》）',
                description: '模拟小说中的三体世界 - 恒纪元与乱纪元交替',
                bodies: [
                    { mass: 1.5, pos: [-2, 0, 0], vel: [0, 0.35, 0.05], color: 0xff4444 },
                    { mass: 1.2, pos: [2, 1, 0], vel: [-0.2, -0.3, 0], color: 0xff8800 },
                    { mass: 1, pos: [0, -2, 0.5], vel: [0.3, 0.2, -0.05], color: 0xffcc00 }
                ]
            }
        };

        // 颜色主题
        this.colors = {
            background: 0x000510,
            trail: [0xff6b6b, 0x4ecdc4, 0xffd93d],
            gravity: 0x4a90d9,
            grid: 0x1a1a3a
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 15, z: 20 };
        
        this.isAutoPlaying = true;
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

        // 背景 - 深邃太空
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

        // 加载默认预设
        this.loadPreset(this.params.preset);
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.2);
        this.scene.add(ambient);

        // 每个天体的点光源将在创建天体时添加
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建星空背景
        this.createStarfield();

        // 创建参考网格
        this.createGrid();
    }

    /**
     * 创建星空背景
     */
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starColors = [];
        
        for (let i = 0; i < 2000; i++) {
            const radius = 50 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            starPositions.push(x, y, z);
            
            // 星星颜色
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                starColors.push(1, 1, 1); // 白色
            } else if (colorChoice < 0.85) {
                starColors.push(1, 0.9, 0.7); // 黄白色
            } else {
                starColors.push(0.7, 0.8, 1); // 蓝白色
            }
        }

        starsGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(starPositions, 3)
        );
        starsGeometry.setAttribute(
            'color',
            new THREE.Float32BufferAttribute(starColors, 3)
        );

        const starsMaterial = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.starfield = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.starfield);
    }

    /**
     * 创建参考网格
     */
    createGrid() {
        const gridGroup = new THREE.Group();
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: this.colors.grid, 
            transparent: true, 
            opacity: 0.2 
        });

        // 水平线
        for (let i = -10; i <= 10; i += 2) {
            const points = [
                new THREE.Vector3(-10, 0, i),
                new THREE.Vector3(10, 0, i)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            gridGroup.add(line);

            const points2 = [
                new THREE.Vector3(i, 0, -10),
                new THREE.Vector3(i, 0, 10)
            ];
            const geometry2 = new THREE.BufferGeometry().setFromPoints(points2);
            const line2 = new THREE.Line(geometry2, lineMaterial);
            gridGroup.add(line2);
        }

        gridGroup.position.y = -5;
        this.mainGroup.add(gridGroup);
    }

    /**
     * 加载预设配置
     */
    loadPreset(presetName) {
        const preset = this.presets[presetName];
        if (!preset) return;

        this.params.preset = presetName;

        // 清除现有天体
        this.clearBodies();

        // 创建新天体
        this.bodies = preset.bodies.map(b => ({
            mass: b.mass,
            position: new THREE.Vector3(...b.pos),
            velocity: new THREE.Vector3(...b.vel),
            color: b.color
        }));

        // 创建天体网格
        this.createBodies();

        // 清空轨迹
        this.trailPoints = this.bodies.map(() => []);

        // 显示预设说明
        this.showPresetInfo(preset);
    }

    /**
     * 清除天体
     */
    clearBodies() {
        // 移除网格
        this.bodyMeshes.forEach(mesh => {
            this.mainGroup.remove(mesh);
            mesh.traverse(child => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
        });
        this.bodyMeshes = [];

        // 移除轨迹
        this.trails.forEach(trail => {
            this.mainGroup.remove(trail);
            trail.geometry.dispose();
            trail.material.dispose();
        });
        this.trails = [];

        // 移除引力线
        this.gravityLines.forEach(line => {
            this.mainGroup.remove(line);
            line.geometry.dispose();
            line.material.dispose();
        });
        this.gravityLines = [];

        // 移除光源
        this.bodyLights?.forEach(light => {
            this.scene.remove(light);
        });
        this.bodyLights = [];
    }

    /**
     * 创建天体
     */
    createBodies() {
        this.bodyMeshes = [];
        this.trails = [];
        this.bodyLights = [];

        this.bodies.forEach((body, index) => {
            // 恒星球体
            const starGroup = new THREE.Group();
            
            // 核心球体
            const coreGeometry = new THREE.SphereGeometry(0.3 * Math.pow(body.mass, 0.3), 32, 32);
            const coreMaterial = new THREE.MeshBasicMaterial({
                color: body.color
            });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            starGroup.add(core);

            // 光晕层1
            const glow1Geometry = new THREE.SphereGeometry(0.45 * Math.pow(body.mass, 0.3), 32, 32);
            const glow1Material = new THREE.MeshBasicMaterial({
                color: body.color,
                transparent: true,
                opacity: 0.4
            });
            const glow1 = new THREE.Mesh(glow1Geometry, glow1Material);
            starGroup.add(glow1);

            // 光晕层2
            const glow2Geometry = new THREE.SphereGeometry(0.6 * Math.pow(body.mass, 0.3), 32, 32);
            const glow2Material = new THREE.MeshBasicMaterial({
                color: body.color,
                transparent: true,
                opacity: 0.2
            });
            const glow2 = new THREE.Mesh(glow2Geometry, glow2Material);
            starGroup.add(glow2);

            // 日冕效果（粒子）
            const coronaGeometry = new THREE.BufferGeometry();
            const coronaPositions = [];
            for (let i = 0; i < 50; i++) {
                const r = 0.5 + Math.random() * 0.3;
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                coronaPositions.push(
                    r * Math.sin(phi) * Math.cos(theta),
                    r * Math.sin(phi) * Math.sin(theta),
                    r * Math.cos(phi)
                );
            }
            coronaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(coronaPositions, 3));
            const coronaMaterial = new THREE.PointsMaterial({
                color: body.color,
                size: 0.05,
                transparent: true,
                opacity: 0.6
            });
            const corona = new THREE.Points(coronaGeometry, coronaMaterial);
            starGroup.add(corona);

            starGroup.position.copy(body.position);
            starGroup.userData = { index, body, core, glow1, glow2, corona };
            
            this.bodyMeshes.push(starGroup);
            this.mainGroup.add(starGroup);

            // 点光源
            const light = new THREE.PointLight(body.color, 2, 20);
            light.position.copy(body.position);
            this.bodyLights.push(light);
            this.scene.add(light);

            // 轨迹线
            const trailGeometry = new THREE.BufferGeometry();
            const trailMaterial = new THREE.LineBasicMaterial({
                color: body.color,
                transparent: true,
                opacity: 0.6
            });
            const trail = new THREE.Line(trailGeometry, trailMaterial);
            this.trails.push(trail);
            this.mainGroup.add(trail);
        });

        // 创建引力线
        this.createGravityLines();
    }

    /**
     * 创建引力线
     */
    createGravityLines() {
        // 3个天体之间有3条引力线
        const pairs = [[0, 1], [1, 2], [0, 2]];
        
        pairs.forEach(() => {
            const geometry = new THREE.BufferGeometry();
            const material = new THREE.LineBasicMaterial({
                color: this.colors.gravity,
                transparent: true,
                opacity: 0.3
            });
            const line = new THREE.Line(geometry, material);
            this.gravityLines.push(line);
            this.mainGroup.add(line);
        });
    }

    /**
     * 显示预设信息
     */
    showPresetInfo(preset) {
        const panel = document.getElementById('info-panel');
        if (panel) {
            panel.innerHTML = `
                <div style="padding: 15px;">
                    <h3 style="color: #ffd93d; margin-bottom: 10px;">
                        <i class="fas fa-sun"></i> ${preset.name}
                    </h3>
                    <p style="color: #aaa; font-size: 13px; line-height: 1.6;">
                        ${preset.description}
                    </p>
                    <div style="margin: 15px 0; padding: 10px; background: rgba(255,217,61,0.1); border-radius: 8px;">
                        <p style="color: #ffd93d; font-size: 12px;">
                            🌟 三体问题：三个天体的引力相互作用<br>
                            📐 无解析解：只能数值模拟<br>
                            🌀 混沌特性：初始条件微小变化 → 结果完全不同
                        </p>
                    </div>
                    <p style="color: #888; font-size: 12px;">
                        💡 点击不同预设，观察轨道的差异
                    </p>
                </div>
            `;
        }
    }

    /**
     * 设置UI
     */
    setupUI() {
        // 底部操作按钮
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'flex';
            controlsDiv.innerHTML = `
                <button class="control-btn" id="btn-figure8">
                    <i class="fas fa-infinity"></i> 8字轨道
                </button>
                <button class="control-btn" id="btn-lagrange">
                    <i class="fas fa-shapes"></i> 拉格朗日
                </button>
                <button class="control-btn" id="btn-chaos">
                    <i class="fas fa-random"></i> 混沌轨道
                </button>
                <button class="control-btn" id="btn-trisolaris">
                    <i class="fas fa-star"></i> 三体星系
                </button>
                <button class="control-btn" id="btn-perturb">
                    <i class="fas fa-bolt"></i> 微小扰动
                </button>
                <button class="control-btn active" id="btn-play">
                    <i class="fas fa-pause"></i> 暂停
                </button>
                <button class="control-btn" id="btn-reset">
                    <i class="fas fa-redo"></i> 重置
                </button>
                <button class="control-btn" id="btn-reset-view">
                    <i class="fas fa-video"></i> 重置视角
                </button>
            `;

            // 底部按钮事件
            document.getElementById('btn-figure8')?.addEventListener('click', () => this.loadPreset('figure8'));
            document.getElementById('btn-lagrange')?.addEventListener('click', () => this.loadPreset('lagrange'));
            document.getElementById('btn-chaos')?.addEventListener('click', () => this.loadPreset('chaos'));
            document.getElementById('btn-trisolaris')?.addEventListener('click', () => this.loadPreset('trisolaris'));
            document.getElementById('btn-perturb')?.addEventListener('click', () => this.applyPerturbation());
            document.getElementById('btn-play')?.addEventListener('click', () => {
                this.isAutoPlaying = !this.isAutoPlaying;
                const btn = document.getElementById('btn-play');
                btn.innerHTML = this.isAutoPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 播放';
            });
            document.getElementById('btn-reset')?.addEventListener('click', () => {
                this.loadPreset(this.params.preset);
                this.isAutoPlaying = true;
                document.getElementById('btn-play').innerHTML = '<i class="fas fa-pause"></i> 暂停';
            });
            document.getElementById('btn-reset-view')?.addEventListener('click', () => this.resetCamera());
        }

        const panel = document.getElementById('control-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="control-section">
                <h4><i class="fas fa-sun"></i> 轨道预设</h4>
                <div class="preset-buttons">
                    <button class="preset-btn active" data-preset="figure8">
                        <i class="fas fa-infinity"></i> 8字轨道
                    </button>
                    <button class="preset-btn" data-preset="lagrange">
                        <i class="fas fa-shapes"></i> 拉格朗日
                    </button>
                    <button class="preset-btn" data-preset="chaos">
                        <i class="fas fa-random"></i> 混沌轨道
                    </button>
                    <button class="preset-btn" data-preset="binary">
                        <i class="fas fa-adjust"></i> 双星系统
                    </button>
                    <button class="preset-btn" data-preset="trisolaris">
                        <i class="fas fa-star"></i> 三体星系
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-tachometer-alt"></i> 模拟速度: <span id="speed-value">1.0x</span></h4>
                <input type="range" id="speed-slider" 
                       min="0.1" max="3" step="0.1"
                       value="${this.params.speed}" 
                       class="styled-slider">
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-toggle-on"></i> 显示选项</h4>
                <div class="toggle-options">
                    <label class="toggle-label">
                        <input type="checkbox" id="toggle-trails" checked>
                        <span>显示轨迹</span>
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" id="toggle-gravity" checked>
                        <span>显示引力线</span>
                    </label>
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-flask"></i> 混沌实验</h4>
                <button id="btn-perturb" class="control-btn chaos">
                    <i class="fas fa-bolt"></i> 微小扰动
                </button>
                <p style="font-size: 11px; color: #888; margin-top: 8px;">
                    对其中一个天体施加极小扰动，观察蝴蝶效应
                </p>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-play-circle"></i> 控制</h4>
                <div class="control-buttons">
                    <button id="btn-play" class="control-btn primary">
                        <i class="fas fa-pause"></i> 暂停
                    </button>
                    <button id="btn-reset" class="control-btn">
                        <i class="fas fa-redo"></i> 重置
                    </button>
                </div>
            </div>
            
            <style>
                .preset-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .preset-btn {
                    padding: 10px 12px;
                    border: 2px solid #ffd93d;
                    background: rgba(255, 217, 61, 0.1);
                    color: #ffd93d;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 12px;
                    text-align: left;
                }
                .preset-btn:hover {
                    background: rgba(255, 217, 61, 0.3);
                    transform: translateX(5px);
                }
                .preset-btn.active {
                    background: rgba(255, 217, 61, 0.4);
                    box-shadow: 0 0 15px rgba(255, 217, 61, 0.3);
                }
                .styled-slider {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(to right, #ff6b6b, #ffd93d);
                    outline: none;
                    -webkit-appearance: none;
                }
                .styled-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                }
                .toggle-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 13px;
                }
                .toggle-label input {
                    width: 18px;
                    height: 18px;
                    accent-color: #ffd93d;
                }
                .control-buttons {
                    display: flex;
                    gap: 10px;
                }
                .control-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.1);
                    color: #ffffff;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 13px;
                }
                .control-btn:hover {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }
                .control-btn.primary {
                    background: linear-gradient(135deg, #ff6b6b, #ffd93d);
                }
                .control-btn.chaos {
                    background: linear-gradient(135deg, #a855f7, #ff6b9d);
                    width: 100%;
                }
            </style>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 预设按钮
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const preset = btn.dataset.preset;
                this.loadPreset(preset);
                
                // 更新按钮状态
                document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // 速度滑块
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.params.speed = parseFloat(e.target.value);
                document.getElementById('speed-value').textContent = this.params.speed.toFixed(1) + 'x';
            });
        }

        // 显示选项
        const toggleTrails = document.getElementById('toggle-trails');
        if (toggleTrails) {
            toggleTrails.addEventListener('change', (e) => {
                this.params.showTrails = e.target.checked;
                this.trails.forEach(trail => trail.visible = e.target.checked);
            });
        }

        const toggleGravity = document.getElementById('toggle-gravity');
        if (toggleGravity) {
            toggleGravity.addEventListener('change', (e) => {
                this.params.showGravity = e.target.checked;
                this.gravityLines.forEach(line => line.visible = e.target.checked);
            });
        }

        // 扰动按钮
        const perturbBtn = document.getElementById('btn-perturb');
        if (perturbBtn) {
            perturbBtn.addEventListener('click', () => {
                this.applyPerturbation();
            });
        }

        // 播放/暂停
        const playBtn = document.getElementById('btn-play');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.isAutoPlaying = !this.isAutoPlaying;
                playBtn.innerHTML = this.isAutoPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 播放';
            });
        }

        // 重置
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.loadPreset(this.params.preset);
                this.isAutoPlaying = true;
                const playBtn = document.getElementById('btn-play');
                if (playBtn) {
                    playBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
                }
            });
        }
    }

    /**
     * 施加微小扰动
     */
    applyPerturbation() {
        if (this.bodies.length > 0) {
            // 随机选择一个天体
            const index = Math.floor(Math.random() * this.bodies.length);
            const body = this.bodies[index];
            
            // 施加极小的速度扰动
            const perturbation = 0.001;
            body.velocity.x += (Math.random() - 0.5) * perturbation;
            body.velocity.y += (Math.random() - 0.5) * perturbation;
            body.velocity.z += (Math.random() - 0.5) * perturbation;

            this.showToast(`🦋 对天体${index + 1}施加了微小扰动（蝴蝶效应）`);
        }
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'three-body-toast';
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(255, 107, 107, 0.9), rgba(255, 217, 61, 0.9));
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        if (panel) {
            panel.innerHTML = `
                <div style="padding: 15px;">
                    <h3 style="color: #ffd93d; margin-bottom: 10px;">
                        <i class="fas fa-sun"></i> 三体问题
                    </h3>
                    <p style="color: #aaa; font-size: 13px; line-height: 1.6;">
                        <strong style="color: #ff6b6b;">经典力学的终极难题：</strong><br>
                        三个天体在万有引力作用下的运动<br>
                        <strong>无法</strong>用公式精确求解！
                    </p>
                    <div style="margin: 15px 0; padding: 10px; background: rgba(255,107,107,0.1); border-radius: 8px;">
                        <p style="color: #ff6b6b; font-size: 12px;">
                            🔬 1889年，庞加莱证明三体问题无解析解<br>
                            🦋 微小扰动 → 完全不同的结果（混沌）<br>
                            📚 刘慈欣《三体》的科学背景
                        </p>
                    </div>
                </div>
            `;
        }
    }

    /**
     * 物理模拟 - 计算引力和更新位置
     */
    updatePhysics() {
        if (this.bodies.length < 3) return;

        const dt = this.params.dt * this.params.speed;
        const G = this.params.G;

        // 计算每个天体受到的引力加速度
        const accelerations = this.bodies.map(() => new THREE.Vector3());

        for (let i = 0; i < this.bodies.length; i++) {
            for (let j = 0; j < this.bodies.length; j++) {
                if (i === j) continue;

                const bi = this.bodies[i];
                const bj = this.bodies[j];

                // 从i指向j的向量
                const r = new THREE.Vector3().subVectors(bj.position, bi.position);
                const distance = r.length();
                
                if (distance < 0.1) continue; // 避免除以零

                // 引力加速度 a = G * m_j / r²，方向指向j
                const magnitude = G * bj.mass / (distance * distance);
                const acceleration = r.normalize().multiplyScalar(magnitude);
                
                accelerations[i].add(acceleration);
            }
        }

        // 更新速度和位置（Velocity Verlet积分）
        for (let i = 0; i < this.bodies.length; i++) {
            const body = this.bodies[i];
            
            // 更新速度
            body.velocity.add(accelerations[i].multiplyScalar(dt));
            
            // 更新位置
            body.position.add(body.velocity.clone().multiplyScalar(dt));
        }
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        if (!this.isAutoPlaying) return;

        // 物理模拟
        this.updatePhysics();

        // 更新天体位置
        this.bodies.forEach((body, index) => {
            if (this.bodyMeshes[index]) {
                this.bodyMeshes[index].position.copy(body.position);
            }
            if (this.bodyLights[index]) {
                this.bodyLights[index].position.copy(body.position);
            }

            // 恒星脉动效果
            const mesh = this.bodyMeshes[index];
            if (mesh && mesh.userData.glow1) {
                const pulse = 1 + Math.sin(time * 0.003 + index) * 0.1;
                mesh.userData.glow1.scale.set(pulse, pulse, pulse);
                mesh.userData.glow2.scale.set(pulse * 1.1, pulse * 1.1, pulse * 1.1);
            }

            // 日冕旋转
            if (mesh && mesh.userData.corona) {
                mesh.userData.corona.rotation.y += 0.01;
                mesh.userData.corona.rotation.x += 0.005;
            }
        });

        // 更新轨迹
        if (this.params.showTrails) {
            this.updateTrails();
        }

        // 更新引力线
        if (this.params.showGravity) {
            this.updateGravityLines();
        }

        // 星空微动
        if (this.starfield) {
            this.starfield.rotation.y += 0.0001;
        }
    }

    /**
     * 更新轨迹
     */
    updateTrails() {
        this.bodies.forEach((body, index) => {
            // 添加新点
            this.trailPoints[index].push(body.position.clone());
            
            // 限制轨迹长度
            if (this.trailPoints[index].length > this.params.trailLength) {
                this.trailPoints[index].shift();
            }

            // 更新轨迹线
            if (this.trails[index] && this.trailPoints[index].length > 1) {
                const positions = [];
                this.trailPoints[index].forEach(p => {
                    positions.push(p.x, p.y, p.z);
                });
                
                this.trails[index].geometry.setAttribute(
                    'position',
                    new THREE.Float32BufferAttribute(positions, 3)
                );
                this.trails[index].geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    /**
     * 更新引力线
     */
    updateGravityLines() {
        const pairs = [[0, 1], [1, 2], [0, 2]];
        
        pairs.forEach((pair, index) => {
            if (this.bodies[pair[0]] && this.bodies[pair[1]] && this.gravityLines[index]) {
                const p1 = this.bodies[pair[0]].position;
                const p2 = this.bodies[pair[1]].position;
                
                const positions = new Float32Array([
                    p1.x, p1.y, p1.z,
                    p2.x, p2.y, p2.z
                ]);
                
                this.gravityLines[index].geometry.setAttribute(
                    'position',
                    new THREE.BufferAttribute(positions, 3)
                );
                this.gravityLines[index].geometry.attributes.position.needsUpdate = true;

                // 根据距离调整透明度
                const distance = p1.distanceTo(p2);
                this.gravityLines[index].material.opacity = Math.min(0.5, 2 / distance);
            }
        });
    }

    /**
     * 鼠标移动处理
     */
    onMouseMove(event) {
        // 可扩展
    }

    /**
     * 点击处理
     */
    onClick(event) {
        // 可扩展
    }

    /**
     * 重置相机
     */
    resetCamera() {
        this.camera.position.set(
            this.defaultCameraPos.x,
            this.defaultCameraPos.y,
            this.defaultCameraPos.z
        );
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 销毁场景
     */
    dispose() {
        this.clearBodies();

        if (this.mainGroup) {
            this.mainGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(this.mainGroup);
        }

        if (this.starfield) {
            this.starfield.geometry.dispose();
            this.starfield.material.dispose();
            this.scene.remove(this.starfield);
        }

        // 添加动画样式
        if (!document.querySelector('#three-body-animations')) {
            const animStyle = document.createElement('style');
            animStyle.id = 'three-body-animations';
            animStyle.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -20px); }
                    20% { opacity: 1; transform: translate(-50%, 0); }
                    80% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -20px); }
                }
            `;
            document.head.appendChild(animStyle);
        }
    }
};
