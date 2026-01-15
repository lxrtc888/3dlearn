/**
 * 液压系统场景 - 帕斯卡定律可视化 (增强交互版)
 * ============================================
 * 核心原理：
 * - 帕斯卡定律：密闭液体中压强均匀传递
 * - 面积放大原理：F2/F1 = A2/A1
 * - 能量守恒：W1 = W2，位移与面积成反比
 * ============================================
 */
window.HydraulicScene = class HydraulicScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 场景元素
        this.smallPiston = null;
        this.largePiston = null;
        this.fluid = null;
        this.pipes = [];
        this.gauges = [];
        this.particles = [];
        this.arrows = [];

        this.params = {
            pressure: 0,
            smallPistonY: 2,
            largePistonY: 0,
            isAnimating: false,
            force: 100 // 输入力 N
        };
        
        // 自动播放
        this.isAutoPlaying = false;
    }

    init() {
        // 相机
        this.camera.position.set(0, 10, 28);
        this.camera.lookAt(0, 0, 0);
        
        // 背景
        this.scene.background = new THREE.Color(0x0a1525);
        this.scene.fog = new THREE.FogExp2(0x0a1525, 0.012);
        
        // 光照
        this.setupLights();
        
        // 地面
        const grid = new THREE.GridHelper(50, 50, 0x334466, 0x1a2a3e);
        grid.position.y = -6;
        this.scene.add(grid);
        
        // 场景
        this.setupScene();
        
        // UI
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x334466, 0.6);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(15, 25, 15);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        const blueLight = new THREE.PointLight(0x3b82f6, 2, 40);
        blueLight.position.set(-8, 5, 10);
        this.scene.add(blueLight);
        
        const cyanLight = new THREE.PointLight(0x00aaff, 1.5, 30);
        cyanLight.position.set(8, 5, 10);
        this.scene.add(cyanLight);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        this.createContainer();
        this.createPistons();
        this.createFluid();
        this.createPressureGauges();
        this.createForceArrows();
        this.createLabels3D();
        this.createParticles();
    }

    createContainer() {
        // 玻璃材质
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transmission: 0.85,
            opacity: 0.3,
            transparent: true,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0,
            side: THREE.DoubleSide
        });

        // 左侧小圆柱容器
        const smallCylinderGeo = new THREE.CylinderGeometry(1.5, 1.5, 6, 32, 1, true);
        const smallCylinder = new THREE.Mesh(smallCylinderGeo, glassMat);
        smallCylinder.position.set(-6, 0, 0);
        this.mainGroup.add(smallCylinder);
        
        // 右侧大圆柱容器
        const largeCylinderGeo = new THREE.CylinderGeometry(3.5, 3.5, 6, 32, 1, true);
        const largeCylinder = new THREE.Mesh(largeCylinderGeo, glassMat);
        largeCylinder.position.set(6, 0, 0);
        this.mainGroup.add(largeCylinder);
        
        // 连接管道
        const pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, 12, 16);
        const pipeMat = new THREE.MeshPhysicalMaterial({
            color: 0x6699cc,
            transmission: 0.7,
            opacity: 0.4,
            transparent: true,
            roughness: 0.2
        });
        const pipe = new THREE.Mesh(pipeGeo, pipeMat);
        pipe.rotation.z = Math.PI / 2;
        pipe.position.y = -2;
        this.mainGroup.add(pipe);
        
        // 交互
        smallCylinder.userData = {
            hoverTitle: '小活塞缸',
            hoverDesc: '输入力的接收端',
            hoverIcon: 'fa-circle',
            name: '小活塞缸',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">📏 小活塞缸</p>
                <p class="text-gray-300 mb-3">面积较小的圆柱容器，接受输入力。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">半径: 1.5 单位</p>
                    <p class="text-sm text-gray-400">面积: A₁ = πr² ≈ 7.07</p>
                </div>
                <p class="text-sm text-cyan-400">💡 小面积 + 小力 = 产生高压强</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(smallCylinder);
        
        largeCylinder.userData = {
            hoverTitle: '大活塞缸',
            hoverDesc: '输出力被放大5.4倍',
            hoverIcon: 'fa-circle',
            name: '大活塞缸',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">📐 大活塞缸</p>
                <p class="text-gray-300 mb-3">面积较大的圆柱容器，产生放大后的输出力。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">半径: 3.5 单位</p>
                    <p class="text-sm text-gray-400">面积: A₂ = πr² ≈ 38.48</p>
                    <p class="text-sm text-green-400">放大倍数: A₂/A₁ ≈ 5.4倍</p>
                </div>
                <p class="text-sm text-yellow-400">⚡ 大面积 × 相同压强 = 大力</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(largeCylinder);
        
        pipe.userData = {
            hoverTitle: '连通管',
            hoverDesc: '液体传递压强',
            hoverIcon: 'fa-arrows-alt-h',
            name: '连通管道',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">🔗 连通管</p>
                <p class="text-gray-300 mb-3">连接两个活塞缸，使液体可以流通。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">帕斯卡定律：</p>
                    <p class="text-sm text-white">密闭液体中，压强在各处相等</p>
                </div>
                <p class="text-sm text-blue-400">🌊 液体传递压强，不是传递力</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(pipe);
    }

    createPistons() {
        // 金属材质
        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x888899,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x222233,
            emissiveIntensity: 0.2
        });
        
        // 小活塞
        const smallPistonGeo = new THREE.CylinderGeometry(1.4, 1.4, 1, 32);
        this.smallPiston = new THREE.Mesh(smallPistonGeo, metalMat.clone());
        this.smallPiston.position.set(-6, 2, 0);
        this.mainGroup.add(this.smallPiston);
        
        // 小活塞杆
        const smallRodGeo = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
        const smallRod = new THREE.Mesh(smallRodGeo, metalMat);
        smallRod.position.y = 2;
        this.smallPiston.add(smallRod);
        
        // 大活塞
        const largePistonGeo = new THREE.CylinderGeometry(3.4, 3.4, 1, 32);
        this.largePiston = new THREE.Mesh(largePistonGeo, metalMat.clone());
        this.largePiston.position.set(6, 0, 0);
        this.mainGroup.add(this.largePiston);
        
        // 大活塞顶部负载
        const loadGeo = new THREE.BoxGeometry(5, 2, 5);
        const loadMat = new THREE.MeshStandardMaterial({
            color: 0xcc6633,
            metalness: 0.3,
            roughness: 0.7,
            emissive: 0x331a0a,
            emissiveIntensity: 0.2
        });
        const load = new THREE.Mesh(loadGeo, loadMat);
        load.position.y = 1.5;
        this.largePiston.add(load);
        this.load = load;
        
        // 交互
        this.smallPiston.userData = {
            hoverTitle: '小活塞',
            hoverDesc: '施加输入力的活塞',
            hoverIcon: 'fa-arrow-down',
            name: '小活塞',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">⬇️ 输入端活塞</p>
                <p class="text-gray-300 mb-3">按下此活塞，对液体施加压力。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">输入力: F₁ = ${this.params.force} N</p>
                    <p class="text-sm text-gray-400">产生压强: P = F₁/A₁</p>
                </div>
                <p class="text-sm text-green-400">🔽 点击"施加压力"按钮演示</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.smallPiston);
        
        this.largePiston.userData = {
            hoverTitle: '大活塞',
            hoverDesc: '输出放大力的活塞',
            hoverIcon: 'fa-arrow-up',
            name: '大活塞',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">⬆️ 输出端活塞</p>
                <p class="text-gray-300 mb-3">输出放大后的力，可举起重物。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">输出力: F₂ = P × A₂</p>
                    <p class="text-sm text-green-400">F₂ = F₁ × (A₂/A₁) ≈ 540 N</p>
                </div>
                <p class="text-sm text-yellow-400">🏋️ 这就是千斤顶的原理！</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(this.largePiston);
        
        load.userData = {
            hoverTitle: '负载',
            hoverDesc: '被举起的重物',
            hoverIcon: 'fa-box',
            name: '重物负载',
            description: `
                <p class="text-lg font-bold text-orange-400 mb-3">📦 负载</p>
                <p class="text-gray-300 mb-3">被大活塞举起的重物。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">重量: ~540 N (55 kg)</p>
                    <p class="text-sm text-gray-400">能量守恒: W₁ = W₂</p>
                    <p class="text-sm text-yellow-400">小活塞移动5.4倍距离</p>
                </div>
                <p class="text-sm text-red-400">⚖️ 力放大了，但位移减小了</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(load);
    }

    createFluid() {
        // 流体材质
        const fluidMat = new THREE.MeshPhysicalMaterial({
            color: 0x0088ff,
            emissive: 0x003366,
            emissiveIntensity: 0.3,
            transmission: 0.4,
            opacity: 0.85,
            transparent: true,
            roughness: 0.1
        });
        
        // 小缸流体
        const smallFluidGeo = new THREE.CylinderGeometry(1.45, 1.45, 4, 32);
        const smallFluid = new THREE.Mesh(smallFluidGeo, fluidMat.clone());
        smallFluid.position.set(-6, -1, 0);
        this.mainGroup.add(smallFluid);
        this.smallFluid = smallFluid;
        
        // 大缸流体
        const largeFluidGeo = new THREE.CylinderGeometry(3.45, 3.45, 3, 32);
        const largeFluid = new THREE.Mesh(largeFluidGeo, fluidMat.clone());
        largeFluid.position.set(6, -1.5, 0);
        this.mainGroup.add(largeFluid);
        this.largeFluid = largeFluid;
        
        // 管道流体
        const pipeFluidGeo = new THREE.CylinderGeometry(0.75, 0.75, 11.5, 16);
        const pipeFluid = new THREE.Mesh(pipeFluidGeo, fluidMat.clone());
        pipeFluid.rotation.z = Math.PI / 2;
        pipeFluid.position.y = -2;
        this.mainGroup.add(pipeFluid);
        
        smallFluid.userData = {
            hoverTitle: '液压油',
            hoverDesc: '不可压缩的传力介质',
            hoverIcon: 'fa-tint',
            name: '液压油（左）',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">💧 液压油</p>
                <p class="text-gray-300 mb-3">不可压缩的液体介质，传递压力。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">特性: 不可压缩</p>
                    <p class="text-sm text-gray-400">作用: 均匀传递压强</p>
                </div>
                <p class="text-sm text-cyan-400">🌊 帕斯卡定律的载体</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(smallFluid);
    }

    createPressureGauges() {
        // 压力表 - 左侧
        const gauge1 = this.createGauge(-6, 5, 0, '输入压力');
        gauge1.userData = {
            hoverTitle: '压力表',
            hoverDesc: '显示输入端压强',
            hoverIcon: 'fa-tachometer-alt',
            name: '输入压力表',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">📊 压力表（输入端）</p>
                <p class="text-gray-300 mb-3">显示小活塞产生的压强。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">P = F₁ / A₁</p>
                    <p class="text-sm text-gray-400">单位: Pa (帕斯卡)</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(gauge1);
        this.gauges.push(gauge1);
        
        // 压力表 - 右侧
        const gauge2 = this.createGauge(6, 5, 0, '输出压力');
        gauge2.userData = {
            hoverTitle: '压力表',
            hoverDesc: '显示输出端压强',
            hoverIcon: 'fa-tachometer-alt',
            name: '输出压力表',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">📊 压力表（输出端）</p>
                <p class="text-gray-300 mb-3">显示大活塞承受的压强。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">两端压强相等！</p>
                    <p class="text-sm text-gray-400">P₁ = P₂（帕斯卡定律）</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(gauge2);
        this.gauges.push(gauge2);
    }

    createGauge(x, y, z, label) {
        const group = new THREE.Group();
        group.position.set(x, y, z);
        
        // 表盘
        const dialGeo = new THREE.CircleGeometry(1, 32);
        const dialMat = new THREE.MeshBasicMaterial({ color: 0x222233 });
        const dial = new THREE.Mesh(dialGeo, dialMat);
        group.add(dial);
        
        // 边框
        const ringGeo = new THREE.TorusGeometry(1, 0.1, 16, 48);
        const ringMat = new THREE.MeshStandardMaterial({
            color: 0x666677,
            metalness: 0.8,
            roughness: 0.3
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        group.add(ring);
        
        // 指针
        const needleGeo = new THREE.BoxGeometry(0.08, 0.8, 0.02);
        const needleMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
        const needle = new THREE.Mesh(needleGeo, needleMat);
        needle.position.y = 0.35;
        
        const needlePivot = new THREE.Group();
        needlePivot.add(needle);
        needlePivot.rotation.z = Math.PI / 4; // 初始位置
        group.add(needlePivot);
        group.userData.needle = needlePivot;
        
        // 标签
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(label, 64, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(3, 1.5, 1);
        sprite.position.y = 2;
        group.add(sprite);
        
        this.mainGroup.add(group);
        return dial;
    }

    createForceArrows() {
        // 输入力箭头（向下）
        const arrowDown = this.createArrow(0xff4444, 'down');
        arrowDown.position.set(-6, 6, 0);
        this.mainGroup.add(arrowDown);
        this.arrows.push(arrowDown);
        
        arrowDown.children[0].userData = {
            hoverTitle: '输入力 F₁',
            hoverDesc: `${this.params.force} N 向下`,
            hoverIcon: 'fa-hand-point-down',
            name: '输入力 F₁',
            description: `
                <p class="text-lg font-bold text-red-400 mb-3">⬇️ 输入力</p>
                <p class="text-gray-300 mb-3">施加在小活塞上的力。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">F₁ = ${this.params.force} N</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(arrowDown.children[0]);
        
        // 输出力箭头（向上）
        const arrowUp = this.createArrow(0x44ff44, 'up');
        arrowUp.position.set(6, 4, 0);
        this.mainGroup.add(arrowUp);
        this.arrows.push(arrowUp);
        
        arrowUp.children[0].userData = {
            hoverTitle: '输出力 F₂',
            hoverDesc: `${Math.round(this.params.force * 5.44)} N 向上`,
            hoverIcon: 'fa-hand-point-up',
            name: '输出力 F₂',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">⬆️ 输出力</p>
                <p class="text-gray-300 mb-3">大活塞产生的放大力。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">F₂ = F₁ × (A₂/A₁)</p>
                    <p class="text-sm text-green-400">F₂ ≈ ${Math.round(this.params.force * 5.44)} N</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(arrowUp.children[0]);
    }

    createArrow(color, direction) {
        const group = new THREE.Group();
        
        // 箭头杆
        const shaftGeo = new THREE.CylinderGeometry(0.15, 0.15, 2, 16);
        const shaftMat = new THREE.MeshBasicMaterial({ color });
        const shaft = new THREE.Mesh(shaftGeo, shaftMat);
        group.add(shaft);
        
        // 箭头头
        const headGeo = new THREE.ConeGeometry(0.4, 0.8, 16);
        const head = new THREE.Mesh(headGeo, shaftMat);
        head.position.y = direction === 'down' ? -1.4 : 1.4;
        if (direction === 'down') head.rotation.z = Math.PI;
        group.add(head);
        
        return group;
    }

    createLabels3D() {
        // 公式标签
        const formulaLabel = this.create3DLabel('F₂/F₁ = A₂/A₁', new THREE.Vector3(0, 8, 0), 0xffaa00);
        formulaLabel.scale.set(5, 2.5, 1);
        
        formulaLabel.userData = {
            hoverTitle: '帕斯卡定律',
            hoverDesc: 'F₂/F₁ = A₂/A₁',
            hoverIcon: 'fa-calculator',
            name: '帕斯卡定律公式',
            description: `
                <p class="text-lg font-bold text-yellow-400 mb-3">📐 核心公式</p>
                <p class="text-gray-300 mb-3">输出力与输入力的比值 = 面积比</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">F₂ / F₁ = A₂ / A₁</p>
                    <p class="text-sm text-gray-400 mt-2">变形：F₂ = F₁ × (A₂/A₁)</p>
                </div>
                <p class="text-sm text-green-400">✨ 面积越大，输出力越大</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(formulaLabel);
    }

    create3DLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.roundRect(4, 4, 248, 56, 8);
        ctx.fill();
        
        ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, 128, 42);
        
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(6, 1.5, 1);
        sprite.position.copy(position);
        
        this.mainGroup.add(sprite);
        return sprite;
    }

    createParticles() {
        // 流体粒子
        for (let i = 0; i < 100; i++) {
            const geo = new THREE.SphereGeometry(0.1, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x66bbff,
            transparent: true,
            opacity: 0.6
        });
            const particle = new THREE.Mesh(geo, mat);
            
            // 随机分布在液体区域
            const side = Math.random() > 0.5 ? 1 : -1;
            particle.position.set(
                side * 6 + (Math.random() - 0.5) * (side === -1 ? 2 : 5),
                -1 + (Math.random() - 0.5) * 3,
                (Math.random() - 0.5) * 2
            );
            particle.userData.originalY = particle.position.y;
            particle.userData.speed = 0.5 + Math.random() * 0.5;
            
            this.particles.push(particle);
            this.mainGroup.add(particle);
        }
    }

    applyPressure() {
        if (this.params.isAnimating) return;
        this.params.isAnimating = true;
        
        // 小活塞下压
        gsap.to(this.smallPiston.position, {
            y: 0,
            duration: 1,
            ease: 'power2.inOut'
        });
        
        // 大活塞上升（移动距离是小活塞的1/5.44）
        gsap.to(this.largePiston.position, {
            y: 0.37, // 2 / 5.44
            duration: 1,
            ease: 'power2.inOut'
        });
        
        // 压力表指针
        this.gauges.forEach(gauge => {
            if (gauge.parent && gauge.parent.userData.needle) {
                gsap.to(gauge.parent.userData.needle.rotation, {
                    z: -Math.PI / 4,
                    duration: 1
                });
            }
        });
        
        // 更新参数
        this.params.pressure = this.params.force / 7.07;
        
        setTimeout(() => {
            this.params.isAnimating = false;
        }, 1000);
    }

    resetSystem() {
        // 重置活塞位置
        gsap.to(this.smallPiston.position, {
            y: 2,
            duration: 0.5
        });
        
        gsap.to(this.largePiston.position, {
            y: 0,
            duration: 0.5
        });
        
        // 重置压力表
        this.gauges.forEach(gauge => {
            if (gauge.parent && gauge.parent.userData.needle) {
                gsap.to(gauge.parent.userData.needle.rotation, {
                    z: Math.PI / 4,
                    duration: 0.5
                });
            }
        });
        
        this.params.pressure = 0;
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-intro">
                <i class="fas fa-info"></i> 原理介绍
            </button>
            <button class="control-btn active" id="btn-pressure">
                <i class="fas fa-hand-pointer"></i> 按压活塞
            </button>
            <button class="control-btn" id="btn-force-up">
                <i class="fas fa-plus"></i> 增加力
            </button>
            <button class="control-btn" id="btn-force-down">
                <i class="fas fa-minus"></i> 减少力
            </button>
            <button class="control-btn" id="btn-reset-system">
                <i class="fas fa-sync"></i> 复位
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-intro').onclick = () => this.showIntroduction();
        document.getElementById('btn-pressure').onclick = () => this.applyPressure();
        document.getElementById('btn-force-up').onclick = () => this.adjustForce(50);
        document.getElementById('btn-force-down').onclick = () => this.adjustForce(-50);
        document.getElementById('btn-reset-system').onclick = () => this.resetSystem();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
        
        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 10, z: 28 };
    }
    
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
    
    showIntroduction() {
        // 教学介绍
        this.showTeachingGuide('📐 帕斯卡定律：密闭容器中的液体压强处处相等');
        setTimeout(() => {
            this.showTeachingGuide('💡 当小活塞下压时，大活塞会产生更大的力！');
        }, 4000);
        setTimeout(() => {
            this.showTeachingGuide('🔢 公式：F₂/F₁ = A₂/A₁（力的比值等于面积比）');
        }, 8000);
    }
    
    adjustForce(delta) {
        this.params.force = Math.max(100, Math.min(500, this.params.force + delta));
        const outputForce = Math.round(this.params.force * 5.44);
        this.showTeachingGuide(`⚙️ 输入力：${this.params.force}N → 输出力：${outputForce}N（放大5.4倍）`);
        
        // 触发动画
        this.applyPressure();
    }
    
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
    
    // 开始自动播放
    startAutoPlay() {
        this.isAutoPlaying = true;
        // 自动显示介绍然后演示
        setTimeout(() => {
            if (this.isAutoPlaying) {
                this.showIntroduction();
            }
        }, 500);
    }
    
    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
    }

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
        
        gsap.to(target.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.2 });
        gsap.to(target.scale, { x: 1, y: 1, z: 1, duration: 0.2, delay: 0.2 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');
        
        title.innerHTML = `<i class="fas fa-tint mr-2"></i>${target.userData.name}`;
        content.innerHTML = target.userData.description;
        
        panel.classList.add('visible');
    }

    createLabels(manager) {
        manager.createLabel('小活塞', new THREE.Vector3(-6, 5, 3), 'compress');
        manager.createLabel('大活塞', new THREE.Vector3(6, 4, 3), 'expand');
    }

    animate(time, delta) {
        // 粒子运动
        this.particles.forEach((p, i) => {
            p.position.y = p.userData.originalY + Math.sin(time * p.userData.speed + i) * 0.3;
        });
        
        // 箭头脉动
        this.arrows.forEach((arrow, i) => {
            const scale = 1 + Math.sin(time * 2 + i) * 0.1;
            arrow.scale.set(scale, scale, scale);
        });
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
    }

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
