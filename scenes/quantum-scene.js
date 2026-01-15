/**
 * 双缝干涉场景 - 量子力学观察者效应 (增强交互版)
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

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 场景元素
        this.electronGun = null;
        this.slitWall = null;
        this.screen = null;
        this.observer = null;
        this.particles = [];
        this.waveRings = [];

        this.params = {
            isObserved: false,
            particleSpeed: 0.15,
            emissionRate: 30
        };

        this.clock = new THREE.Clock();
        this.screenCanvas = null;
        this.screenTexture = null;
        
        // 自动播放
        this.isAutoPlaying = false;
    }

    init() {
        // 相机
        this.camera.position.set(0, 12, 30);
        this.camera.lookAt(0, 0, -5);
        
        // 背景
        this.scene.background = new THREE.Color(0x020210);
        this.scene.fog = new THREE.FogExp2(0x020210, 0.015);
        
        // 光照
        this.setupLights();
        
        // 地面
        const grid = new THREE.GridHelper(60, 60, 0x222266, 0x111144);
        grid.position.y = -6;
        this.scene.add(grid);
        
        // 场景
        this.setupScene();
        
        // UI
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x222244, 0.6);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xaabbff, 0.8);
        mainLight.position.set(10, 20, 15);
        this.scene.add(mainLight);
        
        const blueLight = new THREE.PointLight(0x00aaff, 2, 40);
        blueLight.position.set(0, 5, 15);
        this.scene.add(blueLight);
        
        const purpleLight = new THREE.PointLight(0x8844ff, 1.5, 30);
        purpleLight.position.set(0, 5, -15);
        this.scene.add(purpleLight);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        this.createElectronGun();
        this.createSlitWall();
        this.createDetectorScreen();
        this.createObserver();
        this.createLabels3D();
        this.createParticleSystem();
    }

    createElectronGun() {
        const group = new THREE.Group();
        group.position.set(0, 0, 15);
        
        // 主体圆柱
        const bodyGeo = new THREE.CylinderGeometry(1.2, 1.5, 4, 32);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x445566,
            metalness: 0.9,
            roughness: 0.2,
            emissive: 0x112233,
            emissiveIntensity: 0.3
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.rotation.x = -Math.PI / 2;
        group.add(body);
        
        // 发射口光环
        const ringGeo = new THREE.TorusGeometry(0.8, 0.15, 16, 48);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.8
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.z = -2;
        group.add(ring);
        this.gunRing = ring;
        
        // 能量核心
        const coreGeo = new THREE.SphereGeometry(0.5, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0.7
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        core.position.z = -2;
        group.add(core);
        this.gunCore = core;
        
        // 支架
        const standGeo = new THREE.CylinderGeometry(0.3, 0.5, 6, 16);
        const standMat = new THREE.MeshStandardMaterial({
            color: 0x333344,
            metalness: 0.8,
            roughness: 0.3
        });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.y = -5;
        group.add(stand);
        
        // 交互
        body.userData = {
            hoverTitle: '电子枪',
            hoverDesc: '发射高速电子束',
            hoverIcon: 'fa-bolt',
            name: '电子发射器',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">⚡ 电子枪</p>
                <p class="text-gray-300 mb-3">通过加热阴极释放电子，并用电场加速电子束。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">电子能量: ~50 keV</p>
                    <p class="text-sm text-gray-400">德布罗意波长: ~0.05 nm</p>
                </div>
                <p class="text-sm text-yellow-400">💡 电子既有粒子性，也有波动性</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        
        this.interactables.push(body);
        this.electronGun = group;
        this.mainGroup.add(group);
    }

    createSlitWall() {
        const group = new THREE.Group();
        group.position.set(0, 0, 0);
        
        // 墙壁材质
        const wallMat = new THREE.MeshStandardMaterial({
            color: 0x334455,
            metalness: 0.6,
            roughness: 0.4,
            emissive: 0x111122,
            emissiveIntensity: 0.2
        });
        
        // 左墙
        const leftWallGeo = new THREE.BoxGeometry(4, 8, 0.5);
        const leftWall = new THREE.Mesh(leftWallGeo, wallMat);
        leftWall.position.x = -3.5;
        group.add(leftWall);
        
        // 中墙
        const midWallGeo = new THREE.BoxGeometry(1.5, 8, 0.5);
        const midWall = new THREE.Mesh(midWallGeo, wallMat);
        group.add(midWall);
        
        // 右墙
        const rightWall = new THREE.Mesh(leftWallGeo, wallMat);
        rightWall.position.x = 3.5;
        group.add(rightWall);
        
        // 狭缝发光边缘
        const slitGlowMat = new THREE.MeshBasicMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.6
        });
        
        // 左狭缝边缘
        const leftSlitGeo = new THREE.BoxGeometry(0.1, 8, 0.6);
        const leftSlitGlow1 = new THREE.Mesh(leftSlitGeo, slitGlowMat);
        leftSlitGlow1.position.set(-1.5, 0, 0);
        group.add(leftSlitGlow1);
        
        const leftSlitGlow2 = new THREE.Mesh(leftSlitGeo, slitGlowMat);
        leftSlitGlow2.position.set(-0.8, 0, 0);
        group.add(leftSlitGlow2);
        
        // 右狭缝边缘
        const rightSlitGlow1 = new THREE.Mesh(leftSlitGeo, slitGlowMat);
        rightSlitGlow1.position.set(0.8, 0, 0);
        group.add(rightSlitGlow1);
        
        const rightSlitGlow2 = new THREE.Mesh(leftSlitGeo, slitGlowMat);
        rightSlitGlow2.position.set(1.5, 0, 0);
        group.add(rightSlitGlow2);
        
        // 交互
        midWall.userData = {
            hoverTitle: '双狭缝',
            hoverDesc: '电子波通过两条狭缝',
            hoverIcon: 'fa-columns',
            name: '双狭缝挡板',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🔲 双缝结构</p>
                <p class="text-gray-300 mb-3">两条极窄的狭缝，让电子波可以同时通过并产生干涉。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">狭缝宽度: ~100 nm</p>
                    <p class="text-sm text-gray-400">狭缝间距: ~1 μm</p>
                </div>
                <p class="text-sm text-purple-400">🌊 波穿过狭缝后会发生衍射</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        
        this.interactables.push(midWall);
        leftWall.userData = midWall.userData;
        leftWall.userData.onClick = midWall.userData.onClick;
        this.interactables.push(leftWall);
        
        this.slitWall = group;
        this.mainGroup.add(group);
    }

    createDetectorScreen() {
        const group = new THREE.Group();
        group.position.set(0, 0, -12);
        
        // 屏幕框架
        const frameGeo = new THREE.BoxGeometry(16, 10, 0.5);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x222233,
            metalness: 0.7,
            roughness: 0.3
        });
        const frame = new THREE.Mesh(frameGeo, frameMat);
        group.add(frame);
        
        // 显示屏幕 (Canvas纹理)
        this.screenCanvas = document.createElement('canvas');
        this.screenCanvas.width = 512;
        this.screenCanvas.height = 320;
        this.clearScreen();
        
        this.screenTexture = new THREE.CanvasTexture(this.screenCanvas);
        const screenGeo = new THREE.PlaneGeometry(14, 8);
        const screenMat = new THREE.MeshBasicMaterial({
            map: this.screenTexture,
            transparent: true
        });
        const screenMesh = new THREE.Mesh(screenGeo, screenMat);
        screenMesh.position.z = 0.3;
        group.add(screenMesh);
        this.screenMesh = screenMesh;
        
        // 交互
        frame.userData = {
            hoverTitle: '探测屏',
            hoverDesc: '记录电子到达位置',
            hoverIcon: 'fa-tv',
            name: '探测屏幕',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">📺 探测器</p>
                <p class="text-gray-300 mb-3">记录电子到达的位置，形成干涉条纹或两条亮带。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-cyan-400">未观测: 干涉条纹（波动性）</p>
                    <p class="text-sm text-orange-400">已观测: 两条亮带（粒子性）</p>
                </div>
                <p class="text-sm text-red-400">🔬 这就是著名的观察者效应！</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        
        this.interactables.push(frame);
        this.screen = group;
        this.mainGroup.add(group);
    }

    createObserver() {
        const group = new THREE.Group();
        group.position.set(8, 3, 0);
        
        // 眼睛主体
        const eyeGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const eyeMat = new THREE.MeshStandardMaterial({
            color: 0xffffff,
            emissive: 0x333333,
            emissiveIntensity: 0.3,
            metalness: 0.1,
            roughness: 0.8
        });
        const eye = new THREE.Mesh(eyeGeo, eyeMat);
        group.add(eye);
        
        // 虹膜
        const irisGeo = new THREE.CircleGeometry(0.8, 32);
        const irisMat = new THREE.MeshBasicMaterial({ color: 0x4488ff });
        const iris = new THREE.Mesh(irisGeo, irisMat);
        iris.position.z = 1.4;
        group.add(iris);
        
        // 瞳孔
        const pupilGeo = new THREE.CircleGeometry(0.35, 32);
        const pupilMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
        const pupil = new THREE.Mesh(pupilGeo, pupilMat);
        pupil.position.z = 1.45;
        group.add(pupil);
        
        // 观测光线（初始隐藏）
        const rayGeo = new THREE.CylinderGeometry(0.05, 0.3, 8, 8);
        const rayMat = new THREE.MeshBasicMaterial({
            color: 0xff4444,
            transparent: true,
            opacity: 0
        });
        const ray = new THREE.Mesh(rayGeo, rayMat);
        ray.rotation.z = Math.PI / 2;
        ray.position.x = -5;
        group.add(ray);
        this.observerRay = ray;
        
        // 状态标签
        const labelCanvas = document.createElement('canvas');
        labelCanvas.width = 128;
        labelCanvas.height = 64;
        const ctx = labelCanvas.getContext('2d');
        ctx.fillStyle = '#888888';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('观察者', 64, 40);
        
        const labelTexture = new THREE.CanvasTexture(labelCanvas);
        const labelMat = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
        const label = new THREE.Sprite(labelMat);
        label.scale.set(3, 1.5, 1);
        label.position.y = 3;
        group.add(label);
        
        // 交互
        eye.userData = {
            hoverTitle: '观察者',
            hoverDesc: '观测会导致波函数坍缩',
            hoverIcon: 'fa-eye',
            name: '观察者',
            description: `
                <p class="text-lg font-bold text-yellow-400 mb-3">👁️ 量子观察者</p>
                <p class="text-gray-300 mb-3">当我们尝试观测电子通过哪个狭缝时，干涉条纹会消失！</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">观测 = 与电子发生相互作用</p>
                    <p class="text-sm text-gray-400">相互作用会导致波函数坍缩</p>
                </div>
                <p class="text-sm text-pink-400">🎯 点击下方按钮切换观测状态</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        
        this.interactables.push(eye);
        this.observer = group;
        this.mainGroup.add(group);
    }

    createLabels3D() {
        // 左狭缝标签
        const leftSlitLabel = this.create3DLabel('狭缝 A', new THREE.Vector3(-1.2, 5, 0), 0x00aaff);
        leftSlitLabel.userData = {
            hoverTitle: '狭缝 A',
            hoverDesc: '电子通道之一',
            hoverIcon: 'fa-minus',
            name: '狭缝 A',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">A 狭缝</p>
                <p class="text-gray-300 mb-3">电子波可以从这里通过。</p>
                <p class="text-sm text-gray-400">在未被观测时，电子同时通过两条狭缝（叠加态）</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(leftSlitLabel);
        
        // 右狭缝标签
        const rightSlitLabel = this.create3DLabel('狭缝 B', new THREE.Vector3(1.2, 5, 0), 0x00aaff);
        rightSlitLabel.userData = {
            hoverTitle: '狭缝 B',
            hoverDesc: '电子通道之二',
            hoverIcon: 'fa-minus',
            name: '狭缝 B',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">B 狭缝</p>
                <p class="text-gray-300 mb-3">电子波可以从这里通过。</p>
                <p class="text-sm text-gray-400">两条狭缝的波相遇时会发生干涉</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(rightSlitLabel);
    }

    create3DLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(4, 4, 120, 56, 8);
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 42);
        
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.scale.set(3, 1.5, 1);
        sprite.position.copy(position);
        
        this.mainGroup.add(sprite);
        return sprite;
    }

    createParticleSystem() {
        // 粒子池
        for (let i = 0; i < 50; i++) {
            const geo = new THREE.SphereGeometry(0.15, 16, 16);
            const mat = new THREE.MeshBasicMaterial({
            color: 0x00ffff,
            transparent: true,
                opacity: 0
            });
            const particle = new THREE.Mesh(geo, mat);
            particle.userData.active = false;
            particle.userData.velocity = new THREE.Vector3();
            this.particles.push(particle);
            this.mainGroup.add(particle);
        }
    }

    clearScreen() {
        const ctx = this.screenCanvas.getContext('2d');
        ctx.fillStyle = '#000011';
        ctx.fillRect(0, 0, 512, 320);
    }

    drawInterferencePattern() {
        const ctx = this.screenCanvas.getContext('2d');
        
        // 干涉条纹
        for (let x = 0; x < 512; x++) {
            const intensity = Math.pow(Math.cos((x - 256) * 0.05), 2);
            const brightness = Math.floor(intensity * 180 + 30);
            ctx.fillStyle = `rgb(${brightness}, ${brightness + 50}, 255)`;
            ctx.fillRect(x, 0, 1, 320);
        }
        
        this.screenTexture.needsUpdate = true;
    }

    drawParticlePattern() {
        const ctx = this.screenCanvas.getContext('2d');
        
        // 两条亮带
        const gradient1 = ctx.createRadialGradient(180, 160, 0, 180, 160, 60);
        gradient1.addColorStop(0, 'rgba(100, 200, 255, 0.9)');
        gradient1.addColorStop(1, 'rgba(0, 50, 100, 0)');
        ctx.fillStyle = gradient1;
        ctx.fillRect(120, 0, 120, 320);
        
        const gradient2 = ctx.createRadialGradient(332, 160, 0, 332, 160, 60);
        gradient2.addColorStop(0, 'rgba(100, 200, 255, 0.9)');
        gradient2.addColorStop(1, 'rgba(0, 50, 100, 0)');
        ctx.fillStyle = gradient2;
        ctx.fillRect(272, 0, 120, 320);
        
        this.screenTexture.needsUpdate = true;
    }

    emitParticle() {
        const particle = this.particles.find(p => !p.userData.active);
        if (!particle) return;
        
        particle.userData.active = true;
        particle.position.set(0, 0, 13);
        particle.material.opacity = 1;
        
        // 速度方向
        const spread = this.params.isObserved ? 0.5 : 0.8;
        particle.userData.velocity.set(
            (Math.random() - 0.5) * spread,
            (Math.random() - 0.5) * 0.2,
            -this.params.particleSpeed
        );
    }

    updateParticles() {
        this.particles.forEach(particle => {
            if (!particle.userData.active) return;
            
            particle.position.add(particle.userData.velocity);
            
            // 通过狭缝后扩散
            if (particle.position.z < 0 && particle.position.z > -1) {
                if (!this.params.isObserved) {
                    // 波动性：扩散
                    particle.userData.velocity.x += (Math.random() - 0.5) * 0.02;
                }
            }
            
            // 到达屏幕
            if (particle.position.z < -11) {
                particle.userData.active = false;
                particle.material.opacity = 0;
                
                // 在屏幕上留下痕迹
                this.addScreenHit(particle.position.x);
            }
        });
    }

    addScreenHit(x) {
        const ctx = this.screenCanvas.getContext('2d');
        const screenX = (x / 7 + 0.5) * 512;
        const screenY = Math.random() * 320;
        
        ctx.fillStyle = 'rgba(100, 200, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
        ctx.fill();
        
        this.screenTexture.needsUpdate = true;
    }

    toggleObserver() {
        this.params.isObserved = !this.params.isObserved;
        
        // 更新观测光线
        gsap.to(this.observerRay.material, {
            opacity: this.params.isObserved ? 0.6 : 0,
            duration: 0.5
        });
        
        // 清除屏幕并重绘
        this.clearScreen();
        if (this.params.isObserved) {
            this.drawParticlePattern();
        } else {
            this.drawInterferencePattern();
        }
        
        // 更新按钮状态
        const btn = document.getElementById('btn-observe');
        if (btn) {
            btn.innerHTML = this.params.isObserved 
                ? '<i class="fas fa-eye"></i> 停止观测' 
                : '<i class="fas fa-eye-slash"></i> 开始观测';
            btn.classList.toggle('active', this.params.isObserved);
        }
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-experiment-wave">
                <i class="fas fa-water"></i> 波动实验
            </button>
            <button class="control-btn" id="btn-observe">
                <i class="fas fa-eye"></i> 观测实验
            </button>
            <button class="control-btn" id="btn-compare">
                <i class="fas fa-columns"></i> 对比结果
            </button>
            <button class="control-btn" id="btn-clear">
                <i class="fas fa-eraser"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-experiment-wave').onclick = () => this.runWaveExperiment();
        document.getElementById('btn-observe').onclick = () => this.runObserveExperiment();
        document.getElementById('btn-compare').onclick = () => this.showComparison();
        document.getElementById('btn-clear').onclick = () => this.resetExperiment();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
        
        // 初始绘制干涉条纹
        this.drawInterferencePattern();
        
        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 12, z: 30 };
    }
    
    resetView() {
        gsap.to(this.camera.position, {
            x: this.defaultCameraPos.x,
            y: this.defaultCameraPos.y,
            z: this.defaultCameraPos.z,
            duration: 0.8,
            ease: 'power2.out'
        });
        this.camera.lookAt(0, 0, -5);
    }
    
    runWaveExperiment() {
        // 波动实验：不观测，显示干涉条纹
        if (this.params.isObserved) {
            this.params.isObserved = false;
            gsap.to(this.observerRay.material, { opacity: 0, duration: 0.5 });
        }
        
        this.clearScreen();
        this.showExperimentGuide('🌊 波动实验：电子同时通过两条狭缝');
        
        // 绘制干涉条纹
        setTimeout(() => {
            this.drawInterferencePattern();
            this.showExperimentGuide('✨ 出现干涉条纹！电子表现出波动性');
        }, 1500);
    }
    
    runObserveExperiment() {
        // 观测实验：观测时干涉消失
        this.params.isObserved = true;
        gsap.to(this.observerRay.material, { opacity: 0.6, duration: 0.5 });
        
        this.clearScreen();
        this.showExperimentGuide('👁️ 观测实验：探测电子通过哪条狭缝');
        
        setTimeout(() => {
            this.drawParticlePattern();
            this.showExperimentGuide('❓ 干涉条纹消失！电子表现出粒子性');
        }, 1500);
    }
    
    showComparison() {
        this.showExperimentGuide('🔬 核心发现：观测会改变实验结果！这就是量子力学的观察者效应');
    }
    
    resetExperiment() {
        this.params.isObserved = false;
        gsap.to(this.observerRay.material, { opacity: 0, duration: 0.3 });
        this.clearScreen();
        this.showExperimentGuide('🔄 实验已重置，请选择实验类型');
    }
    
    showExperimentGuide(message) {
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
        }, 4000);
    }
    
    // 开始自动播放
    startAutoPlay() {
        this.isAutoPlaying = true;
        // 自动运行波动实验演示
        setTimeout(() => {
            if (this.isAutoPlaying) {
                this.runWaveExperiment();
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
        
        gsap.to(target.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.2 });
        gsap.to(target.scale, { x: 1, y: 1, z: 1, duration: 0.2, delay: 0.2 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');
        
        title.innerHTML = `<i class="fas fa-atom mr-2"></i>${target.userData.name}`;
        content.innerHTML = target.userData.description;
        
        panel.classList.add('visible');
    }

    createLabels(manager) {
        manager.createLabel('电子源', new THREE.Vector3(0, 4, 15), 'bolt');
        manager.createLabel('探测屏', new THREE.Vector3(0, 6, -12), 'tv');
    }

    animate(time, delta) {
        // 发射粒子
        if (Math.random() < 0.1) {
            this.emitParticle();
        }
        
        // 更新粒子
        this.updateParticles();
        
        // 发射器光环旋转
        if (this.gunRing) {
            this.gunRing.rotation.z = time * 2;
        }
        
        // 能量核心脉动
        if (this.gunCore) {
            this.gunCore.scale.setScalar(1 + Math.sin(time * 5) * 0.1);
        }
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
