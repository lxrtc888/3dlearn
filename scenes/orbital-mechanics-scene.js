/**
 * 天体运动与卫星变轨场景 - Orbital Mechanics Visualization
 * ============================================
 * 核心原理：
 * - 万有引力定律：F = GMm/r²
 * - 开普勒三定律
 * - 三个宇宙速度
 * - 卫星变轨（霍曼转移轨道）
 * - 圆周运动与椭圆轨道
 * ============================================
 * 高考必考知识点：
 * - 同步卫星条件
 * - 变轨加速/减速
 * - 近地点远地点速度比较
 * ============================================
 */
window.OrbitalMechanicsScene = class OrbitalMechanicsScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.earth = null;              // 地球
        this.satellite = null;          // 卫星
        this.moon = null;               // 月球（参考）
        this.orbits = [];               // 轨道线
        this.currentOrbit = null;       // 当前轨道
        this.transferOrbit = null;      // 转移轨道
        this.velocityArrow = null;      // 速度矢量
        this.gravityArrow = null;       // 引力矢量
        this.trailPoints = [];          // 轨迹点
        this.stars = null;              // 星空

        // 物理参数（归一化单位）
        this.params = {
            // 轨道半径（地球半径为1）
            earthRadius: 3,
            lowOrbitRadius: 4.5,        // 近地轨道
            geoOrbitRadius: 10,         // 同步轨道
            highOrbitRadius: 15,        // 高轨道
            moonOrbitRadius: 25,        // 月球轨道（示意）

            // 当前状态
            currentRadius: 4.5,         // 当前轨道半径
            targetRadius: 10,           // 目标轨道半径
            satelliteAngle: 0,          // 卫星角度
            satelliteSpeed: 1,          // 角速度
            
            // 变轨状态
            isTransferring: false,      // 是否正在变轨
            transferPhase: 0,           // 转移阶段 (0: 无, 1: 第一次加速, 2: 转移中, 3: 第二次加速)
            transferProgress: 0,        // 转移进度
            
            // 显示选项
            showVelocity: true,
            showGravity: true,
            showOrbits: true,
            
            // 动画
            timeScale: 1,
            isPaused: false
        };

        // 轨道颜色
        this.orbitColors = {
            low: 0x00ff88,      // 近地轨道 - 绿色
            geo: 0xffaa00,      // 同步轨道 - 橙色
            high: 0xff4466,     // 高轨道 - 红色
            transfer: 0x00d4ff  // 转移轨道 - 青色
        };

        // 自动播放
        this.isAutoPlaying = false;

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 25, z: 35 };
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

        // 背景 - 深空
        this.scene.background = new THREE.Color(0x000510);
        this.scene.fog = null; // 太空无雾

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
        // 太阳光（主光源）
        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(50, 30, 50);
        sunLight.castShadow = true;
        this.scene.add(sunLight);

        // 环境光（模拟散射）
        const ambient = new THREE.AmbientLight(0x222244, 0.3);
        this.scene.add(ambient);

        // 地球反射光
        const earthGlow = new THREE.PointLight(0x4488ff, 0.5, 30);
        earthGlow.position.set(0, 0, 0);
        this.scene.add(earthGlow);
    }

    /**
     * 创建场景内容
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建星空背景
        this.createStarField();

        // 创建地球
        this.createEarth();

        // 创建轨道
        this.createOrbits();

        // 创建卫星
        this.createSatellite();

        // 创建速度和引力箭头
        this.createVectors();

        // 创建信息标签
        this.createLabels();

        // 创建公式面板
        this.createFormulaPanel();
    }

    /**
     * 创建星空
     */
    createStarField() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            // 球形分布
            const r = 80 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = r * Math.cos(phi);

            // 随机颜色（白色为主，少量蓝/黄）
            const colorChoice = Math.random();
            if (colorChoice > 0.95) {
                colors[i] = 0.8; colors[i + 1] = 0.9; colors[i + 2] = 1; // 蓝
            } else if (colorChoice > 0.9) {
                colors[i] = 1; colors[i + 1] = 0.95; colors[i + 2] = 0.8; // 黄
            } else {
                colors[i] = 1; colors[i + 1] = 1; colors[i + 2] = 1; // 白
            }
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.stars = new THREE.Points(starGeo, starMat);
        this.scene.add(this.stars);
    }

    /**
     * 创建地球
     */
    createEarth() {
        const R = this.params.earthRadius;

        // 地球本体
        const earthGeo = new THREE.SphereGeometry(R, 64, 64);
        
        // 创建程序化纹理
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // 海洋背景
        const gradient = ctx.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, '#1a4a7a');
        gradient.addColorStop(0.5, '#2266aa');
        gradient.addColorStop(1, '#1a4a7a');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 512, 256);
        
        // 大陆（简化）
        ctx.fillStyle = '#2a8a4a';
        // 亚欧大陆
        ctx.beginPath();
        ctx.ellipse(300, 100, 80, 40, 0.2, 0, Math.PI * 2);
        ctx.fill();
        // 非洲
        ctx.beginPath();
        ctx.ellipse(280, 150, 30, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        // 美洲
        ctx.beginPath();
        ctx.ellipse(100, 110, 25, 60, -0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(120, 180, 35, 40, 0.5, 0, Math.PI * 2);
        ctx.fill();
        // 澳洲
        ctx.beginPath();
        ctx.ellipse(420, 170, 25, 20, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 极地冰盖
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 512, 20);
        ctx.fillRect(0, 236, 512, 20);

        const earthTexture = new THREE.CanvasTexture(canvas);
        
        const earthMat = new THREE.MeshStandardMaterial({
            map: earthTexture,
            metalness: 0.1,
            roughness: 0.8
        });

        this.earth = new THREE.Mesh(earthGeo, earthMat);
        this.mainGroup.add(this.earth);

        // 大气层光晕
        const atmosGeo = new THREE.SphereGeometry(R * 1.05, 32, 32);
        const atmosMat = new THREE.MeshBasicMaterial({
            color: 0x88aaff,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const atmosphere = new THREE.Mesh(atmosGeo, atmosMat);
        this.earth.add(atmosphere);

        // 地球交互
        this.earth.userData = {
            hoverTitle: '地球',
            hoverDesc: 'M = 5.97×10²⁴ kg, R = 6371 km',
            hoverIcon: 'fa-globe',
            name: '地球',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🌍 地球</p>
                <p class="text-gray-300 mb-3">卫星运动的中心天体。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">物理参数：</p>
                    <p class="text-sm text-white">质量 M = 5.97 × 10²⁴ kg</p>
                    <p class="text-sm text-white">半径 R = 6371 km</p>
                    <p class="text-sm text-white">表面重力加速度 g = 9.8 m/s²</p>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-yellow-400">⭐ 第一宇宙速度：</p>
                    <p class="text-sm text-white font-mono">v₁ = √(gR) ≈ 7.9 km/s</p>
                    <p class="text-xs text-gray-500 mt-1">绕地球表面做圆周运动的最小速度</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.earth);
    }

    /**
     * 创建轨道
     */
    createOrbits() {
        // 近地轨道
        const lowOrbit = this.createOrbitRing(
            this.params.lowOrbitRadius, 
            this.orbitColors.low, 
            '近地轨道 (LEO)'
        );
        lowOrbit.userData = {
            hoverTitle: '近地轨道',
            hoverDesc: '高度 200-2000 km',
            hoverIcon: 'fa-circle',
            name: '近地轨道 (LEO)',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">🛰️ 近地轨道</p>
                <p class="text-gray-300 mb-3">距地面 200-2000 km 的轨道。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">特点：</p>
                    <ul class="text-sm text-gray-300 list-disc ml-4">
                        <li>周期短（约90分钟）</li>
                        <li>速度快（~7.8 km/s）</li>
                        <li>受大气阻力影响</li>
                    </ul>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-cyan-400">应用：</p>
                    <p class="text-sm text-white">国际空间站、侦察卫星、星链</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(lowOrbit);
        this.orbits.push(lowOrbit);

        // 同步轨道
        const geoOrbit = this.createOrbitRing(
            this.params.geoOrbitRadius, 
            this.orbitColors.geo, 
            '地球同步轨道 (GEO)'
        );
        geoOrbit.userData = {
            hoverTitle: '同步轨道',
            hoverDesc: '高度 35786 km，周期24h',
            hoverIcon: 'fa-circle',
            name: '地球同步轨道 (GEO)',
            description: `
                <p class="text-lg font-bold text-orange-400 mb-3">📡 地球同步轨道</p>
                <p class="text-gray-300 mb-3">周期恰好等于地球自转周期的轨道。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">⭐ 高考重点：</p>
                    <p class="text-sm text-white">高度 h = 35786 km（约6R）</p>
                    <p class="text-sm text-white">周期 T = 24 h</p>
                    <p class="text-sm text-white">速度 v ≈ 3.07 km/s</p>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">同步卫星特点：</p>
                    <ul class="text-sm text-gray-300 list-disc ml-4">
                        <li>相对地面静止（赤道上空）</li>
                        <li>轨道半径、周期、速度都是定值</li>
                        <li>三颗可覆盖全球</li>
                    </ul>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(geoOrbit);
        this.orbits.push(geoOrbit);

        // 高轨道
        const highOrbit = this.createOrbitRing(
            this.params.highOrbitRadius, 
            this.orbitColors.high, 
            '高轨道'
        );
        this.orbits.push(highOrbit);

        // 当前轨道指示（卫星实际运行的轨道）
        this.currentOrbit = this.createOrbitRing(
            this.params.currentRadius,
            0x00ffff,
            '',
            true // 发光效果
        );
    }

    /**
     * 创建轨道环
     */
    createOrbitRing(radius, color, label, glow = false) {
        const group = new THREE.Group();

        // 轨道线
        const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
        const points = curve.getPoints(128);
        const geometry = new THREE.BufferGeometry().setFromPoints(
            points.map(p => new THREE.Vector3(p.x, 0, p.y))
        );

        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: glow ? 0.8 : 0.5,
            linewidth: glow ? 2 : 1
        });

        const orbitLine = new THREE.Line(geometry, material);
        group.add(orbitLine);

        // 发光效果
        if (glow) {
            const glowMat = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.2,
                linewidth: 4
            });
            const glowLine = new THREE.Line(geometry.clone(), glowMat);
            glowLine.scale.setScalar(1.02);
            group.add(glowLine);
        }

        // 标签
        if (label) {
            const labelSprite = this.create3DLabel(label, new THREE.Vector3(radius + 1, 1, 0), color);
            labelSprite.scale.set(4, 1, 1);
            group.add(labelSprite);
        }

        this.mainGroup.add(group);
        return orbitLine;
    }

    /**
     * 创建卫星
     */
    createSatellite() {
        const satGroup = new THREE.Group();

        // 卫星本体
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.4, 0.4);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            metalness: 0.8,
            roughness: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        satGroup.add(body);

        // 太阳能板
        const panelGeo = new THREE.BoxGeometry(1.5, 0.02, 0.6);
        const panelMat = new THREE.MeshStandardMaterial({
            color: 0x2244aa,
            metalness: 0.3,
            roughness: 0.5,
            emissive: 0x111133,
            emissiveIntensity: 0.3
        });
        
        const leftPanel = new THREE.Mesh(panelGeo, panelMat);
        leftPanel.position.set(-1.1, 0, 0);
        satGroup.add(leftPanel);

        const rightPanel = new THREE.Mesh(panelGeo, panelMat.clone());
        rightPanel.position.set(1.1, 0, 0);
        satGroup.add(rightPanel);

        // 天线
        const antennaGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.5, 8);
        const antennaMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const antenna = new THREE.Mesh(antennaGeo, antennaMat);
        antenna.position.set(0, 0.35, 0);
        satGroup.add(antenna);

        // 信号发射盘
        const dishGeo = new THREE.ConeGeometry(0.15, 0.1, 16);
        const dish = new THREE.Mesh(dishGeo, antennaMat);
        dish.position.set(0, -0.25, 0.25);
        dish.rotation.x = Math.PI / 2;
        satGroup.add(dish);

        // 推进器火焰（变轨时显示）
        const flameGeo = new THREE.ConeGeometry(0.15, 0.5, 8);
        const flameMat = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 0
        });
        const flame = new THREE.Mesh(flameGeo, flameMat);
        flame.position.set(0, 0, -0.4);
        flame.rotation.x = -Math.PI / 2;
        satGroup.add(flame);
        satGroup.userData.flame = flame;

        // 初始位置
        satGroup.position.set(this.params.currentRadius, 0, 0);
        
        this.satellite = satGroup;
        this.mainGroup.add(this.satellite);

        // 交互
        body.userData = {
            hoverTitle: '人造卫星',
            hoverDesc: '正在近地轨道运行',
            hoverIcon: 'fa-satellite',
            name: '人造卫星',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">🛰️ 人造卫星</p>
                <p class="text-gray-300 mb-3">绕地球运行的航天器。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">当前轨道参数：</p>
                    <p class="text-sm text-white" id="sat-orbit-info">近地轨道</p>
                    <p class="text-sm text-cyan-400" id="sat-speed-info">速度: ~7.8 km/s</p>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-yellow-400">⭐ 圆轨道公式：</p>
                    <p class="text-sm text-white font-mono">v = √(GM/r)</p>
                    <p class="text-sm text-white font-mono">T = 2π√(r³/GM)</p>
                    <p class="text-xs text-gray-500 mt-1">轨道越高，速度越慢，周期越长</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(body);

        // 创建轨迹
        this.createTrail();
    }

    /**
     * 创建卫星轨迹
     */
    createTrail() {
        const trailGeo = new THREE.BufferGeometry();
        const maxPoints = 200;
        const positions = new Float32Array(maxPoints * 3);
        trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trailGeo.setDrawRange(0, 0);

        const trailMat = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.5
        });

        this.trail = new THREE.Line(trailGeo, trailMat);
        this.mainGroup.add(this.trail);
        this.trailPoints = [];
    }

    /**
     * 创建速度和引力矢量
     */
    createVectors() {
        // 速度箭头（绿色，切向）
        this.velocityArrow = this.createArrow(0x00ff00, '速度 v');
        this.velocityArrow.userData = {
            hoverTitle: '速度矢量',
            hoverDesc: '沿轨道切线方向',
            hoverIcon: 'fa-arrow-right',
            name: '卫星速度 v',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">➡️ 速度矢量</p>
                <p class="text-gray-300 mb-3">卫星运动的瞬时速度，始终沿轨道切线方向。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">⭐ 圆轨道速度公式：</p>
                    <p class="text-sm text-white font-mono">v = √(GM/r)</p>
                    <p class="text-xs text-gray-500 mt-2">r增大 → v减小</p>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">变轨要点：</p>
                    <p class="text-sm text-green-400">加速 → 轨道升高</p>
                    <p class="text-sm text-red-400">减速 → 轨道降低</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.velocityArrow);

        // 引力箭头（红色，指向地心）
        this.gravityArrow = this.createArrow(0xff4444, '引力 F');
        this.gravityArrow.userData = {
            hoverTitle: '万有引力',
            hoverDesc: 'F = GMm/r²，指向地心',
            hoverIcon: 'fa-arrow-down',
            name: '万有引力 F',
            description: `
                <p class="text-lg font-bold text-red-400 mb-3">⬇️ 万有引力</p>
                <p class="text-gray-300 mb-3">地球对卫星的引力，始终指向地心。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">⭐ 万有引力公式：</p>
                    <p class="text-sm text-white font-mono">F = GMm/r²</p>
                    <p class="text-xs text-gray-500 mt-2">提供卫星做圆周运动的向心力</p>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-cyan-400">向心力关系：</p>
                    <p class="text-sm text-white font-mono">GMm/r² = mv²/r = mω²r</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.gravityArrow);
    }

    /**
     * 创建箭头
     */
    createArrow(color, label) {
        const group = new THREE.Group();

        // 箭头杆
        const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
        const shaftMat = new THREE.MeshBasicMaterial({ color });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        shaft.position.y = 1;
        group.add(shaft);

        // 箭头头
        const headGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
        const head = new THREE.Mesh(headGeo, shaftMat);
        head.position.y = 2.25;
        group.add(head);

        // 标签
        const labelSprite = this.create3DLabel(label, new THREE.Vector3(0, 2.8, 0), color);
        labelSprite.scale.set(2, 0.8, 1);
        group.add(labelSprite);

        this.mainGroup.add(group);
        return group;
    }

    /**
     * 创建信息标签
     */
    createLabels() {
        // 三个宇宙速度说明
        const cosmicLabel = this.create3DLabel(
            '🚀 三个宇宙速度：v₁=7.9  v₂=11.2  v₃=16.7 km/s',
            new THREE.Vector3(0, 12, 0),
            0xffd700
        );
        cosmicLabel.scale.set(10, 2, 1);
    }

    /**
     * 创建公式面板
     */
    createFormulaPanel() {
        // 霍曼转移轨道说明（变轨时显示）
        const transferLabel = this.create3DLabel(
            '霍曼转移：最省燃料的变轨方式',
            new THREE.Vector3(0, -8, 0),
            0x00d4ff
        );
        transferLabel.scale.set(8, 1.5, 1);
        transferLabel.visible = false;
        this.transferLabel = transferLabel;
    }

    /**
     * 创建3D标签
     */
    create3DLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(4, 4, 504, 120, 12);
        ctx.fill();

        ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 256, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(position);

        this.mainGroup.add(sprite);
        return sprite;
    }

    /**
     * 执行变轨
     */
    performTransfer(targetType) {
        if (this.params.isTransferring) return;

        let targetRadius;
        let targetName;

        switch (targetType) {
            case 'low':
                targetRadius = this.params.lowOrbitRadius;
                targetName = '近地轨道';
                break;
            case 'geo':
                targetRadius = this.params.geoOrbitRadius;
                targetName = '同步轨道';
                break;
            case 'high':
                targetRadius = this.params.highOrbitRadius;
                targetName = '高轨道';
                break;
            default:
                return;
        }

        if (Math.abs(targetRadius - this.params.currentRadius) < 0.5) {
            this.showTeachingGuide('⚠️ 已经在该轨道上！');
            return;
        }

        this.params.isTransferring = true;
        this.params.targetRadius = targetRadius;
        this.params.transferProgress = 0;
        this.transferLabel.visible = true;

        const isAscending = targetRadius > this.params.currentRadius;
        
        // 第一次点火
        this.showTeachingGuide(
            isAscending 
                ? `🚀 第一次点火加速！进入转移轨道，向${targetName}爬升...`
                : `🚀 第一次点火减速！进入转移轨道，向${targetName}下降...`
        );

        // 显示推进器火焰
        this.showThrusterFlame(true);

        // 动画变轨
        const duration = 3000;
        const startRadius = this.params.currentRadius;
        const startAngle = this.params.satelliteAngle;
        const startTime = performance.now();

        const animateTransfer = () => {
            const elapsed = performance.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 椭圆转移轨道
            const t = progress * Math.PI; // 半个椭圆
            const a = (startRadius + targetRadius) / 2; // 半长轴
            const c = Math.abs(targetRadius - startRadius) / 2; // 焦距
            const b = Math.sqrt(a * a - c * c); // 半短轴

            // 计算椭圆轨道位置
            const r = a * (1 - (c / a) * (c / a)) / (1 + (c / a) * Math.cos(t));
            
            // 更新卫星位置
            this.params.satelliteAngle = startAngle + progress * Math.PI;
            
            // 使用插值平滑过渡
            const currentR = THREE.MathUtils.lerp(startRadius, targetRadius, progress);
            
            if (progress < 1) {
                this.params.transferProgress = progress;
                requestAnimationFrame(animateTransfer);
            } else {
                // 变轨完成
                this.params.currentRadius = targetRadius;
                this.params.isTransferring = false;
                this.transferLabel.visible = false;
                this.showThrusterFlame(false);

                // 更新当前轨道显示
                this.updateCurrentOrbit();

                this.showTeachingGuide(
                    `✅ 变轨完成！已进入${targetName}，速度${isAscending ? '降低' : '升高'}，周期${isAscending ? '增大' : '减小'}`
                );
            }
        };

        animateTransfer();
    }

    /**
     * 显示/隐藏推进器火焰
     */
    showThrusterFlame(show) {
        const flame = this.satellite.userData.flame;
        if (flame) {
            gsap.to(flame.material, {
                opacity: show ? 0.8 : 0,
                duration: 0.3
            });
        }
    }

    /**
     * 更新当前轨道显示
     */
    updateCurrentOrbit() {
        // 移除旧轨道
        if (this.currentOrbit) {
            this.mainGroup.remove(this.currentOrbit.parent);
        }

        // 创建新轨道
        this.currentOrbit = this.createOrbitRing(
            this.params.currentRadius,
            0x00ffff,
            '',
            true
        );
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-intro">
                <i class="fas fa-info"></i> 原理介绍
            </button>
            <button class="control-btn" id="btn-to-low">
                <i class="fas fa-arrow-down"></i> 降至近地
            </button>
            <button class="control-btn active" id="btn-to-geo">
                <i class="fas fa-satellite"></i> 升至同步
            </button>
            <button class="control-btn" id="btn-to-high">
                <i class="fas fa-arrow-up"></i> 升至高轨
            </button>
            <button class="control-btn" id="btn-pause">
                <i class="fas fa-pause"></i> 暂停
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;

        document.getElementById('btn-intro').onclick = () => this.showIntroduction();
        document.getElementById('btn-to-low').onclick = () => this.performTransfer('low');
        document.getElementById('btn-to-geo').onclick = () => this.performTransfer('geo');
        document.getElementById('btn-to-high').onclick = () => this.performTransfer('high');
        document.getElementById('btn-pause').onclick = () => this.togglePause();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    /**
     * 暂停/继续
     */
    togglePause() {
        this.params.isPaused = !this.params.isPaused;
        const btn = document.getElementById('btn-pause');
        btn.innerHTML = this.params.isPaused
            ? '<i class="fas fa-play"></i> 继续'
            : '<i class="fas fa-pause"></i> 暂停';
    }

    /**
     * 显示介绍
     */
    showIntroduction() {
        this.showTeachingGuide('🌍 卫星绕地球做圆周运动，万有引力提供向心力');
        setTimeout(() => {
            this.showTeachingGuide('📐 公式：GMm/r² = mv²/r → v = √(GM/r)');
        }, 4000);
        setTimeout(() => {
            this.showTeachingGuide('⭐ 轨道越高 → 速度越慢 → 周期越长');
        }, 8000);
        setTimeout(() => {
            this.showTeachingGuide('🚀 变轨：加速→升轨，减速→降轨（霍曼转移）');
        }, 12000);
    }

    /**
     * 显示教学引导
     */
    showTeachingGuide(message) {
        const container = document.getElementById('scene-canvas-container');
        const old = container.querySelector('.scene-guide-message');
        if (old) old.remove();

        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        container.appendChild(guide);

        setTimeout(() => guide.classList.add('visible'), 100);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 300);
        }, 3500);
    }

    /**
     * 初始引导
     */
    showInitialGuide() {
        setTimeout(() => {
            this.showTeachingGuide('💡 拖动鼠标旋转视角，滚轮缩放');
        }, 1000);
        setTimeout(() => {
            this.showTeachingGuide('👆 点击轨道或卫星查看详细信息');
        }, 4000);
    }

    /**
     * 重置视角
     */
    resetView() {
        gsap.to(this.camera.position, {
            x: this.defaultCameraPos.x,
            y: this.defaultCameraPos.y,
            z: this.defaultCameraPos.z,
            duration: 0.8,
            ease: 'power2.out'
        });
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 高亮对象
     */
    highlightObject(target) {
        if (this.highlighted && this.highlighted.material && this.highlighted.material.emissive) {
            this.highlighted.material.emissive.setHex(
                this.highlighted.userData.originalEmissive || 0
            );
        }

        if (target.material && target.material.emissive) {
            target.userData.originalEmissive = target.material.emissive.getHex();
            target.material.emissive.setHex(0x00ffff);
        }
        this.highlighted = target;

        gsap.to(target.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
    }

    /**
     * 显示信息面板
     */
    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        title.innerHTML = `<i class="fas fa-satellite mr-2"></i>${target.userData.name}`;
        content.innerHTML = target.userData.description;

        panel.classList.add('visible');
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        this.isAutoPlaying = true;
        setTimeout(() => {
            if (this.isAutoPlaying) {
                this.showIntroduction();
            }
        }, 500);
    }

    /**
     * 动画循环
     */
    animate(time, delta) {
        if (this.params.isPaused) return;

        // 地球自转
        if (this.earth) {
            this.earth.rotation.y += delta * 0.1;
        }

        // 卫星公转
        if (this.satellite && !this.params.isTransferring) {
            // 角速度与轨道半径关系：ω ∝ r^(-1.5)（开普勒第三定律）
            const baseSpeed = 0.5;
            const r = this.params.currentRadius;
            const refR = this.params.lowOrbitRadius;
            this.params.satelliteSpeed = baseSpeed * Math.pow(refR / r, 1.5);

            this.params.satelliteAngle += delta * this.params.satelliteSpeed * this.params.timeScale;

            // 更新卫星位置
            const x = r * Math.cos(this.params.satelliteAngle);
            const z = r * Math.sin(this.params.satelliteAngle);
            this.satellite.position.set(x, 0, z);

            // 卫星朝向运动方向
            this.satellite.rotation.y = -this.params.satelliteAngle + Math.PI / 2;
        }

        // 变轨时更新卫星位置
        if (this.params.isTransferring) {
            const progress = this.params.transferProgress;
            const startR = this.params.currentRadius;
            const targetR = this.params.targetRadius;
            
            // 椭圆插值
            const currentR = startR + (targetR - startR) * progress;
            
            const x = currentR * Math.cos(this.params.satelliteAngle);
            const z = currentR * Math.sin(this.params.satelliteAngle);
            this.satellite.position.set(x, 0, z);
            this.satellite.rotation.y = -this.params.satelliteAngle + Math.PI / 2;
        }

        // 更新速度箭头（切向）
        if (this.velocityArrow && this.satellite) {
            const pos = this.satellite.position.clone();
            this.velocityArrow.position.copy(pos);
            this.velocityArrow.position.y += 1;
            
            // 切向（垂直于径向）
            const tangentAngle = this.params.satelliteAngle + Math.PI / 2;
            this.velocityArrow.rotation.z = 0;
            this.velocityArrow.rotation.x = -Math.PI / 2;
            this.velocityArrow.rotation.y = -tangentAngle;
        }

        // 更新引力箭头（指向地心）
        if (this.gravityArrow && this.satellite) {
            const pos = this.satellite.position.clone();
            this.gravityArrow.position.copy(pos);
            this.gravityArrow.position.y -= 0.5;
            
            // 指向地心
            this.gravityArrow.rotation.x = Math.PI / 2;
            this.gravityArrow.rotation.y = 0;
            this.gravityArrow.rotation.z = this.params.satelliteAngle + Math.PI;
        }

        // 更新轨迹
        if (this.trail && this.satellite) {
            this.trailPoints.push(this.satellite.position.clone());
            if (this.trailPoints.length > 200) {
                this.trailPoints.shift();
            }

            const positions = this.trail.geometry.attributes.position.array;
            for (let i = 0; i < this.trailPoints.length; i++) {
                positions[i * 3] = this.trailPoints[i].x;
                positions[i * 3 + 1] = this.trailPoints[i].y;
                positions[i * 3 + 2] = this.trailPoints[i].z;
            }
            this.trail.geometry.attributes.position.needsUpdate = true;
            this.trail.geometry.setDrawRange(0, this.trailPoints.length);
        }

        // 星空缓慢旋转
        if (this.stars) {
            this.stars.rotation.y += delta * 0.01;
        }
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return this.interactables;
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        if (this.stars) this.scene.remove(this.stars);
        this.interactables = [];
        this.trailPoints = [];
    }

    /**
     * 点击背景
     */
    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');

        if (this.highlighted && this.highlighted.material && this.highlighted.material.emissive) {
            this.highlighted.material.emissive.setHex(
                this.highlighted.userData.originalEmissive || 0
            );
            this.highlighted = null;
        }
    }
};
