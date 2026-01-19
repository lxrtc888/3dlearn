/**
 * 二向箔/降维打击场景 - Dimensional Strike Visualization
 * ============================================
 * "来自《三体》的终极武器"
 * 
 * 核心概念：
 * 1. 维度概念：点(0D)→线(1D)→面(2D)→体(3D)
 * 2. 降维打击：高维物体被压缩到低维空间
 * 3. 《三体》设定：二向箔将3D空间坍缩为2D
 * 4. 信息保留：3D结构被"画"在2D平面上
 * 
 * 可视化内容：
 * - 3D太阳系/星球/物体
 * - 二向箔展开动画
 * - 降维过程：3D逐渐压扁成2D
 * - 最终形成2D"画"
 * ============================================
 */
window.DimensionalStrikeScene = class DimensionalStrikeScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.solarSystem = null;
        this.planets = [];
        this.foil = null;
        this.flattenedObjects = [];

        // 参数
        this.params = {
            phase: 'normal',              // normal, deploying, flattening, complete
            flattenProgress: 0,           // 压扁进度 0-1
            foilExpanded: false,
            animationSpeed: 0.5,
            selectedTarget: 'solar',      // solar, earth, city
            showInfo: true
        };

        // 颜色
        this.colors = {
            background: 0x000510,
            sun: 0xffdd44,
            earth: 0x4a90d9,
            mars: 0xff6b6b,
            jupiter: 0xffa500,
            foil: 0x00ffff,
            foilGlow: 0x00ffff,
            grid: 0x1a1a3a
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 15, z: 30 };
        
        this.isAutoPlaying = true;
        this.animationTime = 0;
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
        this.scene.fog = new THREE.FogExp2(this.colors.background, 0.005);

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
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        // 太阳光源
        this.sunLight = new THREE.PointLight(0xffdd44, 2, 100);
        this.sunLight.position.set(0, 0, 0);
        this.scene.add(this.sunLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建星空背景
        this.createStarfield();

        // 创建太阳系
        this.createSolarSystem();

        // 创建二向箔
        this.createFoil();

        // 创建2D平面（降维后）
        this.createFlatPlane();
    }

    /**
     * 创建星空背景
     */
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        const starColors = [];
        
        for (let i = 0; i < 3000; i++) {
            const radius = 80 + Math.random() * 120;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            starPositions.push(x, y, z);
            
            // 星星颜色
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                starColors.push(1, 1, 1);
            } else if (colorChoice < 0.85) {
                starColors.push(1, 0.9, 0.7);
            } else {
                starColors.push(0.7, 0.8, 1);
            }
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
        starsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(starColors, 3));

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
     * 创建太阳系
     */
    createSolarSystem() {
        this.solarSystem = new THREE.Group();
        this.mainGroup.add(this.solarSystem);
        this.planets = [];

        // 太阳
        const sunGeometry = new THREE.SphereGeometry(3, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.sun
        });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        
        // 太阳光晕
        const sunGlow1 = new THREE.Mesh(
            new THREE.SphereGeometry(3.5, 32, 32),
            new THREE.MeshBasicMaterial({
                color: this.colors.sun,
                transparent: true,
                opacity: 0.3
            })
        );
        sun.add(sunGlow1);
        
        const sunGlow2 = new THREE.Mesh(
            new THREE.SphereGeometry(4.5, 32, 32),
            new THREE.MeshBasicMaterial({
                color: this.colors.sun,
                transparent: true,
                opacity: 0.1
            })
        );
        sun.add(sunGlow2);

        sun.userData = { 
            name: '太阳', 
            originalScale: 1,
            orbitRadius: 0, 
            orbitSpeed: 0,
            isSun: true
        };
        this.solarSystem.add(sun);
        this.planets.push(sun);

        // 行星配置
        const planetConfigs = [
            { name: '水星', radius: 0.4, orbit: 5, speed: 0.02, color: 0x888888 },
            { name: '金星', radius: 0.9, orbit: 7, speed: 0.015, color: 0xffcc66 },
            { name: '地球', radius: 1, orbit: 10, speed: 0.01, color: 0x4a90d9 },
            { name: '火星', radius: 0.5, orbit: 13, speed: 0.008, color: 0xff6b6b },
            { name: '木星', radius: 2, orbit: 18, speed: 0.004, color: 0xffa500 },
            { name: '土星', radius: 1.7, orbit: 24, speed: 0.003, color: 0xffd93d }
        ];

        planetConfigs.forEach((config, index) => {
            // 轨道环
            const orbitGeometry = new THREE.RingGeometry(config.orbit - 0.05, config.orbit + 0.05, 64);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: 0x333366,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.3
            });
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.x = Math.PI / 2;
            this.solarSystem.add(orbit);

            // 行星
            const planetGeometry = new THREE.SphereGeometry(config.radius, 32, 32);
            const planetMaterial = new THREE.MeshPhongMaterial({
                color: config.color,
                emissive: config.color,
                emissiveIntensity: 0.2
            });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            
            // 随机初始角度
            const angle = Math.random() * Math.PI * 2;
            planet.position.set(
                Math.cos(angle) * config.orbit,
                0,
                Math.sin(angle) * config.orbit
            );

            planet.userData = {
                name: config.name,
                originalScale: 1,
                orbitRadius: config.orbit,
                orbitSpeed: config.speed,
                currentAngle: angle,
                originalY: 0
            };

            // 土星环
            if (config.name === '土星') {
                const ringGeometry = new THREE.RingGeometry(2, 3.5, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffd93d,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.6
                });
                const ring = new THREE.Mesh(ringGeometry, ringMaterial);
                ring.rotation.x = Math.PI / 2.5;
                planet.add(ring);
            }

            this.solarSystem.add(planet);
            this.planets.push(planet);
        });
    }

    /**
     * 创建二向箔
     */
    createFoil() {
        this.foilGroup = new THREE.Group();
        this.foilGroup.position.set(40, 0, 0);
        this.foilGroup.visible = false;
        this.mainGroup.add(this.foilGroup);

        // 二向箔主体 - 极薄的发光片
        const foilGeometry = new THREE.PlaneGeometry(0.5, 0.5);
        const foilMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.foil,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        this.foil = new THREE.Mesh(foilGeometry, foilMaterial);
        this.foilGroup.add(this.foil);

        // 二向箔光晕
        const glowGeometry = new THREE.PlaneGeometry(1, 1);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.foilGlow,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.foilGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.foilGroup.add(this.foilGlow);

        // 边缘粒子效果
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        for (let i = 0; i < 100; i++) {
            particlePositions.push(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                0
            );
        }
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: this.colors.foil,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        this.foilParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.foilGroup.add(this.foilParticles);
    }

    /**
     * 创建扁平化平面
     */
    createFlatPlane() {
        this.flatPlane = new THREE.Group();
        this.flatPlane.position.set(0, -10, 0);
        this.flatPlane.visible = false;
        this.mainGroup.add(this.flatPlane);

        // 底部平面
        const planeGeometry = new THREE.PlaneGeometry(60, 60);
        const planeMaterial = new THREE.MeshBasicMaterial({
            color: 0x111133,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        this.flatPlane.add(plane);

        // 网格
        const gridHelper = new THREE.GridHelper(60, 30, 0x333366, 0x222244);
        gridHelper.material.opacity = 0.5;
        gridHelper.material.transparent = true;
        this.flatPlane.add(gridHelper);
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
                <button class="control-btn" id="btn-reset-scene">
                    <i class="fas fa-redo"></i> 重置场景
                </button>
                <button class="control-btn active" id="btn-deploy-foil">
                    <i class="fas fa-paper-plane"></i> 释放二向箔
                </button>
                <button class="control-btn" id="btn-flatten" disabled>
                    <i class="fas fa-compress-arrows-alt"></i> 开始降维
                </button>
                <button class="control-btn" id="btn-play">
                    <i class="fas fa-pause"></i> 暂停
                </button>
                <button class="control-btn" id="btn-reset-view">
                    <i class="fas fa-video"></i> 重置视角
                </button>
            `;

            // 底部按钮事件
            document.getElementById('btn-reset-scene')?.addEventListener('click', () => this.resetScene());
            document.getElementById('btn-deploy-foil')?.addEventListener('click', () => this.deployFoil());
            document.getElementById('btn-flatten')?.addEventListener('click', () => this.startFlattening());
            document.getElementById('btn-play')?.addEventListener('click', () => {
                this.isAutoPlaying = !this.isAutoPlaying;
                const btn = document.getElementById('btn-play');
                btn.innerHTML = this.isAutoPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 播放';
            });
            document.getElementById('btn-reset-view')?.addEventListener('click', () => this.resetCamera());
        }

        const panel = document.getElementById('control-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="control-section">
                <h4><i class="fas fa-compress-alt"></i> 降维演示</h4>
                <div class="phase-buttons">
                    <button id="btn-reset-scene" class="phase-btn">
                        <i class="fas fa-redo"></i> 重置场景
                    </button>
                    <button id="btn-deploy-foil" class="phase-btn highlight">
                        <i class="fas fa-paper-plane"></i> 释放二向箔
                    </button>
                    <button id="btn-flatten" class="phase-btn danger" disabled>
                        <i class="fas fa-compress-arrows-alt"></i> 开始降维
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-tachometer-alt"></i> 动画速度</h4>
                <input type="range" id="speed-slider" 
                       min="0.1" max="2" step="0.1"
                       value="${this.params.animationSpeed}" 
                       class="styled-slider">
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-info-circle"></i> 当前阶段</h4>
                <div id="phase-display" class="phase-display">
                    <div class="phase-icon"><i class="fas fa-globe"></i></div>
                    <div class="phase-text">正常三维空间</div>
                </div>
                <div id="progress-bar" class="progress-bar" style="display:none;">
                    <div class="progress-fill" style="width:0%"></div>
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-play-circle"></i> 控制</h4>
                <div class="control-buttons">
                    <button id="btn-play" class="control-btn primary">
                        <i class="fas fa-pause"></i> 暂停
                    </button>
                </div>
            </div>
            
            <style>
                .phase-buttons {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .phase-btn {
                    padding: 12px;
                    border: 2px solid #00ffff;
                    background: rgba(0, 255, 255, 0.1);
                    color: #00ffff;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 13px;
                }
                .phase-btn:hover:not(:disabled) {
                    background: rgba(0, 255, 255, 0.3);
                    transform: translateY(-2px);
                }
                .phase-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .phase-btn.highlight {
                    background: rgba(0, 255, 255, 0.2);
                    animation: pulse 2s infinite;
                }
                .phase-btn.danger {
                    border-color: #ff6b6b;
                    color: #ff6b6b;
                    background: rgba(255, 107, 107, 0.1);
                }
                .phase-btn.danger:hover:not(:disabled) {
                    background: rgba(255, 107, 107, 0.3);
                }
                @keyframes pulse {
                    0%, 100% { box-shadow: 0 0 10px rgba(0,255,255,0.3); }
                    50% { box-shadow: 0 0 20px rgba(0,255,255,0.6); }
                }
                .styled-slider {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(to right, #333, #00ffff);
                    outline: none;
                    -webkit-appearance: none;
                }
                .styled-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(0,255,255,0.5);
                }
                .phase-display {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 12px;
                    background: rgba(0, 255, 255, 0.1);
                    border-radius: 8px;
                    border-left: 3px solid #00ffff;
                }
                .phase-icon {
                    font-size: 24px;
                    color: #00ffff;
                }
                .phase-text {
                    font-size: 13px;
                    color: #ffffff;
                }
                .progress-bar {
                    height: 8px;
                    background: rgba(255,255,255,0.1);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 10px;
                }
                .progress-fill {
                    height: 100%;
                    background: linear-gradient(to right, #00ffff, #ff6b6b);
                    transition: width 0.3s;
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
                }
                .control-btn.primary {
                    background: linear-gradient(135deg, #00ffff, #a855f7);
                }
            </style>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 重置场景
        const resetBtn = document.getElementById('btn-reset-scene');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.resetScene();
            });
        }

        // 释放二向箔
        const deployBtn = document.getElementById('btn-deploy-foil');
        if (deployBtn) {
            deployBtn.addEventListener('click', () => {
                this.deployFoil();
            });
        }

        // 开始降维
        const flattenBtn = document.getElementById('btn-flatten');
        if (flattenBtn) {
            flattenBtn.addEventListener('click', () => {
                this.startFlattening();
            });
        }

        // 速度滑块
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.params.animationSpeed = parseFloat(e.target.value);
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
    }

    /**
     * 重置场景
     */
    resetScene() {
        this.params.phase = 'normal';
        this.params.flattenProgress = 0;
        this.params.foilExpanded = false;

        // 隐藏二向箔
        this.foilGroup.visible = false;
        this.foilGroup.position.set(40, 0, 0);

        // 隐藏平面
        this.flatPlane.visible = false;

        // 恢复行星
        this.planets.forEach(planet => {
            planet.scale.set(1, 1, 1);
            planet.position.y = 0;
            planet.material.opacity = 1;
            if (planet.userData.originalY !== undefined) {
                planet.position.y = planet.userData.originalY;
            }
        });

        // 更新UI
        this.updatePhaseDisplay('normal');
        document.getElementById('btn-deploy-foil').disabled = false;
        document.getElementById('btn-deploy-foil').classList.add('highlight');
        document.getElementById('btn-flatten').disabled = true;
        document.getElementById('progress-bar').style.display = 'none';

        this.showToast('场景已重置');
    }

    /**
     * 释放二向箔
     */
    deployFoil() {
        if (this.params.phase !== 'normal') return;

        this.params.phase = 'deploying';
        this.foilGroup.visible = true;
        
        // 更新UI
        this.updatePhaseDisplay('deploying');
        document.getElementById('btn-deploy-foil').disabled = true;
        document.getElementById('btn-deploy-foil').classList.remove('highlight');

        this.showToast('⚠️ 二向箔已释放！');
    }

    /**
     * 开始降维
     */
    startFlattening() {
        if (this.params.phase !== 'deployed') return;

        this.params.phase = 'flattening';
        this.flatPlane.visible = true;
        
        // 更新UI
        this.updatePhaseDisplay('flattening');
        document.getElementById('btn-flatten').disabled = true;
        document.getElementById('progress-bar').style.display = 'block';

        this.showToast('🌀 降维打击开始！三维空间正在坍缩...');
    }

    /**
     * 更新阶段显示
     */
    updatePhaseDisplay(phase) {
        const display = document.getElementById('phase-display');
        if (!display) return;

        const phases = {
            'normal': { icon: 'fa-globe', text: '正常三维空间', color: '#4ecdc4' },
            'deploying': { icon: 'fa-paper-plane', text: '二向箔展开中...', color: '#00ffff' },
            'deployed': { icon: 'fa-exclamation-triangle', text: '二向箔已就绪', color: '#ffd93d' },
            'flattening': { icon: 'fa-compress-arrows-alt', text: '降维进行中...', color: '#ff6b6b' },
            'complete': { icon: 'fa-check-circle', text: '降维完成：二维化', color: '#a855f7' }
        };

        const p = phases[phase];
        display.innerHTML = `
            <div class="phase-icon" style="color:${p.color}"><i class="fas ${p.icon}"></i></div>
            <div class="phase-text">${p.text}</div>
        `;
        display.style.borderColor = p.color;
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(0, 255, 255, 0.9), rgba(168, 85, 247, 0.9));
            color: #ffffff;
            padding: 15px 30px;
            border-radius: 25px;
            font-size: 16px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
            text-shadow: 0 0 10px rgba(0,0,0,0.5);
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
                    <h3 style="color: #00ffff; margin-bottom: 10px;">
                        <i class="fas fa-compress-alt"></i> 二向箔 · 降维打击
                    </h3>
                    <p style="color: #aaa; font-size: 13px; line-height: 1.6;">
                        <strong style="color: #ffd93d;">《三体》设定：</strong><br>
                        神级文明的终极武器，将三维空间<br>
                        坍缩为二维，一切物质被压成"画"
                    </p>
                    <div style="margin: 15px 0; padding: 10px; background: rgba(0,255,255,0.1); border-radius: 8px;">
                        <p style="color: #00ffff; font-size: 12px;">
                            📐 维度概念：<br>
                            0D(点) → 1D(线) → 2D(面) → 3D(体)<br>
                            <br>
                            ⚠️ 降维 = 维度减少 = 信息压缩
                        </p>
                    </div>
                    <p style="color: #888; font-size: 12px;">
                        💡 点击"释放二向箔"开始演示
                    </p>
                </div>
            `;
        }
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        if (!this.isAutoPlaying) return;

        this.animationTime += delta * 0.001 * this.params.animationSpeed;

        // 行星公转
        if (this.params.phase === 'normal' || this.params.phase === 'deploying') {
            this.planets.forEach(planet => {
                if (!planet.userData.isSun && planet.userData.orbitRadius > 0) {
                    planet.userData.currentAngle += planet.userData.orbitSpeed * this.params.animationSpeed;
                    planet.position.x = Math.cos(planet.userData.currentAngle) * planet.userData.orbitRadius;
                    planet.position.z = Math.sin(planet.userData.currentAngle) * planet.userData.orbitRadius;
                }
            });
        }

        // 二向箔展开动画
        if (this.params.phase === 'deploying') {
            this.animateFoilDeployment();
        }

        // 降维动画
        if (this.params.phase === 'flattening') {
            this.animateFlattening();
        }

        // 二向箔粒子效果
        if (this.foilGroup.visible) {
            this.foilParticles.rotation.z += 0.02;
        }

        // 星空微动
        if (this.starfield) {
            this.starfield.rotation.y += 0.0001;
        }
    }

    /**
     * 二向箔展开动画
     */
    animateFoilDeployment() {
        // 二向箔向太阳系移动
        const targetX = 30;
        const speed = 0.1 * this.params.animationSpeed;
        
        if (this.foilGroup.position.x > targetX) {
            this.foilGroup.position.x -= speed;
            
            // 展开（放大）
            const scale = 1 + (40 - this.foilGroup.position.x) * 0.5;
            this.foil.scale.set(scale, scale, 1);
            this.foilGlow.scale.set(scale * 1.5, scale * 1.5, 1);
        } else {
            // 展开完成
            this.params.phase = 'deployed';
            this.updatePhaseDisplay('deployed');
            document.getElementById('btn-flatten').disabled = false;
        }
    }

    /**
     * 降维动画
     */
    animateFlattening() {
        const speed = 0.002 * this.params.animationSpeed;
        this.params.flattenProgress = Math.min(1, this.params.flattenProgress + speed);

        // 更新进度条
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = (this.params.flattenProgress * 100) + '%';
        }

        // 二向箔继续推进
        if (this.foilGroup.position.x > -35) {
            this.foilGroup.position.x -= 0.15 * this.params.animationSpeed;
        }

        // 压扁行星
        this.planets.forEach(planet => {
            // Y轴压缩
            const flattenAmount = Math.min(1, this.params.flattenProgress * 2);
            const scaleY = Math.max(0.01, 1 - flattenAmount * 0.99);
            planet.scale.y = scaleY;

            // 下沉到平面
            const targetY = -10 + planet.userData.orbitRadius * 0.1;
            planet.position.y = THREE.MathUtils.lerp(0, targetY, flattenAmount);

            // 透明度变化（被降维的部分变透明）
            if (planet.position.x < this.foilGroup.position.x + 5) {
                planet.material.transparent = true;
                planet.material.opacity = Math.max(0.3, 1 - flattenAmount * 0.7);
            }
        });

        // 完成
        if (this.params.flattenProgress >= 1) {
            this.params.phase = 'complete';
            this.updatePhaseDisplay('complete');
            this.showToast('🎭 降维完成！三维空间已坍缩为二维');
        }
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

        if (this.sunLight) {
            this.scene.remove(this.sunLight);
        }

        // 添加动画样式
        if (!document.querySelector('#dimensional-animations')) {
            const animStyle = document.createElement('style');
            animStyle.id = 'dimensional-animations';
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
