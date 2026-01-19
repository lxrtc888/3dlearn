/**
 * 量子纠缠场景 - Quantum Entanglement Visualization
 * ============================================
 * 核心原理：
 * - 量子纠缠：两个粒子形成纠缠态，测量一个立即影响另一个
 * - EPR佯谬：爱因斯坦认为这是"幽灵般的超距作用"
 * - 贝尔不等式：证明量子力学的非定域性
 * - 量子通信：利用纠缠实现安全通信
 * ============================================
 */
window.QuantumEntanglementScene = class QuantumEntanglementScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.particleA = null;          // 粒子A
        this.particleB = null;          // 粒子B
        this.entanglementLink = null;   // 纠缠连接线
        this.spinArrowA = null;         // A的自旋箭头
        this.spinArrowB = null;         // B的自旋箭头
        this.detectorA = null;          // 探测器A
        this.detectorB = null;          // 探测器B
        this.waveParticles = [];        // 波函数粒子
        this.photons = [];              // 纠缠光子对

        // 场景参数
        this.params = {
            isEntangled: true,           // 是否处于纠缠态
            spinA: null,                 // A的自旋状态 (null=叠加态, 'up', 'down')
            spinB: null,                 // B的自旋状态
            separation: 8,               // 粒子间距
            animationPhase: 0,           // 动画相位
            measurementInProgress: false // 是否正在测量
        };

        // 自动播放
        this.isAutoPlaying = false;

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 8, z: 25 };
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
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.FogExp2(0x050510, 0.015);

        // 光照
        this.setupLights();

        // 地面网格
        const grid = new THREE.GridHelper(60, 60, 0x1a1a3e, 0x0a0a1e);
        grid.position.y = -5;
        this.scene.add(grid);

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
        const ambient = new THREE.AmbientLight(0x222244, 0.5);
        this.scene.add(ambient);

        // 主方向光
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 10);
        mainLight.castShadow = true;
        this.scene.add(mainLight);

        // 紫色点光源（量子氛围）
        const purpleLight = new THREE.PointLight(0x8b5cf6, 2, 40);
        purpleLight.position.set(-10, 5, 0);
        this.scene.add(purpleLight);

        // 青色点光源
        const cyanLight = new THREE.PointLight(0x00d4ff, 2, 40);
        cyanLight.position.set(10, 5, 0);
        this.scene.add(cyanLight);
    }

    /**
     * 创建场景内容
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.mainGroup.position.set(0, 0, 0);
        this.scene.add(this.mainGroup);

        // 创建纠缠粒子对
        this.createEntangledParticles();

        // 创建纠缠连接
        this.createEntanglementLink();

        // 创建探测器
        this.createDetectors();

        // 创建波函数可视化
        this.createWaveFunction();

        // 创建标签
        this.createLabels();

        // 创建背景星空
        this.createStarField();
    }

    /**
     * 创建纠缠粒子对
     */
    createEntangledParticles() {
        // 粒子材质 - 发光效果
        const particleMaterialA = new THREE.MeshPhysicalMaterial({
            color: 0x00d4ff,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.8,
            metalness: 0.3,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });

        const particleMaterialB = new THREE.MeshPhysicalMaterial({
            color: 0xff6b9d,
            emissive: 0xff6b9d,
            emissiveIntensity: 0.8,
            metalness: 0.3,
            roughness: 0.2,
            transparent: true,
            opacity: 0.9
        });

        // 粒子A（左侧）
        const particleGeo = new THREE.SphereGeometry(1, 32, 32);
        this.particleA = new THREE.Mesh(particleGeo, particleMaterialA);
        this.particleA.position.set(-this.params.separation, 0, 0);
        this.mainGroup.add(this.particleA);

        // 粒子A光晕
        const glowGeoA = new THREE.SphereGeometry(1.5, 32, 32);
        const glowMatA = new THREE.MeshBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.2
        });
        const glowA = new THREE.Mesh(glowGeoA, glowMatA);
        this.particleA.add(glowA);

        // 粒子B（右侧）
        this.particleB = new THREE.Mesh(particleGeo.clone(), particleMaterialB);
        this.particleB.position.set(this.params.separation, 0, 0);
        this.mainGroup.add(this.particleB);

        // 粒子B光晕
        const glowMatB = new THREE.MeshBasicMaterial({
            color: 0xff6b9d,
            transparent: true,
            opacity: 0.2
        });
        const glowB = new THREE.Mesh(glowGeoA.clone(), glowMatB);
        this.particleB.add(glowB);

        // 创建自旋箭头
        this.createSpinArrows();

        // 交互数据 - 粒子A
        this.particleA.userData = {
            hoverTitle: '粒子 A（电子）',
            hoverDesc: '自旋处于叠加态 |↑⟩+|↓⟩',
            hoverIcon: 'fa-atom',
            name: '纠缠粒子 A',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">⚛️ 纠缠粒子 A</p>
                <p class="text-gray-300 mb-3">与粒子B形成量子纠缠态的电子。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">当前状态：</p>
                    <p class="text-sm text-cyan-400" id="spin-a-state">叠加态 |↑⟩ + |↓⟩</p>
                    <p class="text-xs text-gray-500 mt-2">测量前，自旋同时处于"上"和"下"的叠加</p>
                </div>
                <p class="text-sm text-purple-400">🔮 测量A会瞬间决定B的状态！</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.particleA);

        // 交互数据 - 粒子B
        this.particleB.userData = {
            hoverTitle: '粒子 B（电子）',
            hoverDesc: '与A纠缠，自旋相反',
            hoverIcon: 'fa-atom',
            name: '纠缠粒子 B',
            description: `
                <p class="text-lg font-bold text-pink-400 mb-3">⚛️ 纠缠粒子 B</p>
                <p class="text-gray-300 mb-3">与粒子A形成单态纠缠的电子。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">纠缠态波函数：</p>
                    <p class="text-sm text-white font-mono">|ψ⟩ = (|↑↓⟩ - |↓↑⟩)/√2</p>
                    <p class="text-xs text-gray-500 mt-2">单态：总自旋为0，A和B自旋始终相反</p>
                </div>
                <p class="text-sm text-yellow-400">⚡ 无论相距多远，测量结果瞬间关联！</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.particleB);
    }

    /**
     * 创建自旋箭头
     */
    createSpinArrows() {
        const arrowMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

        // 粒子A的自旋箭头容器
        this.spinArrowA = new THREE.Group();
        this.spinArrowA.position.set(0, 0, 0);
        this.particleA.add(this.spinArrowA);

        // 箭头杆
        const shaftGeo = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
        const shaftA = new THREE.Mesh(shaftGeo, arrowMat.clone());
        shaftA.position.y = 0.75;
        this.spinArrowA.add(shaftA);

        // 箭头头
        const headGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
        const headA = new THREE.Mesh(headGeo, arrowMat.clone());
        headA.position.y = 1.75;
        this.spinArrowA.add(headA);

        // 粒子B的自旋箭头
        this.spinArrowB = new THREE.Group();
        this.spinArrowB.position.set(0, 0, 0);
        this.particleB.add(this.spinArrowB);

        const shaftB = new THREE.Mesh(shaftGeo.clone(), arrowMat.clone());
        shaftB.position.y = 0.75;
        this.spinArrowB.add(shaftB);

        const headB = new THREE.Mesh(headGeo.clone(), arrowMat.clone());
        headB.position.y = 1.75;
        this.spinArrowB.add(headB);

        // 初始状态：箭头快速旋转表示叠加态
        this.spinArrowA.userData.isCollapsed = false;
        this.spinArrowB.userData.isCollapsed = false;
    }

    /**
     * 创建纠缠连接线
     */
    createEntanglementLink() {
        // 使用多个小球创建动态连接效果
        const linkGroup = new THREE.Group();

        for (let i = 0; i < 30; i++) {
            const geo = new THREE.SphereGeometry(0.1, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.8 - i * 0.02, 1, 0.6),
                transparent: true,
                opacity: 0.6
            });
            const dot = new THREE.Mesh(geo, mat);
            dot.userData.index = i;
            dot.userData.offset = (i / 30) * Math.PI * 2;
            linkGroup.add(dot);
        }

        this.entanglementLink = linkGroup;
        this.mainGroup.add(this.entanglementLink);

        // 添加交互
        const linkHitbox = new THREE.Mesh(
            new THREE.BoxGeometry(16, 2, 2),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        linkHitbox.position.y = 0;
        linkHitbox.userData = {
            hoverTitle: '量子纠缠',
            hoverDesc: '"幽灵般的超距作用"',
            hoverIcon: 'fa-link',
            name: '量子纠缠连接',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">🔗 量子纠缠</p>
                <p class="text-gray-300 mb-3">两个粒子形成一个不可分的量子系统。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">爱因斯坦称之为：</p>
                    <p class="text-sm text-white italic">"Spooky action at a distance"</p>
                    <p class="text-xs text-gray-500 mt-2">（幽灵般的超距作用）</p>
                </div>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">关键特性：</p>
                    <ul class="text-sm text-gray-300 list-disc ml-4">
                        <li>非定域性：不受距离限制</li>
                        <li>即时关联：测量结果瞬间确定</li>
                        <li>不可克隆：无法复制量子态</li>
                    </ul>
                </div>
                <p class="text-sm text-cyan-400">🚀 量子通信和量子计算的基础！</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(linkHitbox);
        this.mainGroup.add(linkHitbox);
    }

    /**
     * 创建探测器
     */
    createDetectors() {
        const detectorGeo = new THREE.CylinderGeometry(1.5, 2, 3, 6);
        const detectorMat = new THREE.MeshStandardMaterial({
            color: 0x444466,
            metalness: 0.8,
            roughness: 0.3,
            emissive: 0x111122,
            emissiveIntensity: 0.3
        });

        // 探测器A
        this.detectorA = new THREE.Mesh(detectorGeo, detectorMat.clone());
        this.detectorA.position.set(-this.params.separation - 5, -3, 0);
        this.detectorA.rotation.x = -Math.PI / 6;
        this.mainGroup.add(this.detectorA);

        // 探测器指示灯A
        const indicatorGeoA = new THREE.SphereGeometry(0.3, 16, 16);
        const indicatorMatA = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const indicatorA = new THREE.Mesh(indicatorGeoA, indicatorMatA);
        indicatorA.position.y = 1.8;
        this.detectorA.add(indicatorA);
        this.detectorA.userData.indicator = indicatorA;

        // 探测器B
        this.detectorB = new THREE.Mesh(detectorGeo.clone(), detectorMat.clone());
        this.detectorB.position.set(this.params.separation + 5, -3, 0);
        this.detectorB.rotation.x = -Math.PI / 6;
        this.mainGroup.add(this.detectorB);

        // 探测器指示灯B
        const indicatorB = new THREE.Mesh(indicatorGeoA.clone(), indicatorMatA.clone());
        indicatorB.position.y = 1.8;
        this.detectorB.add(indicatorB);
        this.detectorB.userData.indicator = indicatorB;

        // 交互 - 探测器A
        this.detectorA.userData = {
            hoverTitle: '探测器 A',
            hoverDesc: '测量粒子A的自旋',
            hoverIcon: 'fa-search',
            name: '自旋探测器 A',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">🔬 探测器 A</p>
                <p class="text-gray-300 mb-3">Stern-Gerlach装置，测量电子自旋。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">测量原理：</p>
                    <p class="text-sm text-white">非均匀磁场使自旋"上"和"下"的电子分离</p>
                </div>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">测量导致波函数坍缩：</p>
                    <p class="text-sm text-gray-300">叠加态 → 确定态</p>
                    <p class="text-xs text-gray-500">50% 概率测得 ↑，50% 测得 ↓</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.detectorA);

        // 交互 - 探测器B
        this.detectorB.userData = {
            hoverTitle: '探测器 B',
            hoverDesc: '测量粒子B的自旋',
            hoverIcon: 'fa-search',
            name: '自旋探测器 B',
            description: `
                <p class="text-lg font-bold text-pink-400 mb-3">🔬 探测器 B</p>
                <p class="text-gray-300 mb-3">与探测器A相同的测量装置。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-purple-400">纠缠的魔力：</p>
                    <p class="text-sm text-white">无论B距离A多远（哪怕在银河系另一端）</p>
                    <p class="text-sm text-yellow-400">测量A后，B的结果立即确定！</p>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">注意：</p>
                    <p class="text-xs text-gray-500">这不能用于超光速通信，因为测量结果是随机的</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.detectorB);
    }

    /**
     * 创建波函数可视化
     */
    createWaveFunction() {
        // 围绕两个粒子的概率云
        for (let i = 0; i < 80; i++) {
            const geo = new THREE.SphereGeometry(0.05, 6, 6);
            const mat = new THREE.MeshBasicMaterial({
                color: i < 40 ? 0x00d4ff : 0xff6b9d,
                transparent: true,
                opacity: 0.4
            });
            const particle = new THREE.Mesh(geo, mat);

            // 随机分布在粒子周围
            const center = i < 40 ? -this.params.separation : this.params.separation;
            particle.userData.center = center;
            particle.userData.offset = Math.random() * Math.PI * 2;
            particle.userData.radius = 1.5 + Math.random() * 1;
            particle.userData.speed = 0.5 + Math.random() * 0.5;
            particle.userData.yOffset = (Math.random() - 0.5) * 2;

            this.waveParticles.push(particle);
            this.mainGroup.add(particle);
        }
    }

    /**
     * 创建标签
     */
    createLabels() {
        // 主标题
        const titleLabel = this.create3DLabel(
            '量子纠缠 |ψ⟩ = (|↑↓⟩ - |↓↑⟩)/√2',
            new THREE.Vector3(0, 6, 0),
            0xa855f7
        );
        titleLabel.scale.set(8, 2, 1);

        // 粒子A标签
        const labelA = this.create3DLabel('Alice', new THREE.Vector3(-this.params.separation, -3, 0), 0x00d4ff);
        labelA.scale.set(3, 1.5, 1);

        // 粒子B标签
        const labelB = this.create3DLabel('Bob', new THREE.Vector3(this.params.separation, -3, 0), 0xff6b9d);
        labelB.scale.set(3, 1.5, 1);
    }

    /**
     * 创建3D标签
     */
    create3DLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(8, 8, 496, 112, 16);
        ctx.fill();

        // 边框
        ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Arial';
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
     * 创建星空背景
     */
    createStarField() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 500;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 100;
            positions[i + 1] = (Math.random() - 0.5) * 60 + 10;
            positions[i + 2] = (Math.random() - 0.5) * 100 - 30;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.6
        });

        const stars = new THREE.Points(starGeo, starMat);
        this.scene.add(stars);
    }

    /**
     * 执行测量
     */
    performMeasurement() {
        if (this.params.measurementInProgress) return;
        this.params.measurementInProgress = true;

        this.showTeachingGuide('🎲 正在测量粒子A的自旋...');

        // 随机决定测量结果
        const resultA = Math.random() > 0.5 ? 'up' : 'down';
        const resultB = resultA === 'up' ? 'down' : 'up'; // 单态纠缠，自旋相反

        // 粒子飞向探测器的动画
        gsap.to(this.particleA.position, {
            x: -this.params.separation - 3,
            duration: 0.8,
            ease: 'power2.in',
            onComplete: () => {
                // A测量完成
                this.params.spinA = resultA;
                this.collapseSpinArrow(this.spinArrowA, resultA, 0x00d4ff);
                this.flashIndicator(this.detectorA, resultA === 'up' ? 0x00ff00 : 0xff0000);

                this.showTeachingGuide(`✨ A测得自旋${resultA === 'up' ? '向上 ↑' : '向下 ↓'}！B立即确定为${resultB === 'up' ? '向上 ↑' : '向下 ↓'}！`);

                // 同时B也坍缩
                setTimeout(() => {
                    this.params.spinB = resultB;
                    this.collapseSpinArrow(this.spinArrowB, resultB, 0xff6b9d);
                    this.flashIndicator(this.detectorB, resultB === 'up' ? 0x00ff00 : 0xff0000);

                    // 断开纠缠连接
                    this.params.isEntangled = false;
                    gsap.to(this.entanglementLink.scale, {
                        x: 0.01,
                        duration: 0.5
                    });

                    this.params.measurementInProgress = false;
                }, 500);
            }
        });

        gsap.to(this.particleB.position, {
            x: this.params.separation + 3,
            duration: 0.8,
            ease: 'power2.in'
        });
    }

    /**
     * 坍缩自旋箭头
     */
    collapseSpinArrow(arrow, direction, color) {
        arrow.userData.isCollapsed = true;

        // 停止旋转，指向确定方向
        gsap.to(arrow.rotation, {
            x: 0,
            y: 0,
            z: direction === 'up' ? 0 : Math.PI,
            duration: 0.3
        });

        // 改变颜色
        arrow.children.forEach(child => {
            if (child.material) {
                child.material.color.setHex(direction === 'up' ? 0x00ff00 : 0xff4444);
            }
        });

        // 缩放动画
        gsap.to(arrow.scale, {
            x: 1.5, y: 1.5, z: 1.5,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });
    }

    /**
     * 闪烁探测器指示灯
     */
    flashIndicator(detector, color) {
        const indicator = detector.userData.indicator;
        if (!indicator) return;

        indicator.material.color.setHex(color);
        gsap.to(indicator.scale, {
            x: 2, y: 2, z: 2,
            duration: 0.3,
            yoyo: true,
            repeat: 3
        });
    }

    /**
     * 重置实验
     */
    resetExperiment() {
        // 重置参数
        this.params.spinA = null;
        this.params.spinB = null;
        this.params.isEntangled = true;

        // 重置粒子位置
        gsap.to(this.particleA.position, {
            x: -this.params.separation,
            duration: 0.5
        });

        gsap.to(this.particleB.position, {
            x: this.params.separation,
            duration: 0.5
        });

        // 重置自旋箭头
        this.spinArrowA.userData.isCollapsed = false;
        this.spinArrowB.userData.isCollapsed = false;

        this.spinArrowA.children.forEach(child => {
            if (child.material) child.material.color.setHex(0xffffff);
        });
        this.spinArrowB.children.forEach(child => {
            if (child.material) child.material.color.setHex(0xffffff);
        });

        // 重置纠缠连接
        gsap.to(this.entanglementLink.scale, {
            x: 1,
            duration: 0.5
        });

        // 重置探测器指示灯
        if (this.detectorA.userData.indicator) {
            this.detectorA.userData.indicator.material.color.setHex(0x333333);
        }
        if (this.detectorB.userData.indicator) {
            this.detectorB.userData.indicator.material.color.setHex(0x333333);
        }

        this.showTeachingGuide('🔄 实验重置！粒子重新进入纠缠态');
    }

    /**
     * 调整粒子间距
     */
    adjustSeparation(delta) {
        this.params.separation = Math.max(5, Math.min(15, this.params.separation + delta));

        gsap.to(this.particleA.position, {
            x: -this.params.separation,
            duration: 0.5
        });

        gsap.to(this.particleB.position, {
            x: this.params.separation,
            duration: 0.5
        });

        const distance = this.params.separation * 2;
        this.showTeachingGuide(`📏 粒子间距: ${distance} 单位 - 无论多远，纠缠效应都是即时的！`);
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
            <button class="control-btn active" id="btn-measure">
                <i class="fas fa-search"></i> 测量粒子A
            </button>
            <button class="control-btn" id="btn-separate">
                <i class="fas fa-arrows-alt-h"></i> 拉远粒子
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-sync"></i> 重置实验
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;

        document.getElementById('btn-intro').onclick = () => this.showIntroduction();
        document.getElementById('btn-measure').onclick = () => this.performMeasurement();
        document.getElementById('btn-separate').onclick = () => this.adjustSeparation(3);
        document.getElementById('btn-reset').onclick = () => this.resetExperiment();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    /**
     * 显示介绍
     */
    showIntroduction() {
        this.showTeachingGuide('🔮 量子纠缠：两个粒子形成一个不可分的量子系统');
        setTimeout(() => {
            this.showTeachingGuide('⚛️ 测量其中一个粒子，另一个粒子的状态会立即确定');
        }, 4000);
        setTimeout(() => {
            this.showTeachingGuide('🚀 爱因斯坦称之为"幽灵般的超距作用"');
        }, 8000);
        setTimeout(() => {
            this.showTeachingGuide('💡 点击"测量粒子A"按钮观察波函数坍缩！');
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
            this.showTeachingGuide('👆 点击粒子或探测器查看详细说明');
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

        gsap.to(target.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.15, yoyo: true, repeat: 1 });
    }

    /**
     * 显示信息面板
     */
    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        title.innerHTML = `<i class="fas fa-atom mr-2"></i>${target.userData.name}`;
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
     * 切换自动播放
     */
    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
    }

    /**
     * 动画循环
     */
    animate(time, delta) {
        this.params.animationPhase = time;

        // 纠缠连接动画
        if (this.params.isEntangled && this.entanglementLink) {
            this.entanglementLink.children.forEach((dot, i) => {
                const t = (i / 30);
                const x = THREE.MathUtils.lerp(
                    -this.params.separation,
                    this.params.separation,
                    t
                );
                const y = Math.sin(time * 3 + dot.userData.offset) * 0.5;
                const z = Math.cos(time * 2 + dot.userData.offset) * 0.3;

                dot.position.set(x, y, z);
                dot.material.opacity = 0.4 + Math.sin(time * 5 + i * 0.3) * 0.3;
            });
        }

        // 自旋箭头旋转（叠加态时）
        if (!this.spinArrowA.userData.isCollapsed) {
            this.spinArrowA.rotation.x = Math.sin(time * 8) * 0.5;
            this.spinArrowA.rotation.z = Math.cos(time * 6) * 0.5;
        }
        if (!this.spinArrowB.userData.isCollapsed) {
            this.spinArrowB.rotation.x = Math.sin(time * 8 + Math.PI) * 0.5;
            this.spinArrowB.rotation.z = Math.cos(time * 6 + Math.PI) * 0.5;
        }

        // 粒子呼吸效果
        const breathe = 1 + Math.sin(time * 2) * 0.05;
        if (this.particleA) this.particleA.scale.setScalar(breathe);
        if (this.particleB) this.particleB.scale.setScalar(breathe);

        // 波函数粒子运动
        this.waveParticles.forEach((p, i) => {
            const angle = time * p.userData.speed + p.userData.offset;
            const r = p.userData.radius;
            p.position.x = p.userData.center + Math.cos(angle) * r;
            p.position.y = p.userData.yOffset + Math.sin(angle * 2) * 0.5;
            p.position.z = Math.sin(angle) * r * 0.5;
            p.material.opacity = 0.2 + Math.sin(time * 3 + i) * 0.2;
        });
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
        this.interactables = [];
        this.waveParticles = [];
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
