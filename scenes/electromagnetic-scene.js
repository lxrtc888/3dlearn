/**
 * 电磁感应场景 - 法拉第电磁感应定律
 * ============================================
 * 核心原理：
 * - 法拉第定律：ε = -dΦ/dt
 * - 楞次定律：感应电流产生的磁场阻碍原磁通量变化
 * - 磁通量变化产生感应电动势
 * ============================================
 */
window.ElectromagneticScene = class ElectromagneticScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 场景组件
        this.coil = null;
        this.magnet = null;
        this.fieldLines = [];
        this.currentArrows = [];
        this.meter = null;
        
        // 物理参数
        this.params = {
            magnetY: 5,
            magnetVelocity: 0,
            isMoving: false,
            direction: 1, // 1=向下, -1=向上
            inducedCurrent: 0
        };
        
        this.isAutoPlaying = false;
        this.defaultCameraPos = { x: 15, y: 8, z: 15 };
    }

    init() {
        this.camera.position.set(15, 8, 15);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x0a1020);
        this.scene.fog = new THREE.FogExp2(0x0a1020, 0.012);
        
        this.setupLights();
        this.setupEnvironment();
        this.setupScene();
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x303050, 0.6);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        const blueLight = new THREE.PointLight(0x4466ff, 2, 30);
        blueLight.position.set(-5, 5, 5);
        this.scene.add(blueLight);
        
        const redLight = new THREE.PointLight(0xff4444, 1.5, 20);
        redLight.position.set(5, 8, 0);
        this.scene.add(redLight);
    }

    setupEnvironment() {
        const grid = new THREE.GridHelper(40, 40, 0x334466, 0x1a1a2e);
        grid.position.y = -8;
        this.scene.add(grid);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建线圈
        this.createCoil();
        
        // 创建磁铁
        this.createMagnet();
        
        // 创建磁力线
        this.createFieldLines();
        
        // 创建电流指示
        this.createCurrentIndicator();
        
        // 创建电流表
        this.createMeter();
    }

    createCoil() {
        const coilGroup = new THREE.Group();
        
        // 线圈绕组
        const torusGeo = new THREE.TorusGeometry(3, 0.15, 8, 32);
        const coilMat = new THREE.MeshStandardMaterial({ 
            color: 0xcc8844, 
            metalness: 0.8, 
            roughness: 0.3 
        });
        
        for (let i = 0; i < 8; i++) {
            const ring = new THREE.Mesh(torusGeo, coilMat);
            ring.position.y = i * 0.4 - 1.4;
            ring.rotation.x = Math.PI / 2;
            coilGroup.add(ring);
        }
        
        // 线圈支架
        const standGeo = new THREE.CylinderGeometry(0.2, 0.3, 6, 16);
        const standMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const stand = new THREE.Mesh(standGeo, standMat);
        stand.position.set(4, -5, 0);
        coilGroup.add(stand);
        
        // 连接线
        const wireGeo = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
                new THREE.Vector3(3, -2, 0),
                new THREE.Vector3(5, -3, 0),
                new THREE.Vector3(8, -3, 0)
            ]), 20, 0.1, 8, false
        );
        const wireMat = new THREE.MeshStandardMaterial({ color: 0xcc8844 });
        const wire1 = new THREE.Mesh(wireGeo, wireMat);
        coilGroup.add(wire1);
        
        const wire2Geo = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3([
                new THREE.Vector3(-3, -2, 0),
                new THREE.Vector3(-5, -3, 0),
                new THREE.Vector3(-8, -3, 0)
            ]), 20, 0.1, 8, false
        );
        const wire2 = new THREE.Mesh(wire2Geo, wireMat);
        coilGroup.add(wire2);
        
        this.coil = coilGroup;
        this.coil.userData = {
            hoverTitle: '感应线圈',
            hoverDesc: '8匝铜线圈',
            hoverIcon: 'fa-ring',
            name: '感应线圈',
            description: `
                <p class="text-lg font-bold text-yellow-400 mb-3">🔄 感应线圈</p>
                <p class="text-gray-300 mb-3">由多匝导线绕制而成，当穿过线圈的磁通量发生变化时，会产生感应电动势。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">匝数: <span class="text-white">8 匝</span></p>
                    <p class="text-sm text-gray-400">感应电动势: <span class="text-white">ε = -N(dΦ/dt)</span></p>
                </div>
                <p class="text-sm text-blue-400">💡 匝数越多，感应电动势越大</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(this.coil);
        this.mainGroup.add(this.coil);
    }

    createMagnet() {
        const magnetGroup = new THREE.Group();
        
        // N极（红色）
        const nPoleGeo = new THREE.CylinderGeometry(1, 1, 2, 32);
        const nPoleMat = new THREE.MeshStandardMaterial({ 
            color: 0xff3333, 
            metalness: 0.6, 
            roughness: 0.4,
            emissive: 0x331111
        });
        const nPole = new THREE.Mesh(nPoleGeo, nPoleMat);
        nPole.position.y = 1;
        magnetGroup.add(nPole);
        
        // S极（蓝色）
        const sPoleMat = new THREE.MeshStandardMaterial({ 
            color: 0x3333ff, 
            metalness: 0.6, 
            roughness: 0.4,
            emissive: 0x111133
        });
        const sPole = new THREE.Mesh(nPoleGeo, sPoleMat);
        sPole.position.y = -1;
        magnetGroup.add(sPole);
        
        // N/S标签
        this.addPoleLabel(magnetGroup, 'N', 0xff6666, 1.5);
        this.addPoleLabel(magnetGroup, 'S', 0x6666ff, -1.5);
        
        magnetGroup.position.y = this.params.magnetY;
        
        this.magnet = magnetGroup;
        this.magnet.userData = {
            hoverTitle: '条形磁铁',
            hoverDesc: 'N极(红) / S极(蓝)',
            hoverIcon: 'fa-magnet',
            name: '条形磁铁',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">🧲 条形磁铁</p>
                <p class="text-gray-300 mb-3">永磁体，具有南北两极。移动磁铁会改变穿过线圈的磁通量。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm"><span class="text-red-400">■ N极</span> - 磁力线从此发出</p>
                    <p class="text-sm"><span class="text-blue-400">■ S极</span> - 磁力线进入此处</p>
                </div>
                <p class="text-sm text-green-400">✨ 磁铁运动速度越快，感应电流越大</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(this.magnet);
        this.mainGroup.add(this.magnet);
    }

    addPoleLabel(group, text, color, y) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.scale.set(1, 1, 1);
        sprite.position.set(1.5, y, 0);
        group.add(sprite);
    }

    createFieldLines() {
        // 磁力线
        const lineMat = new THREE.LineBasicMaterial({ 
            color: 0x88aaff, 
            transparent: true, 
            opacity: 0.6 
        });
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const points = [];
            
            for (let t = 0; t <= 1; t += 0.05) {
                const r = 0.5 + t * 3;
                const y = 2 - t * 6;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * r,
                    y,
                    Math.sin(angle) * r
                ));
            }
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geo = new THREE.TubeGeometry(curve, 20, 0.03, 8, false);
            const line = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ 
                color: 0x88aaff, 
                transparent: true, 
                opacity: 0.4 
            }));
            
            this.fieldLines.push(line);
            this.magnet.add(line);
        }
    }

    createCurrentIndicator() {
        // 电流方向箭头（环绕线圈）
        const arrowGroup = new THREE.Group();
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const arrowGeo = new THREE.ConeGeometry(0.2, 0.5, 8);
            const arrowMat = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0 });
            const arrow = new THREE.Mesh(arrowGeo, arrowMat);
            
            arrow.position.set(
                Math.cos(angle) * 3.5,
                0,
                Math.sin(angle) * 3.5
            );
            arrow.rotation.z = -Math.PI / 2;
            arrow.rotation.y = -angle;
            
            this.currentArrows.push(arrow);
            arrowGroup.add(arrow);
        }
        
        this.mainGroup.add(arrowGroup);
    }

    createMeter() {
        // 电流表
        const meterGroup = new THREE.Group();
        
        // 表盘
        const dialGeo = new THREE.CylinderGeometry(1.5, 1.5, 0.3, 32);
        const dialMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        const dial = new THREE.Mesh(dialGeo, dialMat);
        dial.rotation.x = Math.PI / 2;
        meterGroup.add(dial);
        
        // 表盘面
        const faceGeo = new THREE.CircleGeometry(1.4, 32);
        const faceMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
        const face = new THREE.Mesh(faceGeo, faceMat);
        face.position.z = 0.16;
        meterGroup.add(face);
        
        // 指针
        const needleGeo = new THREE.BoxGeometry(0.08, 1.2, 0.05);
        const needleMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.needle = new THREE.Mesh(needleGeo, needleMat);
        this.needle.position.set(0, 0.5, 0.2);
        this.needle.geometry.translate(0, -0.5, 0);
        meterGroup.add(this.needle);
        
        meterGroup.position.set(10, 0, 0);
        meterGroup.rotation.y = -Math.PI / 4;
        
        meterGroup.userData = {
            hoverTitle: '电流表',
            hoverDesc: '检测感应电流',
            hoverIcon: 'fa-tachometer-alt',
            name: '电流表',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">📊 电流表</p>
                <p class="text-gray-300 mb-3">检测线圈中产生的感应电流。</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">指针偏转方向指示电流方向</p>
                    <p class="text-sm text-gray-400">偏转角度反映电流大小</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(meterGroup);
        this.mainGroup.add(meterGroup);
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-push-down">
                <i class="fas fa-arrow-down"></i> 磁铁下移
            </button>
            <button class="control-btn" id="btn-push-up">
                <i class="fas fa-arrow-up"></i> 磁铁上移
            </button>
            <button class="control-btn" id="btn-auto">
                <i class="fas fa-sync"></i> 自动演示
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-push-down').onclick = () => this.moveMagnet(1);
        document.getElementById('btn-push-up').onclick = () => this.moveMagnet(-1);
        document.getElementById('btn-auto').onclick = () => this.autoDemo();
        document.getElementById('btn-reset').onclick = () => this.resetScene();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    moveMagnet(direction) {
        this.params.isMoving = true;
        this.params.direction = direction;
        this.params.magnetVelocity = direction * 0.15;
        
        this.showGuide(direction > 0 
            ? '⬇️ 磁铁向下移动，磁通量增加' 
            : '⬆️ 磁铁向上移动，磁通量减少');
    }

    autoDemo() {
        this.showGuide('🔄 自动演示：观察磁铁往复运动产生的感应电流');
        
        const animate = () => {
            gsap.to(this.magnet.position, {
                y: -3,
                duration: 1.5,
                ease: 'power2.inOut',
                onUpdate: () => { this.params.inducedCurrent = -0.5; },
                onComplete: () => {
                    gsap.to(this.magnet.position, {
                        y: 8,
                        duration: 1.5,
                        ease: 'power2.inOut',
                        onUpdate: () => { this.params.inducedCurrent = 0.5; },
                        onComplete: () => {
                            this.params.inducedCurrent = 0;
                        }
                    });
                }
            });
        };
        animate();
    }

    resetScene() {
        this.params.magnetY = 5;
        this.params.magnetVelocity = 0;
        this.params.inducedCurrent = 0;
        this.magnet.position.y = 5;
        this.showGuide('🔄 场景已重置');
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
        setTimeout(() => {
            this.showGuide('🧲 观察：磁铁穿过线圈时会产生感应电流');
            setTimeout(() => this.autoDemo(), 2000);
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
        this.highlighted = target;
        gsap.to(target.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').innerHTML = `<i class="fas fa-bolt mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time, delta) {
        // 磁铁移动
        if (this.params.isMoving) {
            this.magnet.position.y += this.params.magnetVelocity;
            
            // 计算感应电流（与速度成正比）
            this.params.inducedCurrent = this.params.magnetVelocity * 3;
            
            // 边界检测
            if (this.magnet.position.y < -5 || this.magnet.position.y > 10) {
                this.params.magnetVelocity *= -0.8;
            }
            
            // 阻尼
            this.params.magnetVelocity *= 0.98;
            if (Math.abs(this.params.magnetVelocity) < 0.01) {
                this.params.isMoving = false;
                this.params.inducedCurrent = 0;
            }
        }
        
        // 更新电流指示
        this.currentArrows.forEach(arrow => {
            arrow.material.opacity = Math.abs(this.params.inducedCurrent);
            arrow.material.color.setHex(this.params.inducedCurrent > 0 ? 0x00ff00 : 0xff6600);
        });
        
        // 更新电流表指针
        if (this.needle) {
            this.needle.rotation.z = -this.params.inducedCurrent * Math.PI / 3;
        }
        
        // 磁力线随磁铁移动
        this.fieldLines.forEach((line, i) => {
            line.rotation.y = time * 0.5;
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
    }

    createLabels(manager) {
        manager.createLabel('N极', new THREE.Vector3(0, 7, 0), 'magnet');
        manager.createLabel('线圈', new THREE.Vector3(0, 0, 4), 'ring');
    }
};
