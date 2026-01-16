/**
 * 万有引力与时空弯曲 3D教学场景
 * ============================================
 * 教学内容：
 * 1. 牛顿万有引力定律 F = GMm/r²
 * 2. 爱因斯坦广义相对论 - 时空弯曲
 * 3. 引力波 - 时空涟漪
 * 4. 黑洞与霍金辐射
 * 
 * 目标学生：初中-高中
 * ============================================
 */

class GravityScene {
    constructor(scene, camera, renderer) {
        // Three.js 核心对象（由 SceneManager 传入）
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'GravityScene';
        this.mainGroup = null;
        
        // 场景元素
        this.spacetimeGrid = null;
        this.gridGeometry = null;
        this.gridVertices = [];
        this.originalPositions = [];
        
        // 质量物体
        this.masses = [];
        this.sun = null;
        this.earth = null;
        this.moon = null;
        
        // 测试粒子
        this.testParticles = [];
        this.particleTrails = [];
        
        // 引力波相关
        this.gravitationalWaves = [];
        this.waveTime = 0;
        
        // 黑洞相关
        this.blackHole = null;
        this.eventHorizon = null;
        this.hawkingParticles = [];
        
        // 教学状态
        this.currentStep = 0;
        this.isPlaying = false;
        this.mode = 'newton'; // 'newton', 'einstein', 'wave', 'blackhole'
        
        // 物理常数（缩放后）
        this.G = 0.5; // 引力常数（视觉效果调整）
        
        // 真实天体数据（相对比例）
        this.celestialData = {
            sun: { mass: 100, radius: 2.5, color: 0xFFD700, name: '太阳' },
            earth: { mass: 0.3, radius: 0.4, color: 0x4169E1, name: '地球', orbitRadius: 8 },
            moon: { mass: 0.01, radius: 0.1, color: 0xC0C0C0, name: '月球', orbitRadius: 1.2 },
            blackhole: { mass: 500, radius: 1.5, color: 0x000000, name: '黑洞' }
        };
        
        // 动画
        this.animationTime = 0;
        this.orbitAngle = 0;
        this.moonOrbitAngle = 0;
    }

