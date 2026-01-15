/**
 * 双缝干涉场景 - 量子力学观察者效应 (增强版)
 * ============================================
 * 核心原理：
 * - 波粒二象性：电子既是粒子也是波
 * - 观察者效应：测量会导致波函数坍缩
 * - 干涉条纹：未观测时呈现波动特性
 * ============================================
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
        this.electronGun = null;
        this.slitWalls = [];

        this.params = {
            isObserved: false,
            waveIntensity: 1.0,
            particleSpeed: 0.15
        };

        this.interactables = [];
        this.clock = new THREE.Clock();
        this.screenCtx = null;
        this.screenTex = null;
    }

    init() {
        this.camera.position.set(0, 12, 25);
        this.camera.lookAt(0, 0, -2);

        // 深邃宇宙背景
        this.scene.background = new THREE.Color(0x020208);
        this.scene.fog = new THREE.Fog(0x020208, 15, 60);

        // 环境光
        const ambient = new THREE.AmbientLight(0x222244, 0.5);
        this.scene.add(ambient);

        // 聚光灯
        const spot = new THREE.SpotLight(0x00aaff, 2, 50, Math.PI / 4);
        spot.position.set(0, 20, 10);
        this.scene.add(spot);

        this.setupElectronGun();
        this.setupSlitWall();
        this.setupDetectorScreen();
        this.setupWaveFunction();
        this.setupParticles();
        this.setupObserver();
        this.setupUI();
    }

    setupElectronGun() {
        // 电子枪 - 科幻风格发射器
        const gunGroup = new THREE.Group();

        // 主体
        const bodyGeo = new THREE.CylinderGeometry(0.8, 1.2, 3, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x334455,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x001122,
            emissiveIntensity: 0.5
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = -Math.PI / 2;
        gunGroup.add(body);

        // 发射口发光环
        const ringGeo = new THREE.TorusGeometry(0.6, 0.1, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff, 
            transparent: true, 
            opacity: 0.8 
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.z = -1.5;
        gunGroup.add(ring);

        // 能量核心
        const coreGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ffff,
            transparent: true,
            opacity: 0.6
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.z = -1.5;
        gunGroup.add(core);

        gunGroup.position.z = 12;
        gunGroup.userData = { 
            name: '电子发射器', 
            desc: '发射单个电子，每次只发射一个！但经过大量发射后，屏幕上会出现干涉条纹。',
            ring: ring,
            core: core
        };
        gunGroup.userData.onClick = () => this.showInfo(gunGroup.userData);
        
        this.electronGun = gunGroup;
        this.scene.add(gunGroup);
        this.interactables.push(gunGroup);
    }

    setupSlitWall() {
        // 双缝挡板 - 金属质感
        const wallMat = new THREE.MeshPhysicalMaterial({
            color: 0x222222,
            metalness: 0.95,
            roughness: 0.1,
            clearcoat: 0.5
        });

        const slitMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });

        // 左挡板
        const leftWall = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 0.3), wallMat);
        leftWall.position.set(-2.5, 0, 3);
        leftWall.userData = { name: '左挡板', desc: '阻挡电子通过的金属板' };
        leftWall.userData.onClick = () => this.showInfo(leftWall.userData);

        // 右挡板
        const rightWall = new THREE.Mesh(new THREE.BoxGeometry(3, 6, 0.3), wallMat);
        rightWall.position.set(2.5, 0, 3);
        rightWall.userData = { name: '右挡板', desc: '阻挡电子通过的金属板' };
        rightWall.userData.onClick = () => this.showInfo(rightWall.userData);

        // 中间挡板
        const centerWall = new THREE.Mesh(new THREE.BoxGeometry(0.8, 6, 0.3), wallMat);
        centerWall.position.set(0, 0, 3);
        centerWall.userData = { name: '中间隔板', desc: '将两条狭缝分开，形成"双缝"' };
        centerWall.userData.onClick = () => this.showInfo(centerWall.userData);

        // 狭缝发光效果
        const slit1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, 0.4), slitMat);
        slit1.position.set(-0.5, 0, 3);
        slit1.userData = { name: '狭缝A', desc: '宽度仅有微米级别，电子可以从这里通过' };
        slit1.userData.onClick = () => this.showInfo(slit1.userData);

        const slit2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 6, 0.4), slitMat);
        slit2.position.set(0.5, 0, 3);
        slit2.userData = { name: '狭缝B', desc: '与狭缝A平行的另一条通道' };
        slit2.userData.onClick = () => this.showInfo(slit2.userData);

        this.slitWalls = [leftWall, rightWall, centerWall, slit1, slit2];
        this.slitWalls.forEach(w => {
            this.scene.add(w);
            this.interactables.push(w);
        });
    }

    setupDetectorScreen() {
        // 探测屏幕 - 显示干涉/粒子条纹
        const screenGeo = new THREE.PlaneGeometry(14, 8);
        const screenMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        this.screenMesh = new THREE.Mesh(screenGeo, screenMat);
        this.screenMesh.position.z = -8;
        this.screenMesh.userData = { 
            name: '探测屏幕', 
            desc: '记录电子撞击位置。未观测时显示干涉条纹，观测时显示两条亮带。' 
        };
        this.screenMesh.userData.onClick = () => this.showInfo(this.screenMesh.userData);
        this.scene.add(this.screenMesh);
        this.interactables.push(this.screenMesh);

        // 边框
        const frameGeo = new THREE.BoxGeometry(14.5, 8.5, 0.5);
        const frameMat = new THREE.MeshStandardMaterial({ 
            color: 0x333333, 
            metalness: 0.8, 
            roughness: 0.3 
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        frame.position.z = -8.2;
        this.scene.add(frame);

        // 初始化屏幕纹理
        this.initScreenTexture();
    }

    initScreenTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        this.screenCtx = canvas.getContext('2d');
        this.screenTex = new THREE.CanvasTexture(canvas);
        this.screenMesh.material = new THREE.MeshBasicMaterial({ map: this.screenTex });
    }

    setupWaveFunction() {
        // 波函数可视化 - 地面波纹
        const geometry = new THREE.PlaneGeometry(12, 20, 60, 60);
        geometry.rotateX(-Math.PI / 2);

        const material = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            wireframe: true,
            transparent: true,
            opacity: 0.25,
            emissive: 0x004466,
            emissiveIntensity: 0.3
        });

        this.waveMesh = new THREE.Mesh(geometry, material);
        this.waveMesh.position.y = -2;
        this.scene.add(this.waveMesh);
    }

    setupParticles() {
        // 电子粒子流
        const count = 400;
        const geo = new THREE.BufferGeometry();
        const pos = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);

        for (let i = 0; i < count; i++) {
            this.resetParticle(pos, i);
            colors[i * 3] = 0;
            colors[i * 3 + 1] = 1;
            colors[i * 3 + 2] = 1;
        }

        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const mat = new THREE.PointsMaterial({ 
            size: 0.2, 
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending
        });
        this.particles = new THREE.Points(geo, mat);
        this.scene.add(this.particles);
    }

    resetParticle(pos, i) {
        pos[i * 3] = (Math.random() - 0.5) * 0.3;
        pos[i * 3 + 1] = (Math.random() - 0.5) * 0.3;
        pos[i * 3 + 2] = 12;
    }

    setupObserver() {
        // 观察者之眼 - 科幻探测器
        this.observerEye = new THREE.Group();

        // 外壳 - 透明球体
        const shell = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 32, 32),
            new THREE.MeshPhysicalMaterial({ 
                color: 0xffffff, 
                transmission: 0.7, 
                opacity: 0.4, 
                transparent: true,
                roughness: 0.1
            })
        );

        // 核心 - 红色发光球
        const core = new THREE.Mesh(
            new THREE.SphereGeometry(0.5, 32, 32),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );

        // 扫描光束
        const beamGeo = new THREE.ConeGeometry(5, 12, 32, 1, true);
        beamGeo.translate(0, -6, 0);
        beamGeo.rotateX(-Math.PI / 2);
        const beamMat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        this.beam = new THREE.Mesh(beamGeo, beamMat);

        // 装饰环
        const decorRing = new THREE.Mesh(
            new THREE.TorusGeometry(1.5, 0.08, 16, 32),
            new THREE.MeshBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.5 })
        );

        this.observerEye.add(shell, core, this.beam, decorRing);
        this.observerEye.position.set(5, 4, 3);
        this.observerEye.lookAt(0, 0, 3);
        this.observerEye.visible = false;

        this.observerEye.userData = { 
            name: '量子探测器', 
            desc: '当启用时，会"测量"电子通过哪条狭缝，导致波函数坍缩！' 
        };

        this.scene.add(this.observerEye);
    }

    showInfo(data) {
        const info = document.getElementById('info-content');
        if (info && data) {
            const currentState = this.params.isObserved ? 
                '<span class="text-red-400"><i class="fas fa-eye"></i> 观测中 - 粒子态</span>' :
                '<span class="text-green-400"><i class="fas fa-wave-square"></i> 未观测 - 波动态</span>';
            
            info.innerHTML = `
                <div class="mb-4">
                    <div class="text-2xl font-bold text-white mb-2">${data.name}</div>
                    <div class="text-gray-300 text-sm leading-relaxed">${data.desc}</div>
                </div>
                <div class="bg-gray-800/50 p-3 rounded-lg border border-cyan-500/30 mb-4">
                    <div class="text-xs text-gray-400 mb-1">当前状态</div>
                    <div class="text-lg">${currentState}</div>
                </div>
                <div class="bg-gray-800/50 p-3 rounded-lg cursor-pointer hover:bg-gray-700/50 transition" id="btn-toggle-obs">
                    <div class="flex items-center">
                        <div class="w-12 h-6 rounded-full relative mr-3 transition-colors ${this.params.isObserved ? 'bg-red-600' : 'bg-gray-600'}" id="toggle-bg">
                            <div class="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${this.params.isObserved ? 'translate-x-6' : 'translate-x-0.5'}" id="toggle-dot"></div>
                        </div>
                        <span class="text-white">启用探测器 (观测)</span>
                    </div>
                </div>
                <p class="mt-4 text-xs text-gray-500">
                    💡 这就是著名的"观察者效应"：观测行为本身会改变实验结果！
                </p>
            `;

            document.getElementById('btn-toggle-obs').onclick = () => this.toggleObserver();
        }
    }

    setupUI() {
        const infoTitle = document.getElementById('info-title');
        if (infoTitle) infoTitle.innerText = "双缝干涉实验";
        
        this.showInfo({ 
            name: '双缝干涉实验', 
            desc: '这是物理学史上最著名的实验之一！它揭示了量子世界的神奇：电子同时具有波动性和粒子性。点击任意部件了解更多。' 
        });
        
        document.getElementById('info-panel').classList.add('visible');

        // 底部控制提示
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'flex';
            controlsDiv.innerHTML = `
                <div class="tip-pill"><i class="fas fa-mouse-pointer"></i> 点击部件查看说明</div>
                <div class="tip-pill"><i class="fas fa-eye"></i> 开启探测器观察坍缩</div>
            `;
        }
    }

    toggleObserver() {
        this.params.isObserved = !this.params.isObserved;
        this.observerEye.visible = this.params.isObserved;

        if (this.params.isObserved) {
            this.beam.material.opacity = 0.15;
            // 动画效果
            gsap.from(this.observerEye.scale, { x: 0, y: 0, z: 0, duration: 0.5, ease: "back.out" });
        } else {
            this.beam.material.opacity = 0;
        }

        // 刷新UI
        this.showInfo({ 
            name: this.params.isObserved ? '观测模式' : '自然模式', 
            desc: this.params.isObserved ? 
                '探测器已启用！电子"知道"自己被观察，表现出粒子特性，只会从一条缝通过。' : 
                '探测器已关闭。电子恢复波动特性，同时通过两条缝并产生干涉！' 
        });
    }

    animate(time, delta) {
        const t = time * 2;

        // 1. 电子枪发光脉冲
        if (this.electronGun) {
            const pulse = 0.6 + Math.sin(t * 5) * 0.4;
            this.electronGun.userData.ring.material.opacity = pulse;
            this.electronGun.userData.core.scale.setScalar(0.8 + Math.sin(t * 8) * 0.2);
        }

        // 2. 波函数动画
        if (this.waveMesh) {
            const pos = this.waveMesh.geometry.attributes.position;
            const count = pos.count;
            for (let i = 0; i < count; i++) {
                const x = pos.getX(i);
                const z = pos.getY(i);

                let amp = 0;
                if (z < 2) {
                    const d1 = Math.sqrt(Math.pow(x - 0.5, 2) + Math.pow(z - 2, 2));
                    const d2 = Math.sqrt(Math.pow(x + 0.5, 2) + Math.pow(z - 2, 2));

                    if (!this.params.isObserved) {
                        amp = (Math.sin(d1 * 3 - t) + Math.sin(d2 * 3 - t)) * 0.4;
                    } else {
                        amp = Math.sin(d1 * 5 - t) * 0.1;
                    }
                }
                pos.setZ(i, amp);
            }
            pos.needsUpdate = true;

            // 波函数透明度
            this.waveMesh.material.opacity = this.params.isObserved ? 0.1 : 0.25;
        }

        // 3. 粒子动画
        if (this.particles) {
            const positions = this.particles.geometry.attributes.position.array;
            const colors = this.particles.geometry.attributes.color.array;

            for (let i = 0; i < positions.length / 3; i++) {
                const idx = i * 3;
                positions[idx + 2] -= this.params.particleSpeed;

                const pz = positions[idx + 2];
                const px = positions[idx];

                // 通过狭缝
                if (pz < 3.3 && pz > 2.7) {
                    if (Math.abs(px) > 0.15 && Math.abs(px) < 0.35) {
                        // 在狭缝中
                    } else if (Math.abs(px - 0.5) > 0.15 && Math.abs(px + 0.5) > 0.15) {
                        // 撞墙重置
                        this.resetParticle(positions, i);
                    }
                }

                // 干涉/直线运动
                if (pz < 2.5 && pz > -8) {
                    if (!this.params.isObserved) {
                        positions[idx] += Math.sin(t * 2 + i * 0.5) * 0.03;
                        colors[idx] = 0;
                        colors[idx + 1] = 1;
                        colors[idx + 2] = 1;
                    } else {
                        positions[idx] += (Math.random() - 0.5) * 0.005;
                        colors[idx] = 1;
                        colors[idx + 1] = 0.3;
                        colors[idx + 2] = 0.3;
                    }
                }

                // 撞屏重置
                if (pz < -8) {
                    this.resetParticle(positions, i);
                }
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
            this.particles.geometry.attributes.color.needsUpdate = true;
        }

        // 4. 观察者眼睛动画
        if (this.observerEye.visible) {
            this.observerEye.rotation.z = Math.sin(t) * 0.1;
            this.beam.material.opacity = 0.1 + Math.sin(t * 3) * 0.05;
        }

        // 5. 更新屏幕纹理
        this.updateScreenTexture();
    }

    updateScreenTexture() {
        if (!this.screenCtx) return;

        const ctx = this.screenCtx;
        // 淡出效果
        ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        ctx.fillRect(0, 0, 512, 256);

        if (this.params.isObserved) {
            // 粒子态：两条亮带
            ctx.fillStyle = '#ff4444';
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff0000';
            this.drawGlowRect(ctx, 120, 30, 60, 196);
            this.drawGlowRect(ctx, 332, 30, 60, 196);
        } else {
            // 波动态：多条干涉条纹
            ctx.fillStyle = '#00ffff';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ffff';
            for (let k = 0; k < 9; k++) {
                const alpha = Math.max(0.2, 1 - Math.abs(k - 4) * 0.2);
                ctx.globalAlpha = alpha;
                this.drawGlowRect(ctx, 40 + k * 52, 30, 25, 196);
            }
            ctx.globalAlpha = 1;
        }

        ctx.shadowBlur = 0;
        this.screenTex.needsUpdate = true;
    }

    drawGlowRect(ctx, x, y, w, h) {
        ctx.fillRect(x, y, w, h);
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.particles) this.scene.remove(this.particles);
        if (this.waveMesh) this.scene.remove(this.waveMesh);
        if (this.electronGun) this.scene.remove(this.electronGun);
        if (this.screenMesh) this.scene.remove(this.screenMesh);
        if (this.observerEye) this.scene.remove(this.observerEye);
        this.slitWalls.forEach(w => this.scene.remove(w));
    }
}
