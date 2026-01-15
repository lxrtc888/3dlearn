/**
 * 三维向量场景 - 空间向量可视化
 * ============================================
 * 核心知识点：
 * - 向量的坐标表示
 * - 向量加法（平行四边形法则）
 * - 向量点积与叉积
 * ============================================
 */
window.Vector3DScene = class Vector3DScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 向量
        this.vectorA = null;
        this.vectorB = null;
        this.vectorSum = null;
        this.vectorCross = null;
        
        // 向量数据
        this.vecA = new THREE.Vector3(4, 2, 1);
        this.vecB = new THREE.Vector3(1, 4, 2);
        
        this.isAutoPlaying = false;
        this.defaultCameraPos = { x: 12, y: 8, z: 12 };
        
        this.showSum = false;
        this.showCross = false;
    }

    init() {
        this.camera.position.set(12, 8, 12);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x0a0a15);
        this.scene.fog = new THREE.FogExp2(0x0a0a15, 0.02);
        
        this.setupLights();
        this.setupEnvironment();
        this.setupScene();
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x404050, 0.8);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
        mainLight.position.set(10, 15, 10);
        this.scene.add(mainLight);
    }

    setupEnvironment() {
        // 创建三维坐标轴
        this.createCoordinateSystem();
        
        // 地面网格
        const grid = new THREE.GridHelper(20, 20, 0x444466, 0x222233);
        this.scene.add(grid);
    }

    createCoordinateSystem() {
        const axisLength = 8;
        
        // X轴（红色）
        this.createAxis(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(axisLength, 0, 0),
            0xff4444,
            'X'
        );
        
        // Y轴（绿色）
        this.createAxis(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, axisLength, 0),
            0x44ff44,
            'Y'
        );
        
        // Z轴（蓝色）
        this.createAxis(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, axisLength),
            0x4444ff,
            'Z'
        );
        
        // 刻度
        this.createAxisTicks();
    }

    createAxis(start, end, color, label) {
        // 轴线
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        const cylinderGeo = new THREE.CylinderGeometry(0.05, 0.05, length, 8);
        const cylinderMat = new THREE.MeshStandardMaterial({ color });
        const cylinder = new THREE.Mesh(cylinderGeo, cylinderMat);
        
        cylinder.position.copy(start).add(direction.multiplyScalar(0.5));
        cylinder.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        this.scene.add(cylinder);
        
        // 箭头
        const coneGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
        const cone = new THREE.Mesh(coneGeo, cylinderMat);
        cone.position.copy(end);
        cone.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        this.scene.add(cone);
        
        // 标签
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.scale.set(1, 1, 1);
        sprite.position.copy(end).add(direction.clone().normalize().multiplyScalar(0.8));
        this.scene.add(sprite);
    }

    createAxisTicks() {
        const tickMat = new THREE.MeshBasicMaterial({ color: 0x666666 });
        
        for (let i = 1; i <= 7; i++) {
            // X轴刻度
            const tickX = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.02), tickMat);
            tickX.position.set(i, 0, 0);
            this.scene.add(tickX);
            
            // Y轴刻度
            const tickY = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.02, 0.02), tickMat);
            tickY.position.set(0, i, 0);
            this.scene.add(tickY);
            
            // Z轴刻度
            const tickZ = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.15, 0.02), tickMat);
            tickZ.position.set(0, 0, i);
            this.scene.add(tickZ);
        }
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建向量A（橙色）
        this.vectorA = this.createVector(
            new THREE.Vector3(0, 0, 0),
            this.vecA,
            0xff8800,
            'a'
        );
        
        // 创建向量B（青色）
        this.vectorB = this.createVector(
            new THREE.Vector3(0, 0, 0),
            this.vecB,
            0x00ccff,
            'b'
        );
        
        // 创建坐标标签
        this.createVectorLabels();
    }

    createVector(start, end, color, name) {
        const vectorGroup = new THREE.Group();
        
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        
        // 向量主体
        const bodyGeo = new THREE.CylinderGeometry(0.08, 0.08, length - 0.4, 12);
        const bodyMat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.2
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.copy(start).add(direction.clone().multiplyScalar((length - 0.4) / 2 / length));
        body.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        vectorGroup.add(body);
        
        // 箭头
        const headGeo = new THREE.ConeGeometry(0.2, 0.5, 12);
        const headMat = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.copy(end).sub(direction.clone().normalize().multiplyScalar(0.25));
        head.quaternion.setFromUnitVectors(
            new THREE.Vector3(0, 1, 0),
            direction.clone().normalize()
        );
        vectorGroup.add(head);
        
        // 起点球
        const startSphere = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 16, 16),
            new THREE.MeshStandardMaterial({ color: 0xffffff })
        );
        startSphere.position.copy(start);
        vectorGroup.add(startSphere);
        
        // 终点标注
        this.addVectorLabel(vectorGroup, name, end, color);
        
        vectorGroup.userData = {
            hoverTitle: `向量 ${name}`,
            hoverDesc: `(${end.x.toFixed(1)}, ${end.y.toFixed(1)}, ${end.z.toFixed(1)})`,
            hoverIcon: 'fa-arrow-right',
            name: `向量 ${name}`,
            description: `
                <p class="text-lg font-bold mb-3" style="color: #${color.toString(16).padStart(6, '0')}">➤ 向量 ${name}</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">坐标表示：</p>
                    <p class="text-lg text-center font-mono text-white">
                        ${name} = (${end.x}, ${end.y}, ${end.z})
                    </p>
                </div>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">模长 |${name}| = √(${end.x}² + ${end.y}² + ${end.z}²)</p>
                    <p class="text-sm text-white">= ${length.toFixed(2)}</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(vectorGroup);
        this.mainGroup.add(vectorGroup);
        
        return vectorGroup;
    }

    addVectorLabel(group, text, position, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.roundRect(0, 0, 128, 64, 8);
        ctx.fill();
        
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, 64, 42);
        
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.scale.set(1.5, 0.75, 1);
        sprite.position.copy(position).add(new THREE.Vector3(0.5, 0.5, 0));
        group.add(sprite);
    }

    createVectorLabels() {
        // 创建公式面板
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 250;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(20, 25, 40, 0.95)';
        ctx.roundRect(0, 0, 400, 250, 12);
        ctx.fill();
        
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.roundRect(0, 0, 400, 250, 12);
        ctx.stroke();
        
        ctx.fillStyle = '#60a5fa';
        ctx.font = 'bold 20px Arial';
        ctx.fillText('向量运算', 150, 35);
        
        ctx.fillStyle = '#ff8800';
        ctx.font = '18px Arial';
        ctx.fillText(`a = (${this.vecA.x}, ${this.vecA.y}, ${this.vecA.z})`, 30, 75);
        
        ctx.fillStyle = '#00ccff';
        ctx.fillText(`b = (${this.vecB.x}, ${this.vecB.y}, ${this.vecB.z})`, 30, 105);
        
        ctx.fillStyle = '#44ff44';
        const sum = new THREE.Vector3().addVectors(this.vecA, this.vecB);
        ctx.fillText(`a + b = (${sum.x}, ${sum.y}, ${sum.z})`, 30, 145);
        
        ctx.fillStyle = '#ff44ff';
        const cross = new THREE.Vector3().crossVectors(this.vecA, this.vecB);
        ctx.fillText(`a × b = (${cross.x}, ${cross.y}, ${cross.z})`, 30, 180);
        
        ctx.fillStyle = '#ffff44';
        const dot = this.vecA.dot(this.vecB);
        ctx.fillText(`a · b = ${dot}`, 30, 215);
        
        const texture = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        sprite.scale.set(8, 5, 1);
        sprite.position.set(-8, 6, 0);
        this.scene.add(sprite);
        this.formulaSprite = sprite;
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-show-sum">
                <i class="fas fa-plus"></i> 向量加法
            </button>
            <button class="control-btn" id="btn-show-cross">
                <i class="fas fa-times"></i> 叉积
            </button>
            <button class="control-btn" id="btn-parallel">
                <i class="fas fa-arrows-alt-h"></i> 平行四边形
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-show-sum').onclick = () => this.showVectorSum();
        document.getElementById('btn-show-cross').onclick = () => this.showVectorCross();
        document.getElementById('btn-parallel').onclick = () => this.showParallelogram();
        document.getElementById('btn-reset').onclick = () => this.resetVectors();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    showVectorSum() {
        if (this.vectorSum) {
            this.mainGroup.remove(this.vectorSum);
        }
        
        const sum = new THREE.Vector3().addVectors(this.vecA, this.vecB);
        this.vectorSum = this.createVector(
            new THREE.Vector3(0, 0, 0),
            sum,
            0x44ff44,
            'a+b'
        );
        
        this.showGuide('✚ 向量加法：a + b = (' + sum.x + ', ' + sum.y + ', ' + sum.z + ')');
    }

    showVectorCross() {
        if (this.vectorCross) {
            this.mainGroup.remove(this.vectorCross);
        }
        
        const cross = new THREE.Vector3().crossVectors(this.vecA, this.vecB);
        this.vectorCross = this.createVector(
            new THREE.Vector3(0, 0, 0),
            cross,
            0xff44ff,
            'a×b'
        );
        
        this.showGuide('✖ 叉积：垂直于 a 和 b 的向量');
    }

    showParallelogram() {
        // 显示平行四边形
        if (this.parallelogram) {
            this.mainGroup.remove(this.parallelogram);
        }
        
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            0, 0, 0,
            this.vecA.x, this.vecA.y, this.vecA.z,
            this.vecA.x + this.vecB.x, this.vecA.y + this.vecB.y, this.vecA.z + this.vecB.z,
            this.vecB.x, this.vecB.y, this.vecB.z
        ]);
        const indices = [0, 1, 2, 0, 2, 3];
        
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        
        const material = new THREE.MeshBasicMaterial({
            color: 0x44ff44,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        this.parallelogram = new THREE.Mesh(geometry, material);
        this.mainGroup.add(this.parallelogram);
        
        this.showGuide('▱ 平行四边形法则：对角线即为 a + b');
    }

    resetVectors() {
        if (this.vectorSum) {
            this.mainGroup.remove(this.vectorSum);
            this.vectorSum = null;
        }
        if (this.vectorCross) {
            this.mainGroup.remove(this.vectorCross);
            this.vectorCross = null;
        }
        if (this.parallelogram) {
            this.mainGroup.remove(this.parallelogram);
            this.parallelogram = null;
        }
        this.showGuide('🔄 已重置');
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
            this.showGuide('📐 三维向量：观察向量在空间中的表示');
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
        this.highlighted = target;
        gsap.to(target.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.15, yoyo: true, repeat: 1 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').innerHTML = `<i class="fas fa-vector-square mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time, delta) {
        // 轻微旋转
        // this.mainGroup.rotation.y = Math.sin(time * 0.2) * 0.1;
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
    }

    createLabels(manager) {
        manager.createLabel('原点 O', new THREE.Vector3(-0.5, -0.5, -0.5), 'dot-circle');
    }
};