    /**
     * 初始化场景
     */
    init() {
        // 创建主容器
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建深空背景
        this.createSpaceBackground();
        
        // 创建时空网格
        this.createSpacetimeGrid();
        
        // 创建初始天体（太阳-地球系统）
        this.createCelestialBodies();
        
        // 创建UI控制
        this.createControls();
        
        // 设置相机位置
        if (this.camera) {
            this.camera.position.set(0, 15, 20);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 设置灯光
        this.setupLighting();
        
        console.log('GravityScene initialized');
    }

    /**
     * 创建深空背景
     */
    createSpaceBackground() {
        // 星空粒子
        const starCount = 2000;
        const starsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            // 球形分布
            const radius = 100 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // 随机星星颜色
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                colors[i * 3] = 1; colors[i * 3 + 1] = 1; colors[i * 3 + 2] = 1;
            } else if (colorChoice < 0.85) {
                colors[i * 3] = 1; colors[i * 3 + 1] = 0.9; colors[i * 3 + 2] = 0.7;
            } else {
                colors[i * 3] = 0.7; colors[i * 3 + 1] = 0.8; colors[i * 3 + 2] = 1;
            }
        }
        
        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starsGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const starsMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        stars.userData = { isBackground: true };
        this.scene.add(stars);
    }

    /**
     * 创建时空网格
     */
    createSpacetimeGrid() {
        const gridSize = 30;
        const segments = 40;
        
        // 使用PlaneGeometry创建网格
        this.gridGeometry = new THREE.PlaneGeometry(gridSize, gridSize, segments, segments);
        this.gridGeometry.rotateX(-Math.PI / 2);
        
        // 保存原始顶点位置
        const positionAttr = this.gridGeometry.attributes.position;
        this.originalPositions = [];
        for (let i = 0; i < positionAttr.count; i++) {
            this.originalPositions.push({
                x: positionAttr.getX(i),
                y: positionAttr.getY(i),
                z: positionAttr.getZ(i)
            });
        }
        
        // 网格材质 - 半透明发光效果
        const gridMaterial = new THREE.MeshBasicMaterial({
            color: 0x00FFFF,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        
        this.spacetimeGrid = new THREE.Mesh(this.gridGeometry, gridMaterial);
        this.spacetimeGrid.position.y = -2;
        this.spacetimeGrid.userData = {
            name: '时空网格',
            info: '这是时空的可视化表示。在爱因斯坦的广义相对论中，质量会使时空弯曲。网格的下沉程度代表时空弯曲的强度。',
            isInteractive: true
        };
        this.scene.add(this.spacetimeGrid);
        
        // 添加网格边框发光效果
        const edgeGeometry = new THREE.EdgesGeometry(
            new THREE.PlaneGeometry(gridSize, gridSize, 1, 1)
        );
        const edgeMaterial = new THREE.LineBasicMaterial({
            color: 0x00FFFF,
            transparent: true,
            opacity: 0.6
        });
        const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        edges.rotation.x = -Math.PI / 2;
        edges.position.y = -2;
        this.scene.add(edges);
    }

    /**
     * 创建天体
     */
    createCelestialBodies() {
        // 创建太阳
        this.sun = this.createMassBody(
            this.celestialData.sun,
            new THREE.Vector3(0, 0, 0)
        );
        
        // 创建地球
        this.earth = this.createMassBody(
            this.celestialData.earth,
            new THREE.Vector3(this.celestialData.earth.orbitRadius, 0, 0)
        );
        
        // 创建地球轨道线
        this.createOrbitLine(this.celestialData.earth.orbitRadius, 0x4169E1);
        
        // 初始时隐藏月球
        this.moon = null;
    }

    /**
     * 创建质量物体
     */
    createMassBody(data, position) {
        const group = new THREE.Group();
        
        // 主体球
        const geometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({
            color: data.color,
            emissive: data.color,
            emissiveIntensity: 0.3,
            metalness: 0.2,
            roughness: 0.8
        });
        const sphere = new THREE.Mesh(geometry, material);
        group.add(sphere);
        
        // 发光光晕
        const glowGeometry = new THREE.SphereGeometry(data.radius * 1.3, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: data.color,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        group.add(glow);
        
        group.position.copy(position);
        group.userData = {
            name: data.name,
            mass: data.mass,
            radius: data.radius,
            info: this.getBodyInfo(data.name),
            isInteractive: true,
            isMassBody: true
        };
        
        this.scene.add(group);
        this.masses.push(group);
        
        return group;
    }

    /**
     * 获取天体信息
     */
    getBodyInfo(name) {
        const info = {
            '太阳': `<b>太阳</b><br>
                质量：1.989 × 10³⁰ kg<br>
                半径：696,340 km<br>
                <br>
                太阳是太阳系的中心天体，其巨大质量产生的引力将所有行星束缚在轨道上。<br>
                在广义相对论中，太阳的质量使周围的时空发生弯曲，这就是为什么行星会绕太阳运动。`,
            '地球': `<b>地球</b><br>
                质量：5.972 × 10²⁴ kg<br>
                轨道半径：1.496 × 10⁸ km (1 AU)<br>
                公转周期：365.25 天<br>
                <br>
                地球沿着太阳弯曲的时空"滚动"，这就形成了我们看到的轨道运动。`,
            '月球': `<b>月球</b><br>
                质量：7.342 × 10²² kg<br>
                轨道半径：384,400 km<br>
                公转周期：27.3 天<br>
                <br>
                月球同时受到地球和太阳的引力影响，形成复杂的轨道。`,
            '黑洞': `<b>黑洞</b><br>
                史瓦西半径：R = 2GM/c²<br>
                <br>
                当物质坍缩到极端密度时，时空弯曲如此剧烈，以至于连光都无法逃逸。<br>
                黑色区域是"事件视界"，一旦跨越就永远无法返回。<br>
                <br>
                <b>霍金辐射：</b>量子效应使黑洞缓慢"蒸发"，发出极其微弱的辐射。`
        };
        return info[name] || `${name}的详细信息`;
    }

    /**
     * 创建轨道线
     */
    createOrbitLine(radius, color) {
        const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, 2 * Math.PI, false, 0);
        const points = curve.getPoints(64);
        const geometry = new THREE.BufferGeometry().setFromPoints(
            points.map(p => new THREE.Vector3(p.x, 0, p.y))
        );
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.4
        });
        const orbitLine = new THREE.Line(geometry, material);
        this.scene.add(orbitLine);
        return orbitLine;
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        // 环境光
        const ambient = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambient);
        
        // 太阳点光源
        const sunLight = new THREE.PointLight(0xFFD700, 2, 50);
        sunLight.position.set(0, 2, 0);
        this.scene.add(sunLight);
    }

    /**
     * 更新时空网格变形
     */
    updateGridDeformation() {
        if (!this.gridGeometry || !this.spacetimeGrid) return;
        
        const positionAttr = this.gridGeometry.attributes.position;
        
        for (let i = 0; i < positionAttr.count; i++) {
            const orig = this.originalPositions[i];
            let totalDeformation = 0;
            
            // 计算所有质量物体对此点的影响
            for (const mass of this.masses) {
                if (!mass.visible) continue;
                
                const dx = orig.x - mass.position.x;
                const dz = orig.z - mass.position.z;
                const distance = Math.sqrt(dx * dx + dz * dz);
                
                const massValue = mass.userData.mass || 1;
                const sigma = Math.max(2, massValue * 0.1);
                
                // 高斯下沉
                const deformation = massValue * 0.08 * Math.exp(-(distance * distance) / (2 * sigma * sigma));
                totalDeformation += deformation;
            }
            
            // 添加引力波效果
            if (this.mode === 'wave' && this.isPlaying) {
                const waveEffect = this.calculateWaveEffect(orig.x, orig.z);
                totalDeformation += waveEffect;
            }
            
            positionAttr.setY(i, orig.y - totalDeformation);
        }
        
        positionAttr.needsUpdate = true;
        this.gridGeometry.computeVertexNormals();
    }

    /**
     * 计算引力波效果
     */
    calculateWaveEffect(x, z) {
        const distance = Math.sqrt(x * x + z * z);
        const wavelength = 3;
        const amplitude = 0.3;
        const speed = 2;
        
        const phase = distance / wavelength - this.waveTime * speed;
        const decay = Math.exp(-distance * 0.05);
        
        return Math.sin(phase * Math.PI * 2) * amplitude * decay;
    }

    /**
     * 更新天体轨道
     */
    updateOrbits(delta) {
        if (!this.isPlaying) return;
        
        // 地球公转
        if (this.earth) {
            this.orbitAngle += delta * 0.3;
            const earthRadius = this.celestialData.earth.orbitRadius;
            this.earth.position.x = Math.cos(this.orbitAngle) * earthRadius;
            this.earth.position.z = Math.sin(this.orbitAngle) * earthRadius;
        }
        
        // 月球公转（绕地球）
        if (this.moon && this.earth) {
            this.moonOrbitAngle += delta * 1.2;
            const moonRadius = this.celestialData.moon.orbitRadius;
            this.moon.position.x = this.earth.position.x + Math.cos(this.moonOrbitAngle) * moonRadius;
            this.moon.position.z = this.earth.position.z + Math.sin(this.moonOrbitAngle) * moonRadius;
        }
    }

    /**
     * 创建控制面板
     */
    createControls() {
        const container = document.getElementById('scene-controls');
        if (!container) return;
        
        container.innerHTML = `
            <div class="gravity-controls">
                <div class="control-group">
                    <label>教学模式</label>
                    <div class="mode-buttons">
                        <button class="mode-btn active" data-mode="newton">
                            <i class="fas fa-apple-alt"></i> 牛顿引力
                        </button>
                        <button class="mode-btn" data-mode="einstein">
                            <i class="fas fa-brain"></i> 时空弯曲
                        </button>
                        <button class="mode-btn" data-mode="wave">
                            <i class="fas fa-wave-square"></i> 引力波
                        </button>
                        <button class="mode-btn" data-mode="blackhole">
                            <i class="fas fa-circle"></i> 黑洞
                        </button>
                    </div>
                </div>
                
                <div class="control-group">
                    <label>太阳质量</label>
                    <input type="range" id="sun-mass" min="10" max="200" value="100">
                    <span id="sun-mass-value">100</span>
                </div>
                
                <div class="control-group">
                    <button class="action-btn" id="btn-play-pause">
                        <i class="fas fa-play"></i> 播放
                    </button>
                    <button class="action-btn" id="btn-add-particle">
                        <i class="fas fa-circle"></i> 释放粒子
                    </button>
                    <button class="action-btn" id="btn-reset">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
            </div>
        `;
        
        container.style.display = 'flex';
        
        // 绑定事件
        this.bindControlEvents();
    }

    /**
     * 绑定控制事件
     */
    bindControlEvents() {
        // 模式切换
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchMode(btn.dataset.mode);
            });
        });
        
        // 质量滑块
        const sunMassSlider = document.getElementById('sun-mass');
        if (sunMassSlider) {
            sunMassSlider.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                document.getElementById('sun-mass-value').textContent = value;
                if (this.sun) {
                    this.sun.userData.mass = value;
                }
            });
        }
        
        // 播放/暂停
        const playBtn = document.getElementById('btn-play-pause');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.isPlaying = !this.isPlaying;
                playBtn.innerHTML = this.isPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 播放';
            });
        }
        
        // 释放粒子
        const particleBtn = document.getElementById('btn-add-particle');
        if (particleBtn) {
            particleBtn.addEventListener('click', () => this.addTestParticle());
        }
        
        // 重置
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetScene());
        }
    }

    /**
     * 切换教学模式
     */
    switchMode(mode) {
        this.mode = mode;
        
        // 清理现有元素
        this.clearTestParticles();
        
        switch (mode) {
            case 'newton':
                this.setupNewtonMode();
                break;
            case 'einstein':
                this.setupEinsteinMode();
                break;
            case 'wave':
                this.setupWaveMode();
                break;
            case 'blackhole':
                this.setupBlackholeMode();
                break;
        }
        
        // 显示模式说明
        this.showModeInfo(mode);
    }

    /**
     * 牛顿模式
     */
    setupNewtonMode() {
        // 显示太阳地球
        if (this.sun) this.sun.visible = true;
        if (this.earth) this.earth.visible = true;
        if (this.blackHole) this.blackHole.visible = false;
        
        // 创建引力线
        this.createGravityForceLines();
    }

    /**
     * 爱因斯坦模式
     */
    setupEinsteinMode() {
        if (this.sun) this.sun.visible = true;
        if (this.earth) this.earth.visible = true;
        if (this.blackHole) this.blackHole.visible = false;
        
        // 强调网格变形
        if (this.spacetimeGrid) {
            this.spacetimeGrid.material.opacity = 0.5;
        }
    }

    /**
     * 引力波模式
     */
    setupWaveMode() {
        // 创建双星系统
        this.createBinarySystem();
    }

    /**
     * 黑洞模式
     */
    setupBlackholeMode() {
        if (this.sun) this.sun.visible = false;
        if (this.earth) this.earth.visible = false;
        
        // 创建黑洞
        if (!this.blackHole) {
            this.createBlackHole();
        }
        this.blackHole.visible = true;
        
        // 开始霍金辐射动画
        this.startHawkingRadiation();
    }

    /**
     * 创建引力线（牛顿模式）
     */
    createGravityForceLines() {
        // 清除旧的
        this.scene.children
            .filter(c => c.userData.isGravityLine)
            .forEach(c => this.scene.remove(c));
        
        if (!this.sun || !this.earth) return;
        
        // 太阳到地球的引力线
        const start = this.sun.position.clone();
        const end = this.earth.position.clone();
        
        const direction = end.clone().sub(start);
        const length = direction.length();
        
        // 多条箭头线
        for (let i = 0; i < 5; i++) {
            const t = (i + 1) / 6;
            const point = start.clone().lerp(end, t);
            
            const arrowGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
            const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xFF6B35 });
            const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
            
            arrow.position.copy(point);
            arrow.lookAt(end);
            arrow.rotateX(Math.PI / 2);
            
            arrow.userData = { isGravityLine: true };
            this.scene.add(arrow);
        }
    }

    /**
     * 创建双星系统
     */
    createBinarySystem() {
        // 简化：用两个相同质量的星体旋转
        // 这里复用sun和earth，让它们绕公共质心旋转
        if (this.sun) {
            this.sun.userData.mass = 50;
        }
        if (this.earth) {
            this.earth.userData.mass = 50;
            this.earth.scale.set(2, 2, 2);
        }
    }

    /**
     * 创建黑洞
     */
    createBlackHole() {
        const data = this.celestialData.blackhole;
        const group = new THREE.Group();
        
        // 事件视界（纯黑球体）
        const holeGeometry = new THREE.SphereGeometry(data.radius, 32, 32);
        const holeMaterial = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const hole = new THREE.Mesh(holeGeometry, holeMaterial);
        group.add(hole);
        
        // 吸积盘
        const diskGeometry = new THREE.RingGeometry(data.radius * 1.5, data.radius * 4, 64);
        const diskMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF4500,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6
        });
        const disk = new THREE.Mesh(diskGeometry, diskMaterial);
        disk.rotation.x = -Math.PI / 2;
        disk.position.y = 0;
        group.add(disk);
        
        // 光子球（临界轨道）
        const photonGeometry = new THREE.TorusGeometry(data.radius * 1.5, 0.05, 16, 100);
        const photonMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.8
        });
        const photonSphere = new THREE.Mesh(photonGeometry, photonMaterial);
        photonSphere.rotation.x = Math.PI / 2;
        group.add(photonSphere);
        
        group.position.set(0, 0, 0);
        group.userData = {
            name: '黑洞',
            mass: data.mass,
            info: this.getBodyInfo('黑洞'),
            isInteractive: true,
            isMassBody: true
        };
        
        this.scene.add(group);
        this.blackHole = group;
        this.masses.push(group);
    }

    /**
     * 开始霍金辐射动画
     */
    startHawkingRadiation() {
        if (!this.blackHole) return;
        
        // 创建粒子对
        const createHawkingPair = () => {
            if (this.mode !== 'blackhole' || !this.isPlaying) return;
            
            const radius = this.celestialData.blackhole.radius * 1.2;
            const angle = Math.random() * Math.PI * 2;
            
            const position = new THREE.Vector3(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 0.5,
                Math.sin(angle) * radius
            );
            
            // 逃逸粒子（霍金辐射）
            const escapeGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const escapeMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
            const escapeParticle = new THREE.Mesh(escapeGeometry, escapeMaterial);
            escapeParticle.position.copy(position);
            escapeParticle.userData = {
                velocity: position.clone().normalize().multiplyScalar(0.05),
                isHawking: true
            };
            this.scene.add(escapeParticle);
            this.hawkingParticles.push(escapeParticle);
            
            // 落入粒子
            const fallGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const fallMaterial = new THREE.MeshBasicMaterial({ color: 0xFF0000 });
            const fallParticle = new THREE.Mesh(fallGeometry, fallMaterial);
            fallParticle.position.copy(position);
            fallParticle.userData = {
                velocity: position.clone().normalize().multiplyScalar(-0.03),
                isHawking: true,
                isFalling: true
            };
            this.scene.add(fallParticle);
            this.hawkingParticles.push(fallParticle);
        };
        
        // 定时创建粒子对
        this.hawkingInterval = setInterval(createHawkingPair, 500);
    }

    /**
     * 添加测试粒子
     */
    addTestParticle() {
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: 0xFFFF00 });
        const particle = new THREE.Mesh(geometry, material);
        
        // 随机位置（远离中心）
        const angle = Math.random() * Math.PI * 2;
        const radius = 10 + Math.random() * 5;
        particle.position.set(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
        );
        
        // 初始切向速度（轨道运动）
        const tangent = new THREE.Vector3(
            -Math.sin(angle),
            0,
            Math.cos(angle)
        );
        particle.userData = {
            velocity: tangent.multiplyScalar(0.5),
            isTestParticle: true
        };
        
        // 创建轨迹
        const trailGeometry = new THREE.BufferGeometry();
        const trailMaterial = new THREE.LineBasicMaterial({
            color: 0xFFFF00,
            transparent: true,
            opacity: 0.5
        });
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        trail.userData = { positions: [], maxLength: 100 };
        this.scene.add(trail);
        
        particle.userData.trail = trail;
        
        this.scene.add(particle);
        this.testParticles.push(particle);
    }

    /**
     * 更新测试粒子
     */
    updateTestParticles(delta) {
        for (const particle of this.testParticles) {
            if (!particle.userData.velocity) continue;
            
            // 计算引力
            let totalForce = new THREE.Vector3();
            for (const mass of this.masses) {
                if (!mass.visible) continue;
                
                const direction = mass.position.clone().sub(particle.position);
                const distance = Math.max(direction.length(), 0.5);
                const forceMagnitude = this.G * (mass.userData.mass || 1) / (distance * distance);
                totalForce.add(direction.normalize().multiplyScalar(forceMagnitude));
            }
            
            // 更新速度和位置
            particle.userData.velocity.add(totalForce.multiplyScalar(delta));
            particle.position.add(particle.userData.velocity.clone().multiplyScalar(delta * 10));
            
            // 更新轨迹
            if (particle.userData.trail) {
                const trail = particle.userData.trail;
                trail.userData.positions.push(particle.position.clone());
                if (trail.userData.positions.length > trail.userData.maxLength) {
                    trail.userData.positions.shift();
                }
                trail.geometry.setFromPoints(trail.userData.positions);
            }
        }
    }

    /**
     * 更新霍金粒子
     */
    updateHawkingParticles(delta) {
        for (let i = this.hawkingParticles.length - 1; i >= 0; i--) {
            const particle = this.hawkingParticles[i];
            if (!particle.userData.velocity) continue;
            
            particle.position.add(particle.userData.velocity);
            
            // 移除离开视野的粒子
            if (particle.position.length() > 30 || particle.position.length() < 0.5) {
                this.scene.remove(particle);
                this.hawkingParticles.splice(i, 1);
            }
        }
    }

    /**
     * 清理测试粒子
     */
    clearTestParticles() {
        for (const particle of this.testParticles) {
            if (particle.userData.trail) {
                this.scene.remove(particle.userData.trail);
            }
            this.scene.remove(particle);
        }
        this.testParticles = [];
        
        for (const particle of this.hawkingParticles) {
            this.scene.remove(particle);
        }
        this.hawkingParticles = [];
        
        if (this.hawkingInterval) {
            clearInterval(this.hawkingInterval);
        }
    }

    /**
     * 显示模式信息
     */
    showModeInfo(mode) {
        const info = {
            newton: {
                title: '牛顿万有引力定律',
                content: `
                    <div class="formula">F = G × (M₁ × M₂) / r²</div>
                    <p>任何两个有质量的物体之间都存在相互吸引的力。</p>
                    <ul>
                        <li>F：引力大小</li>
                        <li>G：万有引力常数 (6.674×10⁻¹¹)</li>
                        <li>M₁, M₂：两物体质量</li>
                        <li>r：物体间距离</li>
                    </ul>
                `
            },
            einstein: {
                title: '爱因斯坦广义相对论',
                content: `
                    <p><b>"质量告诉时空如何弯曲，时空告诉物质如何运动"</b></p>
                    <p>引力不是一种"力"，而是时空弯曲的表现。</p>
                    <ul>
                        <li>质量越大，时空弯曲越剧烈</li>
                        <li>物体沿着弯曲时空的"最短路径"运动</li>
                        <li>行星轨道是时空弯曲的自然结果</li>
                    </ul>
                `
            },
            wave: {
                title: '引力波',
                content: `
                    <p>当大质量物体加速运动时，会在时空中产生涟漪——引力波。</p>
                    <ul>
                        <li>以光速传播</li>
                        <li>双星系统、黑洞合并会产生强引力波</li>
                        <li>2015年LIGO首次直接探测到引力波</li>
                    </ul>
                    <p class="highlight">观察网格上的波纹，这就是时空的振动！</p>
                `
            },
            blackhole: {
                title: '黑洞与霍金辐射',
                content: `
                    <p>当物质坍缩到极端密度时，时空弯曲如此剧烈，形成黑洞。</p>
                    <ul>
                        <li><b>事件视界</b>：一旦跨越，永远无法返回</li>
                        <li><b>吸积盘</b>：落入物质形成的炽热圆盘</li>
                        <li><b>霍金辐射</b>：量子效应使黑洞缓慢"蒸发"</li>
                    </ul>
                    <p>绿色粒子=逃逸（霍金辐射），红色粒子=落入</p>
                `
            }
        };
        
        const modeInfo = info[mode];
        if (modeInfo) {
            // 显示信息面板
            const panel = document.getElementById('info-panel');
            const title = document.getElementById('info-title');
            const content = document.getElementById('info-content');
            if (panel && title && content) {
                title.textContent = modeInfo.title;
                content.innerHTML = modeInfo.content;
                panel.classList.add('visible');
            }
        }
    }

    /**
     * 重置场景
     */
    resetScene() {
        this.clearTestParticles();
        this.orbitAngle = 0;
        this.moonOrbitAngle = 0;
        this.waveTime = 0;
        this.isPlaying = false;
        
        // 重置天体位置
        if (this.sun) {
            this.sun.position.set(0, 0, 0);
            this.sun.userData.mass = this.celestialData.sun.mass;
        }
        if (this.earth) {
            this.earth.position.set(this.celestialData.earth.orbitRadius, 0, 0);
            this.earth.scale.set(1, 1, 1);
        }
        
        // 重置UI
        const playBtn = document.getElementById('btn-play-pause');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-play"></i> 播放';
        }
        
        const sunMassSlider = document.getElementById('sun-mass');
        if (sunMassSlider) {
            sunMassSlider.value = 100;
            document.getElementById('sun-mass-value').textContent = '100';
        }
    }

    /**
     * 动画更新
     */
    update(delta) {
        this.animationTime += delta;
        
        if (this.mode === 'wave') {
            this.waveTime += delta;
        }
        
        // 更新轨道
        this.updateOrbits(delta);
        
        // 更新网格变形
        this.updateGridDeformation();
        
        // 更新测试粒子
        this.updateTestParticles(delta);
        
        // 更新霍金粒子
        if (this.mode === 'blackhole') {
            this.updateHawkingParticles(delta);
            
            // 旋转吸积盘
            if (this.blackHole && this.blackHole.children[1]) {
                this.blackHole.children[1].rotation.z += delta * 0.5;
            }
        }
        
        // 更新引力线（牛顿模式）
        if (this.mode === 'newton' && this.isPlaying) {
            this.createGravityForceLines();
        }
    }

    /**
     * 创建标签
     */
    createLabels(sceneManager) {
        // 标签由场景管理器处理
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        this.isPlaying = true;
        const playBtn = document.getElementById('btn-play-pause');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        }
    }

    /**
     * 清理
     */
    dispose() {
        this.clearTestParticles();
        if (this.hawkingInterval) {
            clearInterval(this.hawkingInterval);
        }
    }
}

// 注册到全局
window.GravityScene = GravityScene;
