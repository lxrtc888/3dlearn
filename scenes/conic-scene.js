/**
 * 圆锥曲线截面场景 - 椭圆/双曲线/抛物线
 * ============================================
 * 核心知识点：
 * - 圆锥曲线的几何定义
 * - 平面与圆锥的交截关系
 * - 离心率与曲线形状的关系
 * ============================================
 */
window.ConicScene = class ConicScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 场景元素
        this.cone = null;
        this.cuttingPlane = null;
        this.intersectionCurve = null;
        
        // 参数
        this.params = {
            planeAngle: 45, // 切割角度（度）
            curveType: 'ellipse' // ellipse, parabola, hyperbola, circle
        };
        
        this.isAutoPlaying = false;
        this.defaultCameraPos = { x: 15, y: 10, z: 15 };
    }

    init() {
        this.camera.position.set(15, 10, 15);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x0a0a18);
        this.scene.fog = new THREE.FogExp2(0x0a0a18, 0.012);
        
        this.setupLights();
        this.setupEnvironment();
        this.setupScene();
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.8);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        const blueLight = new THREE.PointLight(0x4488ff, 1, 30);
        blueLight.position.set(-10, 5, 10);
        this.scene.add(blueLight);
    }

    setupEnvironment() {
        const grid = new THREE.GridHelper(30, 30, 0x334466, 0x1a1a2e);
        grid.position.y = -10;
        this.scene.add(grid);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建双圆锥
        this.createDoubleCone();
        
        // 创建切割平面
        this.createCuttingPlane();
        
        // 创建交线
        this.updateIntersection();
        
        // 创建说明标签
        this.createInfoLabels();
    }

    createDoubleCone() {
        const coneHeight = 10;
        const coneRadius = 6;
        
        // 上圆锥
        const coneGeo1 = new THREE.ConeGeometry(coneRadius, coneHeight, 64, 1, true);
        const coneMat = new THREE.MeshPhysicalMaterial({
            color: 0x4488cc,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            roughness: 0.2,
            metalness: 0.1
        });
        
        const cone1 = new THREE.Mesh(coneGeo1, coneMat);
        cone1.position.y = coneHeight / 2;
        this.mainGroup.add(cone1);
        
        // 下圆锥
        const cone2 = new THREE.Mesh(coneGeo1, coneMat);
        cone2.position.y = -coneHeight / 2;
        cone2.rotation.x = Math.PI;
        this.mainGroup.add(cone2);
        
        // 圆锥线框
        const wireframeMat = new THREE.LineBasicMaterial({ color: 0x66aaff, transparent: true, opacity: 0.5 });
        
        // 母线
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const points = [
                new THREE.Vector3(0, coneHeight, 0),
                new THREE.Vector3(Math.cos(angle) * coneRadius, 0, Math.sin(angle) * coneRadius),
                new THREE.Vector3(0, -coneHeight, 0)
            ];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geo, wireframeMat);
            this.mainGroup.add(line);
        }
        
        this.cone = { cone1, cone2, height: coneHeight, radius: coneRadius };
        
        // 圆锥交互数据
        cone1.userData = {
            hoverTitle: '圆锥面',
            hoverDesc: '由直线绕轴旋转而成',
            hoverIcon: 'fa-mountain',
            name: '圆锥面',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🔷 圆锥面</p>
                <p class="text-gray-300 mb-3">由一条直线（母线）绕一条与其相交的直线（轴）旋转形成的曲面。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">圆锥曲线由平面与圆锥面的交线确定</p>
                </div>
                <p class="text-sm text-yellow-400">💡 不同角度的切割产生不同的曲线</p>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(cone1);
    }

    createCuttingPlane() {
        const planeSize = 12;
        const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
        const planeMat = new THREE.MeshPhysicalMaterial({
            color: 0xff8844,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            roughness: 0.3
        });
        
        this.cuttingPlane = new THREE.Mesh(planeGeo, planeMat);
        this.updatePlaneAngle();
        
        this.cuttingPlane.userData = {
            hoverTitle: '切割平面',
            hoverDesc: '改变角度观察不同曲线',
            hoverIcon: 'fa-square',
            name: '切割平面',
            description: `
                <p class="text-lg font-bold text-orange-400 mb-3">📐 切割平面</p>
                <p class="text-gray-300 mb-3">平面与圆锥面的交线形成圆锥曲线。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white mb-2">切割角度决定曲线类型：</p>
                    <p class="text-sm text-gray-400">• 垂直轴 → 圆</p>
                    <p class="text-sm text-gray-400">• 倾斜（不穿过顶点）→ 椭圆</p>
                    <p class="text-sm text-gray-400">• 平行母线 → 抛物线</p>
                    <p class="text-sm text-gray-400">• 平行轴 → 双曲线</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(this.cuttingPlane);
        this.mainGroup.add(this.cuttingPlane);
    }

    updatePlaneAngle() {
        const angleRad = (this.params.planeAngle * Math.PI) / 180;
        this.cuttingPlane.rotation.x = angleRad;
        this.cuttingPlane.position.y = 0;
    }

    updateIntersection() {
        // 移除旧的交线
        if (this.intersectionCurve) {
            this.mainGroup.remove(this.intersectionCurve);
        }
        
        // 根据角度创建不同的曲线
        const angle = this.params.planeAngle;
        let curvePoints = [];
        let curveColor = 0x44ff88;
        let curveName = '';
        
        if (angle === 90) {
            // 圆
            curvePoints = this.createCirclePoints();
            curveName = '圆';
            this.params.curveType = 'circle';
        } else if (angle > 60 && angle < 90) {
            // 椭圆
            curvePoints = this.createEllipsePoints();
            curveName = '椭圆';
            this.params.curveType = 'ellipse';
        } else if (angle === 60) {
            // 抛物线（平行于母线）
            curvePoints = this.createParabolaPoints();
            curveName = '抛物线';
            curveColor = 0xff44ff;
            this.params.curveType = 'parabola';
        } else {
            // 双曲线
            curvePoints = this.createHyperbolaPoints();
            curveName = '双曲线';
            curveColor = 0xffff44;
            this.params.curveType = 'hyperbola';
        }
        
        if (curvePoints.length > 0) {
            const curve = new THREE.CatmullRomCurve3(curvePoints);
            const tubeGeo = new THREE.TubeGeometry(curve, 100, 0.15, 8, this.params.curveType === 'circle' || this.params.curveType === 'ellipse');
            const tubeMat = new THREE.MeshStandardMaterial({
                color: curveColor,
                emissive: curveColor,
                emissiveIntensity: 0.5
            });
            
            this.intersectionCurve = new THREE.Mesh(tubeGeo, tubeMat);
            
            this.intersectionCurve.userData = {
                hoverTitle: curveName,
                hoverDesc: '平面与圆锥的交线',
                hoverIcon: 'fa-bezier-curve',
                name: curveName,
                description: this.getCurveDescription(this.params.curveType),
                onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
            };
            this.interactables.push(this.intersectionCurve);
            this.mainGroup.add(this.intersectionCurve);
        }
        
        // 更新标签
        this.updateCurveLabel(curveName);
    }

    createCirclePoints() {
        const points = [];
        const radius = 3;
        for (let i = 0; i <= 64; i++) {
            const t = (i / 64) * Math.PI * 2;
            points.push(new THREE.Vector3(
                Math.cos(t) * radius,
                3,
                Math.sin(t) * radius
            ));
        }
        return points;
    }

    createEllipsePoints() {
        const points = [];
        const a = 4; // 长轴
        const b = 2.5; // 短轴
        for (let i = 0; i <= 64; i++) {
            const t = (i / 64) * Math.PI * 2;
            const y = Math.cos(t) * b;
            points.push(new THREE.Vector3(
                Math.cos(t) * a,
                y + 2,
                Math.sin(t) * a * 0.6
            ));
        }
        return points;
    }

    createParabolaPoints() {
        const points = [];
        for (let i = -30; i <= 30; i++) {
            const t = i / 10;
            points.push(new THREE.Vector3(
                t * 1.5,
                t * t * 0.3,
                0
            ));
        }
        return points;
    }

    createHyperbolaPoints() {
        const points = [];
        // 一支
        for (let i = -20; i <= 20; i++) {
            const t = i / 10;
            if (Math.abs(t) > 0.5) {
                points.push(new THREE.Vector3(
                    t * 2,
                    Math.sqrt(t * t - 0.25) * 2 + 3,
                    0
                ));
            }
        }
        return points;
    }

    getCurveDescription(type) {
        const descriptions = {
            circle: `
                <p class="text-lg font-bold text-green-400 mb-3">⭕ 圆</p>
                <p class="text-gray-300 mb-3">平面垂直于圆锥轴时的截线。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">标准方程：x² + y² = r²</p>
                    <p class="text-sm text-gray-400 mt-2">离心率 e = 0</p>
                </div>
            `,
            ellipse: `
                <p class="text-lg font-bold text-green-400 mb-3">⬭ 椭圆</p>
                <p class="text-gray-300 mb-3">平面斜切圆锥（不穿过顶点）形成。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">标准方程：x²/a² + y²/b² = 1</p>
                    <p class="text-sm text-gray-400 mt-2">离心率 0 < e < 1</p>
                </div>
                <p class="text-sm text-yellow-400">💡 地球绕太阳的轨道是椭圆</p>
            `,
            parabola: `
                <p class="text-lg font-bold text-pink-400 mb-3">⌒ 抛物线</p>
                <p class="text-gray-300 mb-3">平面平行于圆锥母线时的截线。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">标准方程：y² = 4px</p>
                    <p class="text-sm text-gray-400 mt-2">离心率 e = 1</p>
                </div>
                <p class="text-sm text-yellow-400">💡 篮球投篮轨迹是抛物线</p>
            `,
            hyperbola: `
                <p class="text-lg font-bold text-yellow-400 mb-3">⟩⟨ 双曲线</p>
                <p class="text-gray-300 mb-3">平面平行于圆锥轴时的截线，穿过两个锥面。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white">标准方程：x²/a² - y²/b² = 1</p>
                    <p class="text-sm text-gray-400 mt-2">离心率 e > 1</p>
                </div>
                <p class="text-sm text-yellow-400">💡 双曲线有两条渐近线</p>
            `
        };
        return descriptions[type];
    }

    updateCurveLabel(curveName) {
        if (this.curveLabel) {
            this.scene.remove(this.curveLabel);
        }
        
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 80;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(20, 25, 40, 0.95)';
        ctx.roundRect(0, 0, 256, 80, 10);
        ctx.fill();
        
        ctx.fillStyle = '#44ff88';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(curveName, 128, 50);
        
        const texture = new THREE.CanvasTexture(canvas);
        this.curveLabel = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
        this.curveLabel.scale.set(5, 1.5, 1);
        this.curveLabel.position.set(0, 12, 0);
        this.scene.add(this.curveLabel);
    }

    createInfoLabels() {
        // 轴标签
        const axisLabel = new THREE.Sprite(new THREE.SpriteMaterial({
            map: this.createTextTexture('轴', 0x888888)
        }));
        axisLabel.scale.set(1, 1, 1);
        axisLabel.position.set(1, 10, 0);
        this.scene.add(axisLabel);
    }

    createTextTexture(text, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = '36px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        return new THREE.CanvasTexture(canvas);
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn active" id="btn-ellipse">
                <i class="fas fa-circle"></i> 椭圆
            </button>
            <button class="control-btn" id="btn-parabola">
                <i class="fas fa-wave-square"></i> 抛物线
            </button>
            <button class="control-btn" id="btn-hyperbola">
                <i class="fas fa-code-branch"></i> 双曲线
            </button>
            <button class="control-btn" id="btn-circle">
                <i class="fas fa-dot-circle"></i> 圆
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-ellipse').onclick = () => this.setCurveType('ellipse', 75);
        document.getElementById('btn-parabola').onclick = () => this.setCurveType('parabola', 60);
        document.getElementById('btn-hyperbola').onclick = () => this.setCurveType('hyperbola', 30);
        document.getElementById('btn-circle').onclick = () => this.setCurveType('circle', 90);
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    setCurveType(type, angle) {
        // 更新按钮状态
        document.querySelectorAll('#scene-controls .control-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.getElementById('btn-' + type).classList.add('active');
        
        // 动画过渡
        this.params.planeAngle = angle;
        
        gsap.to(this.cuttingPlane.rotation, {
            x: (angle * Math.PI) / 180,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => {
                this.updateIntersection();
            }
        });
        
        const names = { ellipse: '椭圆', parabola: '抛物线', hyperbola: '双曲线', circle: '圆' };
        this.showGuide(`📐 切换到${names[type]}：切割角度 ${angle}°`);
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
            this.showGuide('📐 圆锥曲线：观察不同角度切割产生的曲线');
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
        gsap.to(target.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').innerHTML = `<i class="fas fa-draw-polygon mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time, delta) {
        // 主体缓慢旋转
        this.mainGroup.rotation.y = time * 0.1;
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        if (this.curveLabel) this.scene.remove(this.curveLabel);
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
    }

    createLabels(manager) {
        manager.createLabel('顶点', new THREE.Vector3(0, 0.5, 0), 'dot-circle');
    }
};
