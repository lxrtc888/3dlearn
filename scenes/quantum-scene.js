/**
 * 双缝干涉场景 - 量子力学观察者效应 (可视化增强版)
 */
window.QuantumScene = class QuantumScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.waveMesh = null;
        this.particles = null;
        this.observerEye = null;
        this.screenMesh = null;

        this.params = {
            isObserved: false,
            waveIntensity: 1.0,
            particleSpeed: 0.1
        };

        this.interactables = [];
        this.clock = new THREE.Clock();
    }

    init() {
        this.camera.position.set(0, 10, 20);
        this.camera.lookAt(0, 0, 0);

        // 暗黑深邃背景
        this.scene.background = new THREE.Color(0x050510);
        this.scene.fog = new THREE.Fog(0x050510, 10, 50);

        this.setupEnvironment();
        this.setupWaveFunction();
        this.setupParticles();
        this.setupObserver();
        this.setupUI();
    }

    setupEnvironment() {
        // 1. 发射源
        const gunGeo = new THREE.ConeGeometry(0.5, 2, 8);
        const gunMat = new THREE.MeshEmissiveMaterial({ color: 0x00aaff, emissive: 0x0088ff, emissiveIntensity: 2 });
        const gun = new THREE.Mesh(gunGeo, gunMat);
        gun.rotation.x = -Math.PI / 2;
        gun.position.z = 10;
        this.scene.add(gun);

        // 2. 双缝板
        const wallMat = new THREE.MeshPhysicalMaterial({
            color: 0x111111,
            metalness: 0.8,
            roughness: 0.2,
            clearcoat: 1.0
        });

        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.2), wallMat);
        leftWall.position.set(-3, 0, 2);

        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(4, 5, 0.2), wallMat);
        rightWall.position.set(3, 0, 2);

        const cenWall = new THREE.Mesh(new THREE.BoxGeometry(0.5, 5, 0.2), wallMat);
        cenWall.position.set(0, 0, 2);

        this.scene.add(leftWall, rightWall, cenWall);

        // 3. 探测屏
        this.screenMesh = new THREE.Mesh(
            new THREE.PlaneGeometry(12, 6),
            new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        this.screenMesh.position.z = -8;
        this.screenMesh.rotation.y = Math.PI; // Face camera roughly
        this.scene.add(this.screenMesh);

        // 边框
        const frame = new THREE.Mesh(new THREE.BoxGeometry(12.2, 6.2, 0.5), new THREE.MeshBasicMaterial({ color: 0x333333 }));
        frame.position.z = -8.1;
        this.scene.add(frame);
    }

    setupWaveFunction() {
        // 创建一个平面网格来模拟波
        // 只有在非观测模式下显示明显波动
        const geometry = new THREE.PlaneGeometry(10, 16, 50, 50);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.3,
            emissive: 0x0044aa,
            emissiveIntensity: 0.5
        });

        this.waveMesh = new THREE.Mesh(geometry, material);
        this.waveMesh.position.y = -1; // 地面位置
        this.scene.add(this.waveMesh);
    }

    setupParticles() {
        const count = 500;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);

        for (let i = 0; i < count * 3; i += 3) {
            pos[i] = (Math.random() - 0.5) * 0.2;
            pos[i + 1] = (Math.random() - 0.5) * 0.2;
            pos[i + 2] = 10; // start at gun
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 0.15, transparent: true });
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
    }

    setupObserver() {
        // 创建一个更有科技感的“观察之眼”
        this.observerEye = new THREE.Group();

        // 外壳
        const shell = new THREE.Mesh(
            new THREE.SphereGeometry(1, 32, 32),
            new THREE.MeshPhysicalMaterial({ color: 0xffffff, transmission: 0.5, opacity: 0.6, transparent: true })
        );

        // 核心
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.4, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );

        // 扫描光束
        const beamGeo = new THREE.ConeGeometry(4, 10, 32, 1, true);
        beamGeo.translate(0, -5, 0);
        beamGeo.rotateX(-Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        this.beam = new THREE.Mesh(beamGeo, beamMat);

        this.observerEye.add(shell, core, this.beam);
        this.observerEye.position.set(4, 3, 2);
        this.observerEye.lookAt(0, 0, 2);
        this.observerEye.visible = false;

        this.scene.add(this.observerEye);
    }

    createLabels(manager) {
        // manager.createLabel("电子枪", new THREE.Vector3(0, 1, 10));
    }

    setupUI() {
        const infoTitle = document.getElementById('info-title');
        const infoContent = document.getElementById('info-content');
        if (infoTitle) infoTitle.innerText = "双缝干涉 (Double Slit)";
        if (infoContent) {
            infoContent.innerHTML = `
                <div class="flex items-center justify-between mb-4">
                    <span class="text-gray-400">当前状态</span>
                    <span id="state-badge" class="px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm border border-green-500/30">
                        <i class="fas fa-wave-square"></i> 波动叠加态
                    </span>
                </div>
                
                <div class="space-y-3">
                    <div class="bg-gray-800 p-3 rounded text-sm cursor-pointer hover:bg-gray-700 transition" id="btn-toggle-obs">
                        <div class="flex items-center">
                            <div class="w-10 h-6 bg-gray-600 rounded-full relative mr-3 transition-colors" id="toggle-bg">
                                <div class="w-4 h-4 bg-white rounded-full absolute top-1 left-1 transition-transform" id="toggle-dot"></div>
                            </div>
                            <span>启用探测器 (Observer)</span>
                        </div>
                    </div>
                </div>
                
                <p class="mt-4 text-xs text-gray-500">
                    当您“观测”粒子通过哪条缝时，波函数坍缩，干涉条纹消失。这就是著名的海森堡不确定性原理在宏观的可视化。
                </p>
            `;

            document.getElementById('btn-toggle-obs').onclick = () => this.toggleObserver();
        }
        document.getElementById('info-panel').classList.add('visible');
    }

    toggleObserver() {
        this.params.isObserved = !this.params.isObserved;
        this.observerEye.visible = this.params.isObserved;

        // UI 更新
        const badge = document.getElementById('state-badge');
        const toggleBg = document.getElementById('toggle-bg');
        const toggleDot = document.getElementById('toggle-dot');

        if (this.params.isObserved) {
            // Observed
            badge.className = "px-2 py-1 bg-red-500/20 text-red-400 rounded text-sm border border-red-500/30";
            badge.innerHTML = '<i class="fas fa-circle"></i> 粒子坍缩态';

            toggleBg.classList.replace('bg-gray-600', 'bg-blue-600');
            toggleDot.style.transform = 'translateX(16px)';

            // 播放音效或视觉反馈
            this.beam.material.opacity = 0.2;
        } else {
            // Wave
            badge.className = "px-2 py-1 bg-green-500/20 text-green-400 rounded text-sm border border-green-500/30";
            badge.innerHTML = '<i class="fas fa-wave-square"></i> 波动叠加态';

            toggleBg.classList.replace('bg-blue-600', 'bg-gray-600');
            toggleDot.style.transform = 'translateX(0)';
        }
    }

    animate(time, delta) {
        const t = time * 2;

        // 1. 波函数动画
        if (this.waveMesh) {
            const pos = this.waveMesh.geometry.attributes.position;
            const count = pos.count;
            for (let i = 0; i < count; i++) {
                const x = pos.getX(i);
                const z = pos.getY(i); // Plane rotate X, so Y is Z in world

                let amp = 0;
                // 从狭缝(z=2)后开始波动
                if (z < 1.8) {
                    // 双源干涉公式模拟
                    const d1 = Math.sqrt(Math.pow(x - 1, 2) + Math.pow(z - 1.8, 2));
                    const d2 = Math.sqrt(Math.pow(x + 1, 2) + Math.pow(z - 1.8, 2));

                    if (!this.params.isObserved) {
                        // 干涉
                        amp = Math.sin(d1 * 2 - t) + Math.sin(d2 * 2 - t);
                        amp *= 0.5; // Scale down
                    } else {
                        // 坍缩：只有微弱的扰动
                        amp = Math.sin(d1 * 4 - t) * 0.1 + Math.sin(d2 * 4 - t) * 0.1;
                    }
                }

                pos.setZ(i, amp); // 设置高度 (local Z)
            }
            pos.needsUpdate = true;
        }

        // 2. 粒子动画
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length / 3; i++) {
                const idx = i * 3;
                // Move z
                positions[idx + 2] -= 0.15;

                const pz = positions[idx + 2];
                const px = positions[idx];

                // 通过狭缝逻辑
                if (pz < 2.2 && pz > 1.8) {
                    if (Math.abs(px) < 0.2 || Math.abs(px) > 1.3) {
                        // Hit wall
                        positions[idx + 2] = 10;
                    }
                }

                // 衍射/干涉偏移
                if (pz < 1.8 && pz > -8) {
                    if (!this.params.isObserved) {
                        // 波动性：大幅度正弦偏移
                        positions[idx] += Math.sin(t + i) * 0.04;
                    } else {
                        // 粒子性：直线微扰
                        positions[idx] += (Math.random() - 0.5) * 0.01;
                    }
                }

                // 撞屏
                if (pz < -8) {
                    positions[idx + 2] = 10;
                    positions[idx] = (Math.random() - 0.5) * 0.2;
                    positions[idx + 1] = (Math.random() - 0.5) * 0.2;
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }

        // 3. 屏幕纹理更新 (动态 canvas)
        this.updateScreenTexture();
    }

    updateScreenTexture() {
        if (!this.screenCtx) {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 128;
            this.screenCtx = canvas.getContext('2d');
            this.screenTex = new THREE.CanvasTexture(canvas);
            this.screenMesh.material = new THREE.MeshBasicMaterial({ map: this.screenTex });
        }

        const ctx = this.screenCtx;
        // Fade effect
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, 256, 128);

        ctx.fillStyle = this.params.isObserved ? '#ff3333' : '#00ffff';

        if (this.params.isObserved) {
            // 粒子态：两道杠
            this.drawGlowRect(ctx, 60, 20, 30, 88);
            this.drawGlowRect(ctx, 166, 20, 30, 88);
        } else {
            // 干涉态：多道条纹
            for (let k = 0; k < 7; k++) {
                const alpha = Math.max(0.1, 1 - Math.abs(k - 3) * 0.3); // 中间亮两边暗
                ctx.globalAlpha = alpha;
                this.drawGlowRect(ctx, 20 + k * 34, 20, 15, 88);
            }
            ctx.globalAlpha = 1;
        }

        this.screenTex.needsUpdate = true;
    }

    drawGlowRect(ctx, x, y, w, h) {
        ctx.shadowBlur = 10;
        ctx.shadowColor = ctx.fillStyle;
        ctx.fillRect(x, y, w, h);
        ctx.shadowBlur = 0;
    }

    getInteractables() {
        return this.interactables; // 暂无3D对象点击，主要是 UI 控制
    }

    dispose() {
        this.scene.remove(this.particles);
        this.scene.remove(this.waveMesh);
    }
}
