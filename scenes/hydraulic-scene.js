/**
 * 液压系统场景 - 帕斯卡定律可视化 (增强交互版)
 * ============================================
 * 核心原理：
 * - 帕斯卡定律：密闭液体传递压强
 * - 面积放大原理：小力变大力
 * - 能量守恒：做功相等，位移反比
 * ============================================
 */
window.HydraulicScene = class HydraulicScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.hydraulicGroup = null;
        this.smallPiston = null;
        this.largePiston = null;
        this.fluidParticles = null;
        this.pressureArrows = [];
        this.load = null;

        this.params = {
            force: 0,
            pressure: 0,
            isAnimating: false
        };

        this.interactables = [];
    }

    init() {
        this.camera.position.set(0, 8, 25);
        this.camera.lookAt(0, 0, 0);

        this.scene.background = new THREE.Color(0x0a1628);

        // 灯光
        const ambient = new THREE.AmbientLight(0x334466, 0.6);
        this.scene.add(ambient);

        const dirLight = new THREE.DirectionalLight(0xffffff, 1);
        dirLight.position.set(10, 15, 10);
        dirLight.castShadow = true;
        this.scene.add(dirLight);

        const blueLight = new THREE.PointLight(0x3b82f6, 2, 30);
        blueLight.position.set(0, 5, 5);
        this.scene.add(blueLight);

        this.setupScene();
        this.setupFluidParticles();
        this.setupPressureVisualization();
        this.setupUI();
    }

    setupScene() {
        this.hydraulicGroup = new THREE.Group();
        this.scene.add(this.hydraulicGroup);

        // 材质定义
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transmission: 0.9,
            opacity: 0.3,
            transparent: true,
            roughness: 0.05,
            metalness: 0.1,
            clearcoat: 1.0,
            side: THREE.DoubleSide
        });

        const fluidMat = new THREE.MeshPhysicalMaterial({
            color: 0x0088ff,
            emissive: 0x003366,
            emissiveIntensity: 0.3,
            transmission: 0.5,
            opacity: 0.85,
            transparent: true,
            roughness: 0.1,
            metalness: 0.4
        });

        const metalMat = new THREE.MeshStandardMaterial({
            color: 0x8899aa,
            roughness: 0.2,
            metalness: 0.9
        });

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1a2a3a,
            roughness: 0.6,
            metalness: 0.3
        });

        // 1. 底座平台
        const base = new THREE.Mesh(
            new THREE.BoxGeometry(18, 0.8, 6),
            baseMat
        );
        base.position.y = -4;
        base.userData = { name: '底座', desc: '支撑整个液压系统的金属平台' };
        this.hydraulicGroup.add(base);

        // 2. 左侧小缸体 (半径1.5)
        const smallRadius = 1.5;
        const smallCylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(smallRadius, smallRadius, 6, 32, 1, true),
            glassMat
        );
        smallCylinder.position.set(-5, 0, 0);
        smallCylinder.userData = { 
            name: '小缸体', 
            desc: `横截面积 A₁ = π×${smallRadius}² ≈ ${(Math.PI * smallRadius * smallRadius).toFixed(1)} cm²`,
            radius: smallRadius
        };
        smallCylinder.userData.onClick = () => this.showInfo(smallCylinder.userData);
        this.hydraulicGroup.add(smallCylinder);
        this.interactables.push(smallCylinder);

        // 3. 右侧大缸体 (半径3)
        const largeRadius = 3;
        const largeCylinder = new THREE.Mesh(
            new THREE.CylinderGeometry(largeRadius, largeRadius, 6, 32, 1, true),
            glassMat
        );
        largeCylinder.position.set(5, 0, 0);
        largeCylinder.userData = { 
            name: '大缸体', 
            desc: `横截面积 A₂ = π×${largeRadius}² ≈ ${(Math.PI * largeRadius * largeRadius).toFixed(1)} cm²，是小缸的 ${(largeRadius*largeRadius/(smallRadius*smallRadius)).toFixed(0)} 倍！`,
            radius: largeRadius
        };
        largeCylinder.userData.onClick = () => this.showInfo(largeCylinder.userData);
        this.hydraulicGroup.add(largeCylinder);
        this.interactables.push(largeCylinder);

        // 4. 连接管道
        const tubeGeo = new THREE.CylinderGeometry(1, 1, 10, 32);
        tubeGeo.rotateZ(Math.PI / 2);
        const tube = new THREE.Mesh(tubeGeo, glassMat);
        tube.position.y = -2.5;
        tube.userData = { name: '连接管', desc: '密闭管道，液体通过这里传递压力。' };
        tube.userData.onClick = () => this.showInfo(tube.userData);
        this.hydraulicGroup.add(tube);
        this.interactables.push(tube);

        // 5. 液体填充
        this.leftFluid = new THREE.Mesh(
            new THREE.CylinderGeometry(smallRadius - 0.1, smallRadius - 0.1, 2, 32),
            fluidMat.clone()
        );
        this.leftFluid.position.set(-5, -1.5, 0);
        this.hydraulicGroup.add(this.leftFluid);

        this.rightFluid = new THREE.Mesh(
            new THREE.CylinderGeometry(largeRadius - 0.1, largeRadius - 0.1, 2, 32),
            fluidMat.clone()
        );
        this.rightFluid.position.set(5, -1.5, 0);
        this.hydraulicGroup.add(this.rightFluid);

        const tubeFluid = new THREE.Mesh(
            new THREE.CylinderGeometry(0.9, 0.9, 10, 32),
            fluidMat.clone()
        );
        tubeFluid.rotation.z = Math.PI / 2;
        tubeFluid.position.y = -2.5;
        this.hydraulicGroup.add(tubeFluid);

        // 6. 小活塞
        this.smallPiston = new THREE.Mesh(
            new THREE.CylinderGeometry(smallRadius - 0.05, smallRadius - 0.05, 0.6, 32),
            metalMat.clone()
        );
        this.smallPiston.position.set(-5, 0.5, 0);
        this.smallPiston.userData = { 
            name: '输入活塞', 
            desc: '按下这个活塞施加力 F₁，液体会将压力传递到大活塞。',
            isInput: true
        };
        this.smallPiston.userData.onClick = () => {
            this.showInfo(this.smallPiston.userData);
            this.animatePush();
        };
        this.hydraulicGroup.add(this.smallPiston);
        this.interactables.push(this.smallPiston);

        // 小活塞手柄
        const handle = new THREE.Mesh(
            new THREE.CylinderGeometry(0.3, 0.3, 3, 16),
            metalMat
        );
        handle.position.y = 1.8;
        this.smallPiston.add(handle);

        const handleTop = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xff4444, roughness: 0.3, metalness: 0.5 })
        );
        handleTop.position.y = 3.3;
        this.smallPiston.add(handleTop);

        // 7. 大活塞
        this.largePiston = new THREE.Mesh(
            new THREE.CylinderGeometry(largeRadius - 0.05, largeRadius - 0.05, 0.6, 32),
            metalMat.clone()
        );
        this.largePiston.position.set(5, 0.5, 0);
        this.largePiston.userData = { 
            name: '输出活塞', 
            desc: '输出力 F₂ = F₁ × (A₂/A₁) = 4倍输入力！这就是液压系统能举起汽车的秘密。'
        };
        this.largePiston.userData.onClick = () => this.showInfo(this.largePiston.userData);
        this.hydraulicGroup.add(this.largePiston);
        this.interactables.push(this.largePiston);

        // 8. 负载 - 金块/汽车
        const loadGroup = new THREE.Group();
        
        // 汽车车身
        const carBody = new THREE.Mesh(
            new THREE.BoxGeometry(4, 1.5, 2),
            new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.3, metalness: 0.6 })
        );
        carBody.position.y = 1.2;
        loadGroup.add(carBody);

        // 汽车顶部
        const carTop = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1, 1.8),
            new THREE.MeshStandardMaterial({ color: 0xff3333, roughness: 0.3, metalness: 0.6 })
        );
        carTop.position.y = 2.2;
        loadGroup.add(carTop);

        // 车窗
        const window1 = new THREE.Mesh(
            new THREE.PlaneGeometry(1, 0.6),
            new THREE.MeshBasicMaterial({ color: 0x3388ff, side: THREE.DoubleSide })
        );
        window1.position.set(0, 2.2, 0.91);
        loadGroup.add(window1);

        // 车轮
        const wheelGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
        wheelGeo.rotateX(Math.PI / 2);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.8 });
        [-1.2, 1.2].forEach(x => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(x, 0.4, 1.1);
            loadGroup.add(wheel);
            const wheel2 = wheel.clone();
            wheel2.position.z = -1.1;
            loadGroup.add(wheel2);
        });

        loadGroup.position.y = 0.8;
        loadGroup.userData = { 
            name: '汽车 (1000kg)', 
            desc: '需要约10000N的力才能举起。通过液压放大，只需2500N的输入力！' 
        };
        loadGroup.userData.onClick = () => this.showInfo(loadGroup.userData);
        this.largePiston.add(loadGroup);
        this.load = loadGroup;
        this.interactables.push(loadGroup);

        // 9. 仪表盘
        this.createGauge(new THREE.Vector3(-5, 5, 2), '输入压力', 0x22c55e);
        this.createGauge(new THREE.Vector3(5, 6, 2), '输出力', 0xf59e0b);
    }

    createGauge(pos, label, color) {
        const group = new THREE.Group();
        group.position.copy(pos);

        // 表盘
        const bg = new THREE.Mesh(
            new THREE.CircleGeometry(1, 32),
            new THREE.MeshBasicMaterial({ color: 0x111122, side: THREE.DoubleSide })
        );
        group.add(bg);

        // 边框
        const rim = new THREE.Mesh(
            new THREE.TorusGeometry(1, 0.08, 16, 32),
            new THREE.MeshBasicMaterial({ color: color })
        );
        group.add(rim);

        // 刻度
        for (let i = 0; i < 10; i++) {
            const angle = -Math.PI / 4 + (i / 9) * (Math.PI * 1.5);
            const tick = new THREE.Mesh(
                new THREE.BoxGeometry(0.05, 0.2, 0.02),
                new THREE.MeshBasicMaterial({ color: 0x666666 })
            );
            tick.position.set(Math.cos(angle) * 0.8, Math.sin(angle) * 0.8, 0.01);
            tick.rotation.z = angle - Math.PI / 2;
            group.add(tick);
        }

        // 指针
        const hand = new THREE.Mesh(
            new THREE.BoxGeometry(0.08, 0.7, 0.04),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        hand.geometry.translate(0, 0.3, 0);
        hand.rotation.z = Math.PI / 4;
        group.add(hand);

        group.userData = { hand, label, baseAngle: Math.PI / 4 };
        this.hydraulicGroup.add(group);
        
        if (!this.gauges) this.gauges = [];
        this.gauges.push(group);
    }

    setupFluidParticles() {
        // 流体粒子
        const count = 150;
        const geo = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const velocities = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 8;
            positions[i * 3 + 1] = -2.5 + (Math.random() - 0.5) * 0.5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
            velocities[i] = 0;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0x66ccff,
            size: 0.15,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });

        this.fluidParticles = new THREE.Points(geo, mat);
        this.fluidParticles.userData = { velocities };
        this.hydraulicGroup.add(this.fluidParticles);
    }

    setupPressureVisualization() {
        // 压力箭头
        const arrowMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ff88, 
            transparent: true, 
            opacity: 0 
        });

        // 在管道中创建箭头
        for (let i = 0; i < 5; i++) {
            const arrow = new THREE.Group();
            
            const shaft = new THREE.Mesh(
                new THREE.CylinderGeometry(0.1, 0.1, 0.8, 8),
                arrowMat.clone()
            );
            shaft.rotation.z = -Math.PI / 2;
            arrow.add(shaft);

            const head = new THREE.Mesh(
                new THREE.ConeGeometry(0.2, 0.4, 8),
                arrowMat.clone()
            );
            head.rotation.z = -Math.PI / 2;
            head.position.x = 0.6;
            arrow.add(head);

            arrow.position.set(-4 + i * 2, -2.5, 0);
            this.pressureArrows.push(arrow);
            this.hydraulicGroup.add(arrow);
        }
    }

    showInfo(data) {
        const info = document.getElementById('info-content');
        if (info && data) {
            const forceRatio = 4; // A2/A1
            const inputForce = this.params.force * 100;
            const outputForce = inputForce * forceRatio;

            info.innerHTML = `
                <div class="mb-4">
                    <div class="text-2xl font-bold text-white mb-2">${data.name}</div>
                    <div class="text-gray-300 text-sm leading-relaxed">${data.desc}</div>
                </div>
                
                <div class="bg-gradient-to-r from-blue-900/40 to-cyan-900/40 p-4 rounded-lg border border-blue-500/30 mb-4">
                    <div class="text-center text-3xl font-bold text-blue-300 font-mono mb-2">
                        F₂ = ${forceRatio} × F₁
                    </div>
                    <div class="text-xs text-gray-400 text-center">面积比决定力的放大倍数</div>
                </div>

                <div class="grid grid-cols-2 gap-3 mb-4">
                    <div class="bg-green-900/30 p-3 rounded-lg border border-green-500/30 text-center">
                        <div class="text-xs text-gray-400">输入力 F₁</div>
                        <div class="text-xl font-bold text-green-400">${inputForce.toFixed(0)} N</div>
                    </div>
                    <div class="bg-yellow-900/30 p-3 rounded-lg border border-yellow-500/30 text-center">
                        <div class="text-xs text-gray-400">输出力 F₂</div>
                        <div class="text-xl font-bold text-yellow-400">${outputForce.toFixed(0)} N</div>
                    </div>
                </div>

                <div class="bg-gray-800/50 p-3 rounded-lg">
                    <div class="text-xs text-gray-400 mb-2">调节输入压力</div>
                    <input type="range" min="0" max="100" value="${this.params.force * 100}" 
                        class="w-full accent-blue-500" id="force-slider">
                </div>
            `;

            const slider = document.getElementById('force-slider');
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.params.force = parseInt(e.target.value) / 100;
                    this.updatePhysics();
                });
            }
        }
    }

    setupUI() {
        const infoTitle = document.getElementById('info-title');
        if (infoTitle) infoTitle.innerText = "帕斯卡定律 (Pascal's Law)";

        this.showInfo({ 
            name: '液压系统原理', 
            desc: '密闭液体中任一点的压强变化，会等值传递到液体各处。利用面积差可以实现力的放大！' 
        });

        document.getElementById('info-panel').classList.add('visible');

        // 底部提示
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'flex';
            controlsDiv.innerHTML = `
                <div class="tip-pill"><i class="fas fa-hand-pointer"></i> 点击小活塞施加压力</div>
                <div class="tip-pill"><i class="fas fa-sliders-h"></i> 拖动滑块调节力度</div>
            `;
        }
    }

    animatePush() {
        if (this.params.isAnimating) return;
        this.params.isAnimating = true;

        gsap.to(this.params, {
            force: 1,
            duration: 1,
            ease: "power2.inOut",
            onUpdate: () => this.updatePhysics(),
            onComplete: () => {
                gsap.to(this.params, {
                    force: 0,
                    duration: 1.5,
                    delay: 0.5,
                    ease: "power2.inOut",
                    onUpdate: () => this.updatePhysics(),
                    onComplete: () => {
                        this.params.isAnimating = false;
                    }
                });
            }
        });
    }

    updatePhysics() {
        const force = this.params.force;
        const areaRatio = 4; // 大活塞面积是小活塞的4倍

        // 活塞位移（能量守恒：小活塞移动多，大活塞移动少）
        const smallMove = -force * 2;
        const largeMove = force * 2 / areaRatio;

        this.smallPiston.position.y = 0.5 + smallMove;
        this.largePiston.position.y = 0.5 + largeMove;

        // 液面高度
        this.leftFluid.scale.y = 1 + smallMove * 0.3;
        this.leftFluid.position.y = -1.5 + smallMove * 0.15;

        this.rightFluid.scale.y = 1 - largeMove * 0.3;
        this.rightFluid.position.y = -1.5 - largeMove * 0.15;

        // 更新仪表盘
        if (this.gauges) {
            this.gauges[0].userData.hand.rotation.z = Math.PI / 4 - force * Math.PI * 1.3;
            this.gauges[1].userData.hand.rotation.z = Math.PI / 4 - force * Math.PI * 1.3;
        }

        // 压力箭头
        this.pressureArrows.forEach((arrow, i) => {
            arrow.children.forEach(child => {
                child.material.opacity = force * 0.8;
            });
            arrow.position.x = -4 + i * 2 + force * 0.5;
        });
    }

    animate(time, delta) {
        // 流体粒子动画
        if (this.fluidParticles && this.params.force > 0.05) {
            const positions = this.fluidParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                const idx = i * 3;
                positions[idx] += 0.15 * this.params.force;
                if (positions[idx] > 4) {
                    positions[idx] = -4;
                }
            }
            this.fluidParticles.geometry.attributes.position.needsUpdate = true;
        }

        // 液体发光脉冲
        if (this.leftFluid && this.params.force > 0) {
            const pulse = 0.3 + Math.sin(time * 5) * 0.1 * this.params.force;
            this.leftFluid.material.emissiveIntensity = pulse;
            this.rightFluid.material.emissiveIntensity = pulse;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        this.scene.remove(this.hydraulicGroup);
    }
}
