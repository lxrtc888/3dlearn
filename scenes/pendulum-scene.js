/**
 * 单摆运动场景 - 简谐运动可视化
 * ============================================
 * 核心原理：
 * - 周期公式：T = 2π√(L/g)
 * - 小角度近似下的简谐运动
 * - 能量守恒：势能与动能相互转化
 * ============================================
 */
window.PendulumScene = class PendulumScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 单摆组件
        this.pivot = null;
        this.rod = null;
        this.bob = null;
        this.trail = [];
        
        // 物理参数
        this.params = {
            length: 8,          // 摆长 (m)
            angle: Math.PI / 6, // 初始角度 (30°)
            angularVelocity: 0,
            gravity: 9.8,
            damping: 0.999,     // 阻尼
            isRunning: true
        };
        
        this.isAutoPlaying = false;
        this.defaultCameraPos = { x: 0, y: 5, z: 20 };
    }

    init() {
        this.camera.position.set(0, 5, 20);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x1a1a2e);
        this.scene.fog = new THREE.FogExp2(0x1a1a2e, 0.008);
        
        this.setupLights();
        this.setupEnvironment();
        this.setupScene();
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 20, 10);
        mainLight.castShadow = true;
        this.scene.add(mainLight);
        
        const blueLight = new THREE.PointLight(0x4488ff, 1.5, 30);
        blueLight.position.set(-10, 10, 5);
        this.scene.add(blueLight);
    }

    setupEnvironment() {
        // 网格地面
        const grid = new THREE.GridHelper(40, 40, 0x334466, 0x1a1a2e);
        grid.position.y = -12;
        this.scene.add(grid);
        
        // 背景刻度尺
        this.createAngleScale();
    }

    createAngleScale() {
        // 角度刻度弧线
        const arcGeometry = new THREE.BufferGeometry();
        const points = [];
        for (let i = -60; i <= 60; i += 5) {
            const rad = (i * Math.PI) / 180;
            points.push(new THREE.Vector3(Math.sin(rad) * 10, 8 - Math.cos(rad) * 10, -0.5));
        }
        arcGeometry.setFromPoints(points);
        
        const arcMaterial = new THREE.LineBasicMaterial({ color: 0x445566, transparent: true, opacity: 0.5 });
        const arc = new THREE.Line(arcGeometry, arcMaterial);
        this.scene.add(arc);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 支架
        const supportGeo = new THREE.BoxGeometry(6, 0.5, 0.5);
        const supportMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8, roughness: 0.2 });
        const support = new THREE.Mesh(supportGeo, supportMat);
        support.position.set(0, 8.25, 0);
        this.mainGroup.add(support);
        
        // 悬挂点
        const pivotGeo = new THREE.SphereGeometry(0.3, 16, 16);
        const pivotMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
        this.pivot = new THREE.Mesh(pivotGeo, pivotMat);
        this.pivot.position.set(0, 8, 0);
        this.pivot.userData = {
            hoverTitle: '悬挂点',
            hoverDesc: '单摆的固定支点',
            hoverIcon: 'fa-circle',
            name: '悬挂点',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🔘 悬挂点</p>
                <p class="text-gray-300 mb-3">单摆的固定支撑点，摆线从此处悬挂。</p>
                <p class="text-sm text-purple-400">理想单摆假设悬挂点无摩擦</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.mainGroup.add(this.pivot);
        this.interactables.push(this.pivot);
        
        // 摆线
        const rodGeo = new THREE.CylinderGeometry(0.05, 0.05, this.params.length, 8);
        const rodMat = new THREE.MeshStandardMaterial({ color: 0xcccccc });
        this.rod = new THREE.Mesh(rodGeo, rodMat);
        this.rod.position.set(0, -this.params.length / 2, 0);
        this.rod.userData = {
            hoverTitle: '摆线',
            hoverDesc: `长度 L = ${this.params.length}m`,
            hoverIcon: 'fa-grip-lines-vertical',
            name: '摆线（绳/杆）',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">📏 摆线</p>
                <p class="text-gray-300 mb-3">连接悬挂点与摆球的线或杆。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">当前长度: <span class="text-white font-bold">${this.params.length} m</span></p>
                </div>
                <p class="text-sm text-yellow-400">💡 摆长越长，周期越大</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(this.rod);
        
        // 摆球
        const bobGeo = new THREE.SphereGeometry(0.8, 32, 32);
        const bobMat = new THREE.MeshStandardMaterial({ 
            color: 0x4488ff, 
            metalness: 0.3, 
            roughness: 0.4,
            emissive: 0x112244
        });
        this.bob = new THREE.Mesh(bobGeo, bobMat);
        this.bob.position.set(0, -this.params.length, 0);
        this.bob.userData = {
            hoverTitle: '摆球',
            hoverDesc: '做简谐运动的重物',
            hoverIcon: 'fa-circle',
            name: '摆球',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🔵 摆球</p>
                <p class="text-gray-300 mb-3">单摆末端的重物，在重力作用下做简谐运动。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">运动特点:</p>
                    <p class="text-sm text-white">• 最低点速度最大</p>
                    <p class="text-sm text-white">• 最高点速度为零</p>
                </div>
                <p class="text-sm text-green-400">✨ 能量在动能和势能之间转化</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(this.bob);
        
        // 摆动组（包含摆线和摆球）
        this.pendulumGroup = new THREE.Group();
        this.pendulumGroup.add(this.rod);
        this.pendulumGroup.add(this.bob);
        this.pendulumGroup.position.set(0, 8, 0);
        this.pendulumGroup.rotation.z = this.params.angle;
        this.mainGroup.add(this.pendulumGroup);
        
        // 周期公式标签
        this.createFormulaLabel();
        
        // 能量条
        this.createEnergyBars();
    }

    createFormulaLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.roundRect(0, 0, 512, 128, 16);
        ctx.fill();
        
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 36px Arial';
        ctx.fillText('T = 2π√(L/g)', 120, 50);
        
        const period = 2 * Math.PI * Math.sqrt(this.params.length / this.params.gravity);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.fillText(`周期 T = ${period.toFixed(2)} 秒`, 150, 100);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        this.formulaSprite = new THREE.Sprite(spriteMat);
        this.formulaSprite.scale.set(8, 2, 1);
        this.formulaSprite.position.set(10, 5, 0);
        this.scene.add(this.formulaSprite);
    }

    createEnergyBars() {
        // 能量可视化容器
        const energyGroup = new THREE.Group();
        energyGroup.position.set(-12, 0, 0);
        
        // 动能条背景
        const keBg = new THREE.Mesh(
            new THREE.BoxGeometry(1, 10, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        keBg.position.set(0, 0, 0);
        energyGroup.add(keBg);
        
        // 动能条
        const keMat = new THREE.MeshBasicMaterial({ color: 0xff6644 });
        this.keBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.6), keMat);
        this.keBar.position.set(0, -4.9, 0);
        energyGroup.add(this.keBar);
        
        // 势能条背景
        const peBg = new THREE.Mesh(
            new THREE.BoxGeometry(1, 10, 0.5),
            new THREE.MeshBasicMaterial({ color: 0x333333 })
        );
        peBg.position.set(2, 0, 0);
        energyGroup.add(peBg);
        
        // 势能条
        const peMat = new THREE.MeshBasicMaterial({ color: 0x44ff66 });
        this.peBar = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.1, 0.6), peMat);
        this.peBar.position.set(2, -4.9, 0);
        energyGroup.add(this.peBar);
        
        this.scene.add(energyGroup);
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-toggle">
                <i class="fas fa-pause"></i> 暂停
            </button>
            <button class="control-btn" id="btn-length-up">
                <i class="fas fa-plus"></i> 增加摆长
            </button>
            <button class="control-btn" id="btn-length-down">
                <i class="fas fa-minus"></i> 减少摆长
            </button>
            <button class="control-btn" id="btn-push">
                <i class="fas fa-hand-pointer"></i> 推一下
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-toggle').onclick = () => this.toggleRunning();
        document.getElementById('btn-length-up').onclick = () => this.adjustLength(1);
        document.getElementById('btn-length-down').onclick = () => this.adjustLength(-1);
        document.getElementById('btn-push').onclick = () => this.pushPendulum();
        document.getElementById('btn-reset').onclick = () => this.resetPendulum();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    toggleRunning() {
        this.params.isRunning = !this.params.isRunning;
        const btn = document.getElementById('btn-toggle');
        btn.innerHTML = this.params.isRunning 
            ? '<i class="fas fa-pause"></i> 暂停' 
            : '<i class="fas fa-play"></i> 继续';
    }

    adjustLength(delta) {
        this.params.length = Math.max(3, Math.min(12, this.params.length + delta));
        
        // 更新摆线长度
        this.rod.geometry.dispose();
        this.rod.geometry = new THREE.CylinderGeometry(0.05, 0.05, this.params.length, 8);
        this.rod.position.set(0, -this.params.length / 2, 0);
        this.bob.position.set(0, -this.params.length, 0);
        
        // 更新公式显示
        const period = 2 * Math.PI * Math.sqrt(this.params.length / this.params.gravity);
        this.showGuide(`📏 摆长 L = ${this.params.length}m，周期 T = ${period.toFixed(2)}s`);
    }

    pushPendulum() {
        this.params.angularVelocity += 0.5;
        this.showGuide('👆 给了一个推力！');
    }

    resetPendulum() {
        this.params.angle = Math.PI / 6;
        this.params.angularVelocity = 0;
        this.pendulumGroup.rotation.z = this.params.angle;
        this.showGuide('🔄 单摆已重置');
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

    startAutoPlay() {
        this.isAutoPlaying = true;
        this.params.isRunning = true;
        setTimeout(() => {
            this.showGuide('🎯 观察单摆的简谐运动，注意周期与摆长的关系');
        }, 500);
    }

    showGuide(message) {
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

    highlightObject(target) {
        if (this.highlighted?.material?.emissive) {
            this.highlighted.material.emissive.setHex(this.highlighted.userData.originalEmissive || 0);
        }
        if (target.material?.emissive) {
            target.userData.originalEmissive = target.material.emissive.getHex();
            target.material.emissive.setHex(0x00ffff);
        }
        this.highlighted = target;
        gsap.to(target.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.15, yoyo: true, repeat: 1 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').innerHTML = `<i class="fas fa-info-circle mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time, delta) {
        if (!this.params.isRunning) return;
        
        // 简谐运动物理模拟
        const g = this.params.gravity;
        const L = this.params.length;
        
        // 角加速度 = -(g/L) * sin(θ)
        const angularAcceleration = -(g / L) * Math.sin(this.params.angle);
        
        // 更新角速度和角度
        this.params.angularVelocity += angularAcceleration * 0.016;
        this.params.angularVelocity *= this.params.damping;
        this.params.angle += this.params.angularVelocity * 0.016;
        
        // 应用旋转
        this.pendulumGroup.rotation.z = this.params.angle;
        
        // 更新能量条
        const maxAngle = Math.PI / 4;
        const keRatio = Math.pow(this.params.angularVelocity / 2, 2);
        const peRatio = (1 - Math.cos(this.params.angle)) / (1 - Math.cos(maxAngle));
        
        if (this.keBar) {
            this.keBar.scale.y = Math.max(0.1, keRatio * 100);
            this.keBar.position.y = -5 + this.keBar.scale.y * 0.05;
        }
        if (this.peBar) {
            this.peBar.scale.y = Math.max(0.1, peRatio * 100);
            this.peBar.position.y = -5 + this.peBar.scale.y * 0.05;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        if (this.formulaSprite) this.scene.remove(this.formulaSprite);
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
        if (this.highlighted?.material?.emissive) {
            this.highlighted.material.emissive.setHex(this.highlighted.userData.originalEmissive || 0);
            this.highlighted = null;
        }
    }

    createLabels(manager) {
        manager.createLabel('摆球', new THREE.Vector3(0, -4, 0), 'circle');
        manager.createLabel('悬挂点', new THREE.Vector3(0, 9, 0), 'dot-circle');
    }
};
