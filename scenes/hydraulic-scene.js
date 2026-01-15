/**
 * 液压系统场景 - 帕斯卡定律可视化 (增强版)
 */
window.HydraulicScene = class HydraulicScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.hydraulicGroup = null;
        this.smallP = null;
        this.largeP = null;
        this.fluidMesh = null;
        this.particles = null;

        this.params = {
            force: 0,
            simSpeed: 0
        };

        this.interactables = [];
        this.isDragging = false;
    }

    init() {
        this.camera.position.set(0, 5, 22);

        // 增强环境光
        const ambientLight = new THREE.AmbientLight(0x404040, 2);
        this.scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x3b82f6, 2, 50);
        pointLight.position.set(5, 10, 5);
        this.scene.add(pointLight);

        this.setupScene();
        this.setupParticles();
        this.setupUI();
    }

    setupScene() {
        this.hydraulicGroup = new THREE.Group();
        this.scene.add(this.hydraulicGroup);

        // --- 材质定义 ---
        const glassMat = new THREE.MeshPhysicalMaterial({
            color: 0x88ccff,
            transmission: 0.95,
            opacity: 0.3,
            transparent: true,
            roughness: 0.1,
            metalness: 0.1,
            clearcoat: 1.0,
            side: THREE.DoubleSide
        });

        const fluidMat = new THREE.MeshPhysicalMaterial({
            color: 0x0066ff,
            emissive: 0x002244,
            transmission: 0.6,
            opacity: 0.9,
            transparent: true,
            roughness: 0.2,
            metalness: 0.5
        });

        const pistonMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.3,
            metalness: 0.8
        });

        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1e293b,
            roughness: 0.7,
            metalness: 0.2
        });

        // --- 1. 容器底座 ---
        const base = new THREE.Mesh(new THREE.BoxGeometry(10, 0.5, 4), baseMat);
        base.position.y = -2.5;
        this.hydraulicGroup.add(base);

        // --- 2. 玻璃缸体 ---
        // 左缸 (小)
        const cyl1 = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 5, 32), glassMat);
        cyl1.position.x = -3;
        // 右缸 (大)
        const cyl2 = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.4, 5, 32), glassMat);
        cyl2.position.x = 3;
        // 连接管
        const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 6, 32), glassMat);
        tube.rotation.z = Math.PI / 2;
        tube.position.y = -2;

        this.hydraulicGroup.add(cyl1, cyl2, tube);

        // --- 3. 流体 ---
        const leftFluid = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 1, 32), fluidMat);
        leftFluid.position.set(-3, -1.5, 0);

        const rightFluid = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 1, 32), fluidMat);
        rightFluid.position.set(3, -1.5, 0);

        const tubeFluid = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 6, 32), fluidMat);
        tubeFluid.rotation.z = Math.PI / 2;
        tubeFluid.position.y = -2;

        this.hydraulicGroup.add(leftFluid, rightFluid, tubeFluid);
        this.fluidMesh = { left: leftFluid, right: rightFluid };

        // --- 4. 活塞 ---
        this.smallP = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.5, 32), pistonMat);
        this.smallP.position.set(-3, 0, 0);
        this.smallP.userData = { name: '输入活塞', desc: '点击或拖动施加压力' };

        this.largeP = new THREE.Mesh(new THREE.CylinderGeometry(2.3, 2.3, 0.5, 32), pistonMat);
        this.largeP.position.set(3, 0, 0);
        this.largeP.userData = { name: '输出活塞', desc: '输出 4倍 举升力' };

        this.hydraulicGroup.add(this.smallP, this.largeP);
        this.interactables.push(this.smallP, this.largeP);

        // 活塞连杆
        const rod1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 3), pistonMat);
        rod1.position.y = 1.75;
        this.smallP.add(rod1);

        // --- 5. 负载重物 (金块) ---
        const loadGeometry = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const loadMaterial = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            roughness: 0.3,
            metalness: 1.0,
            emissive: 0xffaa00,
            emissiveIntensity: 0.2
        });
        const load = new THREE.Mesh(loadGeometry, loadMaterial);
        load.position.y = 2;
        this.largeP.add(load);

        // --- 6. 3D 仪表盘 ---
        this.createGauge(new THREE.Vector3(-3, 3.5, 0), '输入压力 P1');
        this.createGauge(new THREE.Vector3(3, 4, 1.5), '输出压力 P2');

        // --- 点击交互 ---
        this.smallP.userData.onClick = () => this.togglePressure();
    }

    createGauge(pos, label) {
        const group = new THREE.Group();
        group.position.copy(pos);

        // 表盘背景
        const bg = new THREE.Mesh(
            new THREE.CircleGeometry(0.8, 32),
            new THREE.MeshBasicMaterial({ color: 0x0f172a, side: THREE.DoubleSide })
        );
        // 刻度
        const rim = new THREE.Mesh(
            new THREE.RingGeometry(0.7, 0.8, 32),
            new THREE.MeshBasicMaterial({ color: 0x3b82f6 })
        );
        // 指针
        const hand = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.6, 0.05),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        hand.position.y = 0.2;
        hand.geometry.translate(0, -0.2, 0); // Pivot at bottom

        group.add(bg, rim, hand);
        group.lookAt(this.camera.position);

        this.hydraulicGroup.add(group);
        // 保存引用用于动画
        if (!this.gauges) this.gauges = [];
        this.gauges.push({ hand, label });
    }

    setupParticles() {
        // 创建流体粒子，模拟压力传递方向
        const count = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);

        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 5; // x range -2.5 to 2.5 (tube area)
            positions[i * 3 + 1] = -2 + (Math.random() - 0.5) * 0.5; // y around -2
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.5; // z
            speeds[i] = 0.05 + Math.random() * 0.05;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const mat = new THREE.PointsMaterial({
            color: 0xaecbfa,
            size: 0.15,
            transparent: true,
            opacity: 0.6
        });

        this.particles = new THREE.Points(geometry, mat);
        this.particles.userData = { speeds };
        this.hydraulicGroup.add(this.particles);
    }

    togglePressure() {
        // 简单的状态切换测试
        const target = this.params.force > 0.5 ? 0 : 1;
        gsap.to(this.params, {
            force: target,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => this.updatePhysics()
        });
    }

    createLabels(manager) {
        manager.createLabel("小活塞 (A1)", new THREE.Vector3(-3, -0.5, 1.5));
        manager.createLabel("大活塞 (A2 = 4*A1)", new THREE.Vector3(3, -0.5, 2.5));
        manager.createLabel("100kg金块", new THREE.Vector3(3, 4.5, 0));
    }

    setupUI() {
        const infoTitle = document.getElementById('info-title');
        const infoContent = document.getElementById('info-content');
        if (infoTitle) infoTitle.innerText = "帕斯卡定律 (Pascal's Law)";
        if (infoContent) {
            infoContent.innerHTML = `
                <div class="mb-4 text-center">
                    <div class="text-3xl font-bold text-blue-400 font-mono">F₂ = 4 × F₁</div>
                    <div class="text-xs text-gray-500 mt-1">微小输入带来巨大输出</div>
                </div>
                
                <div class="space-y-4">
                    <div class="bg-gray-800/50 p-3 rounded-lg border border-blue-500/20">
                        <div class="flex justify-between text-sm mb-1">
                            <span>输入压力 (Interactive)</span>
                            <span id="force-val" class="text-blue-300">0%</span>
                        </div>
                        <input type="range" min="0" max="100" value="0" class="w-full accent-blue-500" id="force-slider">
                    </div>
                </div>

                <div class="mt-4 text-sm text-gray-400">
                    <i class="fas fa-info-circle mr-1"></i> 
                    液体不可压缩，压力在密闭容器中向各个方向等值传递。
                </div>
            `;

            // 绑定滑块事件
            const slider = document.getElementById('force-slider');
            slider.addEventListener('input', (e) => {
                const val = parseInt(e.target.value) / 100;
                this.params.force = val;
                document.getElementById('force-val').innerText = `${Math.round(val * 100)}%`;
                this.updatePhysics();
            });
        }
        document.getElementById('info-panel').classList.add('visible');

        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="tip-pill"><i class="fas fa-hand-pointer"></i> 拖动滑块或点击小活塞</div>
        `;
    }

    updatePhysics() {
        // 物理逻辑：A1*h1 = A2*h2 => h2 = h1 * (A1/A2) = h1 * 0.25
        const inputH = -this.params.force * 1.5; // 最大下压 1.5
        const outputH = -inputH * 0.25;

        // 更新位置
        this.smallP.position.y = inputH;
        this.fluidMesh.left.scale.y = Math.max(0.1, 2 + inputH); // 初始高度2
        this.fluidMesh.left.position.y = -2 + this.fluidMesh.left.scale.y / 2;

        this.largeP.position.y = outputH;
        this.fluidMesh.right.scale.y = Math.max(0.1, 2 + outputH);
        this.fluidMesh.right.position.y = -2 + this.fluidMesh.right.scale.y / 2;

        // 更新仪表盘指针
        if (this.gauges) {
            const angle = -Math.PI / 2 - (this.params.force * Math.PI * 1.5); // 0 -> 270度
            this.gauges.forEach(g => {
                g.hand.rotation.z = angle;
            });
        }
    }

    animate(time, delta) {
        // 粒子流动动画
        if (this.particles && this.params.force > 0.05) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                // 简单的向右流动模拟
                if (positions[i * 3] < 3) {
                    positions[i * 3] += 0.1 * this.params.force;
                } else {
                    positions[i * 3] = -3;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        this.scene.remove(this.hydraulicGroup);
    }
}
