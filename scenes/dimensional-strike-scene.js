/**
 * 二向箔/降维打击场景 - Dimensional Strike Visualization
 * ============================================
 * 优化版本 v2.0
 * 
 * 核心改进：
 * 1. 二向箔平铺方向进入（XZ平面）
 * 2. 透明化二向箔
 * 3. 速度提升3倍
 * 4. 星球粒子化降维效果
 * 5. 物理模拟下落
 * ============================================
 */
window.DimensionalStrikeScene = class DimensionalStrikeScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];

        // 场景元素
        this.solarSystem = null;
        this.planets = [];
        this.foil = null;
        this.foilRadius = 0;           // 二向箔当前扩展半径
        this.foilTargetRadius = 50;    // 二向箔最大半径
        
        // 粒子系统
        this.particleSystems = [];     // 每个星球的粒子系统
        this.flattenedCircles = [];    // 降维后的二维圆形

        // 参数
        this.params = {
            phase: 'normal',           // normal, entering, expanding, flattening, complete
            foilPosition: 60,          // 二向箔X位置
            foilSpeed: 0.6,            // 速度（原来的3倍）
            expandSpeed: 0.8,          // 扩展速度
            animationSpeed: 1
        };

        // 颜色
        this.colors = {
            background: 0x000510,
            sun: 0xffdd44,
            earth: 0x4a90d9,
            foil: 0x00ffff,
            particle: 0x00ffff
        };

        this.defaultCameraPos = { x: 0, y: 25, z: 40 };
        this.isAutoPlaying = true;
        this.animationTime = 0;
    }

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

        // 显示引导
        this.showInitialGuide();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        this.sunLight = new THREE.PointLight(0xffdd44, 2, 100);
        this.sunLight.position.set(0, 0, 0);
        this.scene.add(this.sunLight);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 星空
        this.createStarfield();

        // 太阳系
        this.createSolarSystem();

        // 二向箔（平铺方向）
        this.createFoil();

        // 二维平面（降维后的目标平面）
        this.createFlatPlane();
    }

    /**
     * 创建星空背景
     */
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        
        for (let i = 0; i < 2000; i++) {
            const radius = 80 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            starPositions.push(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));

        const starsMaterial = new THREE.PointsMaterial({
            size: 0.2,
            color: 0xffffff,
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
        const sunMaterial = new THREE.MeshBasicMaterial({ color: this.colors.sun });
        const sun = new THREE.Mesh(sunGeometry, sunMaterial);
        
        // 太阳光晕
        const sunGlow = new THREE.Mesh(
            new THREE.SphereGeometry(4, 32, 32),
            new THREE.MeshBasicMaterial({
                color: this.colors.sun,
                transparent: true,
                opacity: 0.2
            })
        );
        sun.add(sunGlow);

        sun.userData = { 
            name: '太阳', 
            radius: 3,
            orbitRadius: 0, 
            orbitSpeed: 0,
            isSun: true,
            isFlattening: false,
            flattenProgress: 0
        };
        this.solarSystem.add(sun);
        this.planets.push(sun);

        // 行星配置
        const planetConfigs = [
            { name: '水星', radius: 0.5, orbit: 6, speed: 0.025, color: 0x888888 },
            { name: '金星', radius: 0.9, orbit: 9, speed: 0.018, color: 0xffcc66 },
            { name: '地球', radius: 1.2, orbit: 13, speed: 0.012, color: 0x4a90d9 },
            { name: '火星', radius: 0.7, orbit: 17, speed: 0.009, color: 0xff6b6b },
            { name: '木星', radius: 2.2, orbit: 23, speed: 0.005, color: 0xffa500 },
            { name: '土星', radius: 1.8, orbit: 30, speed: 0.003, color: 0xffd93d }
        ];

        planetConfigs.forEach((config) => {
            // 轨道环
            const orbitGeometry = new THREE.RingGeometry(config.orbit - 0.08, config.orbit + 0.08, 64);
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
                emissiveIntensity: 0.15,
                transparent: true,
                opacity: 1
            });
            const planet = new THREE.Mesh(planetGeometry, planetMaterial);
            
            const angle = Math.random() * Math.PI * 2;
            planet.position.set(
                Math.cos(angle) * config.orbit,
                0,
                Math.sin(angle) * config.orbit
            );

            planet.userData = {
                name: config.name,
                radius: config.radius,
                orbitRadius: config.orbit,
                orbitSpeed: config.speed,
                currentAngle: angle,
                color: config.color,
                isFlattening: false,
                flattenProgress: 0,
                particles: null
            };

            // 土星环
            if (config.name === '土星') {
                const ringGeometry = new THREE.RingGeometry(2.2, 3.5, 32);
                const ringMaterial = new THREE.MeshBasicMaterial({
                    color: 0xffd93d,
                    side: THREE.DoubleSide,
                    transparent: true,
                    opacity: 0.5
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
     * 创建二向箔 - 平铺方向（XZ平面）
     */
    createFoil() {
        this.foilGroup = new THREE.Group();
        this.foilGroup.position.set(60, 0.1, 0);  // 从右侧开始，稍微高于Y=0
        this.foilGroup.visible = false;
        this.mainGroup.add(this.foilGroup);

        // 二向箔主体 - 透明圆形平面
        const foilGeometry = new THREE.CircleGeometry(0.5, 64);
        const foilMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.foil,
            transparent: true,
            opacity: 0.15,          // 高度透明
            side: THREE.DoubleSide
        });
        this.foil = new THREE.Mesh(foilGeometry, foilMaterial);
        this.foil.rotation.x = -Math.PI / 2;  // 平铺在XZ平面
        this.foilGroup.add(this.foil);

        // 二向箔发光边缘
        const edgeGeometry = new THREE.RingGeometry(0.45, 0.5, 64);
        const edgeMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.foil,
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        this.foilEdge = new THREE.Mesh(edgeGeometry, edgeMaterial);
        this.foilEdge.rotation.x = -Math.PI / 2;
        this.foilGroup.add(this.foilEdge);

        // 外层光晕
        const glowGeometry = new THREE.RingGeometry(0.48, 0.55, 64);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.foil,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        this.foilGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.foilGlow.rotation.x = -Math.PI / 2;
        this.foilGroup.add(this.foilGlow);

        // 边缘粒子效果
        this.createFoilParticles();
    }

    /**
     * 创建二向箔边缘粒子
     */
    createFoilParticles() {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2;
            positions[i * 3] = Math.cos(angle) * 0.5;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = Math.sin(angle) * 0.5;
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: this.colors.foil,
            size: 0.08,
            transparent: true,
            opacity: 0.8
        });

        this.foilParticles = new THREE.Points(geometry, material);
        this.foilGroup.add(this.foilParticles);
    }

    /**
     * 创建二维平面
     */
    createFlatPlane() {
        this.flatPlane = new THREE.Group();
        this.flatPlane.position.y = -0.5;  // 稍低于场景中心
        this.flatPlane.visible = false;
        this.mainGroup.add(this.flatPlane);

        // 底部网格
        const gridHelper = new THREE.GridHelper(80, 40, 0x1a1a4a, 0x111133);
        gridHelper.material.opacity = 0.4;
        gridHelper.material.transparent = true;
        this.flatPlane.add(gridHelper);
    }

    /**
     * 创建星球粒子化效果
     */
    createPlanetParticles(planet) {
        const particleCount = 500;
        const radius = planet.userData.radius;
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];
        const originalPositions = [];

        // 在球面上分布粒子
        for (let i = 0; i < particleCount; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            const x = radius * Math.sin(phi) * Math.cos(theta);
            const y = radius * Math.sin(phi) * Math.sin(theta);
            const z = radius * Math.cos(phi);
            
            positions[i * 3] = x;
            positions[i * 3 + 1] = y;
            positions[i * 3 + 2] = z;
            
            originalPositions.push({ x, y, z });
            
            // 向下飘落的速度
            velocities.push({
                x: (Math.random() - 0.5) * 0.05,
                y: -0.02 - Math.random() * 0.03,
                z: (Math.random() - 0.5) * 0.05
            });
        }

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: planet.userData.color,
            size: 0.15,
            transparent: true,
            opacity: 0.9
        });

        const particles = new THREE.Points(geometry, material);
        particles.position.copy(planet.position);
        
        particles.userData = {
            velocities,
            originalPositions,
            targetY: -0.5,  // 降到二维平面
            planet
        };

        this.mainGroup.add(particles);
        planet.userData.particles = particles;
        this.particleSystems.push(particles);

        return particles;
    }

    /**
     * 创建二维化圆形
     */
    createFlatCircle(planet) {
        const radius = planet.userData.radius;
        
        const geometry = new THREE.CircleGeometry(radius, 32);
        const material = new THREE.MeshBasicMaterial({
            color: planet.userData.color,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        
        const circle = new THREE.Mesh(geometry, material);
        circle.rotation.x = -Math.PI / 2;
        circle.position.set(planet.position.x, -0.4, planet.position.z);
        
        this.flatPlane.add(circle);
        this.flattenedCircles.push({ circle, planet });
        
        return circle;
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'flex';
            controlsDiv.innerHTML = `
                <button class="control-btn active" id="btn-deploy-foil">
                    <i class="fas fa-paper-plane"></i> 释放二向箔
                </button>
                <button class="control-btn" id="btn-reset-scene">
                    <i class="fas fa-redo"></i> 重置场景
                </button>
                <button class="control-btn" id="btn-play">
                    <i class="fas fa-pause"></i> 暂停
                </button>
                <button class="control-btn" id="btn-reset-view">
                    <i class="fas fa-video"></i> 重置视角
                </button>
            `;

            document.getElementById('btn-deploy-foil')?.addEventListener('click', () => this.deployFoil());
            document.getElementById('btn-reset-scene')?.addEventListener('click', () => this.resetScene());
            document.getElementById('btn-play')?.addEventListener('click', () => {
                this.isAutoPlaying = !this.isAutoPlaying;
                const btn = document.getElementById('btn-play');
                btn.innerHTML = this.isAutoPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 播放';
            });
            document.getElementById('btn-reset-view')?.addEventListener('click', () => this.resetCamera());
        }

        // 创建信息面板
        this.createInfoPanel();
    }

    /**
     * 创建信息面板
     */
    createInfoPanel() {
        const container = document.getElementById('view-scene');
        if (!container) return;

        const panel = document.createElement('div');
        panel.id = 'dimensional-info-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <i class="fas fa-compress-alt"></i>
                <span>二向箔 · 降维打击</span>
                <button class="panel-close-btn" id="dim-panel-close" title="关闭">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="dim-phase" id="dim-phase">
                <span class="phase-icon"><i class="fas fa-globe"></i></span>
                <span class="phase-text">正常三维空间</span>
            </div>
            <div class="dim-stats">
                <div class="stat-item">
                    <span class="stat-label">二向箔半径</span>
                    <span class="stat-value" id="foil-radius">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">已降维星球</span>
                    <span class="stat-value" id="flattened-count">0 / 7</span>
                </div>
            </div>
            <div class="dim-tip">
                💡 点击"释放二向箔"开始演示
            </div>
        `;
        panel.style.cssText = `
            position: absolute;
            top: 80px;
            left: 20px;
            background: rgba(10, 15, 30, 0.92);
            border: 1px solid rgba(0, 255, 255, 0.3);
            border-radius: 12px;
            padding: 16px;
            color: #fff;
            font-size: 13px;
            z-index: 100;
            min-width: 220px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        `;
        container.appendChild(panel);
        
        // 绑定关闭按钮
        document.getElementById('dim-panel-close')?.addEventListener('click', () => {
            panel.style.display = 'none';
        });

        this.addPanelStyles();
    }

    addPanelStyles() {
        if (document.getElementById('dim-panel-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'dim-panel-styles';
        style.textContent = `
            #dimensional-info-panel .panel-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 12px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(0, 255, 255, 0.2);
                position: relative;
            }
            #dimensional-info-panel .panel-header i:first-child {
                color: #00ffff;
            }
            #dimensional-info-panel .panel-header span {
                font-weight: 600;
                color: #00ffff;
            }
            #dimensional-info-panel .dim-phase {
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 12px;
                background: rgba(0, 255, 255, 0.1);
                border-radius: 8px;
                border-left: 3px solid #00ffff;
                margin-bottom: 12px;
            }
            #dimensional-info-panel .phase-icon {
                font-size: 20px;
                color: #00ffff;
            }
            #dimensional-info-panel .phase-text {
                font-size: 14px;
            }
            #dimensional-info-panel .dim-stats {
                display: flex;
                flex-direction: column;
                gap: 8px;
                margin-bottom: 12px;
            }
            #dimensional-info-panel .stat-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 10px;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
            }
            #dimensional-info-panel .stat-label {
                color: #888;
            }
            #dimensional-info-panel .stat-value {
                color: #00ffff;
                font-weight: bold;
            }
            #dimensional-info-panel .dim-tip {
                font-size: 12px;
                color: #888;
                padding: 10px;
                background: rgba(0, 255, 255, 0.05);
                border-radius: 6px;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * 更新信息面板
     */
    updateInfoPanel() {
        const radiusEl = document.getElementById('foil-radius');
        const countEl = document.getElementById('flattened-count');
        
        if (radiusEl) {
            radiusEl.textContent = this.foilRadius.toFixed(1);
        }
        
        if (countEl) {
            const flattened = this.planets.filter(p => p.userData.flattenProgress >= 1).length;
            countEl.textContent = `${flattened} / ${this.planets.length}`;
        }
    }

    /**
     * 更新阶段显示
     */
    updatePhaseDisplay(phase) {
        const phaseEl = document.getElementById('dim-phase');
        if (!phaseEl) return;

        const phases = {
            'normal': { icon: 'fa-globe', text: '正常三维空间', color: '#4ecdc4' },
            'entering': { icon: 'fa-paper-plane', text: '二向箔逼近中...', color: '#00ffff' },
            'expanding': { icon: 'fa-expand-arrows-alt', text: '二向箔扩展中...', color: '#ffd93d' },
            'flattening': { icon: 'fa-compress-arrows-alt', text: '降维进行中...', color: '#ff6b6b' },
            'complete': { icon: 'fa-check-circle', text: '降维完成', color: '#a855f7' }
        };

        const p = phases[phase] || phases['normal'];
        phaseEl.innerHTML = `
            <span class="phase-icon" style="color:${p.color}"><i class="fas ${p.icon}"></i></span>
            <span class="phase-text">${p.text}</span>
        `;
        phaseEl.style.borderColor = p.color;
    }

    /**
     * 释放二向箔
     */
    deployFoil() {
        if (this.params.phase !== 'normal') return;

        this.params.phase = 'entering';
        this.foilGroup.visible = true;
        this.flatPlane.visible = true;
        this.foilRadius = 0.5;
        
        this.updatePhaseDisplay('entering');
        
        document.getElementById('btn-deploy-foil').disabled = true;
        document.getElementById('btn-deploy-foil').classList.remove('active');

        this.showToast('⚠️ 二向箔已释放！正在逼近...');
    }

    /**
     * 重置场景
     */
    resetScene() {
        this.params.phase = 'normal';
        this.params.foilPosition = 60;
        this.foilRadius = 0;

        // 隐藏二向箔
        this.foilGroup.visible = false;
        this.foilGroup.position.set(60, 0.1, 0);
        this.foil.scale.set(1, 1, 1);
        this.foilEdge.scale.set(1, 1, 1);
        this.foilGlow.scale.set(1, 1, 1);

        // 隐藏平面
        this.flatPlane.visible = false;

        // 清除粒子系统
        this.particleSystems.forEach(ps => {
            this.mainGroup.remove(ps);
            ps.geometry.dispose();
            ps.material.dispose();
        });
        this.particleSystems = [];

        // 清除二维圆形
        this.flattenedCircles.forEach(({ circle }) => {
            this.flatPlane.remove(circle);
            circle.geometry.dispose();
            circle.material.dispose();
        });
        this.flattenedCircles = [];

        // 恢复行星
        this.planets.forEach(planet => {
            planet.visible = true;
            planet.scale.set(1, 1, 1);
            planet.position.y = 0;
            planet.material.opacity = 1;
            planet.userData.isFlattening = false;
            planet.userData.flattenProgress = 0;
            planet.userData.particles = null;
        });

        // 更新UI
        this.updatePhaseDisplay('normal');
        document.getElementById('btn-deploy-foil').disabled = false;
        document.getElementById('btn-deploy-foil').classList.add('active');
        this.updateInfoPanel();

        this.showToast('场景已重置');
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
        setTimeout(() => {
            this.showToast('🌌 点击"释放二向箔"开始降维打击演示');
        }, 500);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        if (!this.isAutoPlaying) return;

        this.animationTime += delta * 0.001 * this.params.animationSpeed;

        // 行星公转（未降维时）
        if (this.params.phase === 'normal' || this.params.phase === 'entering') {
            this.animatePlanetOrbits();
        }

        // 二向箔进入动画
        if (this.params.phase === 'entering') {
            this.animateFoilEntering();
        }

        // 二向箔扩展动画
        if (this.params.phase === 'expanding') {
            this.animateFoilExpanding();
        }

        // 降维粒子动画
        if (this.params.phase === 'expanding' || this.params.phase === 'flattening') {
            this.animateParticleSystems();
            this.animateFlatteningCircles();
        }

        // 二向箔边缘粒子旋转
        if (this.foilGroup.visible && this.foilParticles) {
            this.updateFoilParticles();
        }

        // 更新信息面板
        this.updateInfoPanel();

        // 星空微动
        if (this.starfield) {
            this.starfield.rotation.y += 0.0002;
        }
    }

    /**
     * 行星公转动画
     */
    animatePlanetOrbits() {
        this.planets.forEach(planet => {
            if (!planet.userData.isSun && planet.userData.orbitRadius > 0 && !planet.userData.isFlattening) {
                planet.userData.currentAngle += planet.userData.orbitSpeed * this.params.animationSpeed;
                planet.position.x = Math.cos(planet.userData.currentAngle) * planet.userData.orbitRadius;
                planet.position.z = Math.sin(planet.userData.currentAngle) * planet.userData.orbitRadius;
            }
        });
    }

    /**
     * 二向箔进入动画
     */
    animateFoilEntering() {
        const speed = this.params.foilSpeed * this.params.animationSpeed;
        
        // 从右侧向中心移动
        if (this.foilGroup.position.x > 0) {
            this.foilGroup.position.x -= speed;
            
            // 边移动边稍微放大
            const scale = 1 + (60 - this.foilGroup.position.x) * 0.1;
            this.foil.scale.set(scale, scale, 1);
            this.foilEdge.scale.set(scale, scale, 1);
            this.foilGlow.scale.set(scale, scale, 1);
            this.foilRadius = 0.5 * scale;
        } else {
            // 到达中心，开始扩展
            this.params.phase = 'expanding';
            this.updatePhaseDisplay('expanding');
            this.showToast('🌀 二向箔开始扩展！降维开始...');
        }
    }

    /**
     * 二向箔扩展动画
     */
    animateFoilExpanding() {
        const expandSpeed = this.params.expandSpeed * this.params.animationSpeed;
        
        if (this.foilRadius < this.foilTargetRadius) {
            this.foilRadius += expandSpeed;
            
            const scale = this.foilRadius / 0.5;
            this.foil.scale.set(scale, scale, 1);
            this.foilEdge.scale.set(scale, scale, 1);
            this.foilGlow.scale.set(scale, scale, 1);
            
            // 检测与星球的接触
            this.checkPlanetContact();
        } else {
            // 扩展完成
            if (!this.isAllFlattened()) {
                this.params.phase = 'flattening';
                this.updatePhaseDisplay('flattening');
            }
        }

        // 检查是否全部降维完成
        if (this.isAllFlattened()) {
            this.params.phase = 'complete';
            this.updatePhaseDisplay('complete');
            this.showToast('🎭 降维完成！三维空间已坍缩为二维');
        }
    }

    /**
     * 检测星球接触
     */
    checkPlanetContact() {
        this.planets.forEach(planet => {
            if (planet.userData.isFlattening) return;
            
            const distance = Math.sqrt(
                planet.position.x * planet.position.x + 
                planet.position.z * planet.position.z
            );
            
            // 当二向箔边缘接触到星球时
            if (distance <= this.foilRadius + planet.userData.radius) {
                this.startPlanetFlattening(planet);
            }
        });
    }

    /**
     * 开始星球降维
     */
    startPlanetFlattening(planet) {
        planet.userData.isFlattening = true;
        planet.userData.flattenProgress = 0;
        
        // 创建粒子系统
        this.createPlanetParticles(planet);
        
        // 创建二维圆形
        this.createFlatCircle(planet);
        
        // 闪光效果
        this.createContactFlash(planet.position);
    }

    /**
     * 创建接触闪光效果
     */
    createContactFlash(position) {
        const flashGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const flashMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(flashGeometry, flashMaterial);
        flash.position.copy(position);
        this.mainGroup.add(flash);

        // 动画：放大并消失
        const animate = () => {
            flash.scale.multiplyScalar(1.15);
            flash.material.opacity -= 0.08;
            
            if (flash.material.opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.mainGroup.remove(flash);
                flash.geometry.dispose();
                flash.material.dispose();
            }
        };
        animate();
    }

    /**
     * 更新二向箔边缘粒子
     */
    updateFoilParticles() {
        const positions = this.foilParticles.geometry.attributes.position.array;
        const particleCount = positions.length / 3;
        const scale = this.foilRadius / 0.5;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + this.animationTime * 2;
            positions[i * 3] = Math.cos(angle) * 0.5 * scale;
            positions[i * 3 + 2] = Math.sin(angle) * 0.5 * scale;
        }
        
        this.foilParticles.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * 粒子系统动画
     */
    animateParticleSystems() {
        this.particleSystems.forEach(particles => {
            const positions = particles.geometry.attributes.position.array;
            const velocities = particles.userData.velocities;
            const targetY = particles.userData.targetY;
            const planet = particles.userData.planet;
            
            let allSettled = true;
            
            for (let i = 0; i < velocities.length; i++) {
                // 当前位置
                let y = positions[i * 3 + 1];
                
                // 未到达目标平面
                if (y > targetY) {
                    positions[i * 3] += velocities[i].x;
                    positions[i * 3 + 1] += velocities[i].y;
                    positions[i * 3 + 2] += velocities[i].z;
                    
                    // 加速下落
                    velocities[i].y -= 0.001;
                    
                    allSettled = false;
                } else {
                    positions[i * 3 + 1] = targetY;
                }
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
            
            // 更新星球降维进度
            if (!allSettled) {
                planet.userData.flattenProgress = Math.min(1, planet.userData.flattenProgress + 0.01);
                
                // 原始星球逐渐透明
                planet.material.opacity = Math.max(0, 1 - planet.userData.flattenProgress);
                
                // 原始星球Y轴压缩
                planet.scale.y = Math.max(0.01, 1 - planet.userData.flattenProgress * 0.99);
            } else {
                planet.userData.flattenProgress = 1;
                planet.visible = false;
            }
        });
    }

    /**
     * 二维圆形渐显动画
     */
    animateFlatteningCircles() {
        this.flattenedCircles.forEach(({ circle, planet }) => {
            const progress = planet.userData.flattenProgress;
            circle.material.opacity = progress * 0.8;
        });
    }

    /**
     * 检查是否全部降维完成
     */
    isAllFlattened() {
        return this.planets.every(p => p.userData.flattenProgress >= 1);
    }

    /**
     * 销毁场景
     */
    dispose() {
        // 清理粒子系统
        this.particleSystems.forEach(ps => {
            this.mainGroup.remove(ps);
            ps.geometry.dispose();
            ps.material.dispose();
        });

        // 清理二维圆形
        this.flattenedCircles.forEach(({ circle }) => {
            circle.geometry.dispose();
            circle.material.dispose();
        });

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

        // 移除信息面板
        const panel = document.getElementById('dimensional-info-panel');
        if (panel) panel.remove();

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
