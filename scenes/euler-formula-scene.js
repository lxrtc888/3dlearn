/**
 * 欧拉公式场景 - Euler's Identity Visualization
 * ============================================
 * e^(iπ) + 1 = 0
 * "宇宙中最美的数学公式"
 * 
 * 几何意义：
 * - e^(iθ) = cos(θ) + i·sin(θ)
 * - 在复平面的单位圆上旋转
 * - θ = π 时，正好到达 -1
 * - 加上 1 就是 0
 * 
 * 五个最重要的数学常数汇聚：
 * e - 自然对数的底
 * i - 虚数单位  
 * π - 圆周率
 * 1 - 乘法单位元
 * 0 - 加法单位元
 * ============================================
 */
window.EulerFormulaScene = class EulerFormulaScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.complexPlane = null;       // 复平面
        this.unitCircle = null;         // 单位圆
        this.rotatingPoint = null;      // 旋转的点
        this.trailPoints = [];          // 轨迹点
        this.trail = null;              // 轨迹线
        this.axisLabels = [];           // 轴标签
        this.numberSprites = {};        // 五个数字精灵
        this.formulaGroup = null;       // 公式组
        this.particles = [];            // 粒子效果

        // 参数
        this.params = {
            theta: 0,                   // 当前角度
            targetTheta: 0,             // 目标角度
            isAnimating: false,         // 是否正在动画
            autoRotate: false,          // 自动旋转
            showFormula: false,         // 显示公式
            celebrationMode: false,     // 庆祝模式
            trailLength: 300            // 轨迹长度
        };

        // 颜色主题 - 彩虹渐变
        this.colors = {
            real: 0x00ff88,             // 实轴 - 绿色
            imaginary: 0xff6b9d,        // 虚轴 - 粉色
            circle: 0x00d4ff,           // 单位圆 - 青色
            point: 0xffd700,            // 旋转点 - 金色
            e: 0xff6b6b,                // e - 红色
            i: 0x4ecdc4,                // i - 青绿
            pi: 0xa855f7,               // π - 紫色
            one: 0xffd93d,              // 1 - 黄色
            zero: 0x6bcb77              // 0 - 绿色
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 12, z: 18 };
        
        this.isAutoPlaying = false;
    }

    /**
     * 初始化场景
     */
    init() {
        // 设置相机
        this.camera.position.set(
            this.defaultCameraPos.x,
            this.defaultCameraPos.y,
            this.defaultCameraPos.z
        );
        this.camera.lookAt(0, 0, 0);

        // 背景 - 深邃星空
        this.scene.background = new THREE.Color(0x030510);
        this.scene.fog = new THREE.FogExp2(0x030510, 0.008);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0x222244, 0.4);
        this.scene.add(ambient);

        // 主光源
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);

        // 彩色氛围光
        const purpleLight = new THREE.PointLight(0xa855f7, 1, 50);
        purpleLight.position.set(-15, 10, 0);
        this.scene.add(purpleLight);

        const cyanLight = new THREE.PointLight(0x00d4ff, 1, 50);
        cyanLight.position.set(15, 10, 0);
        this.scene.add(cyanLight);

        const goldLight = new THREE.PointLight(0xffd700, 0.8, 30);
        goldLight.position.set(0, 5, 15);
        this.scene.add(goldLight);
    }

    /**
     * 创建场景内容
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建星空背景
        this.createStarField();

        // 创建复平面
        this.createComplexPlane();

        // 创建单位圆
        this.createUnitCircle();

        // 创建坐标轴标签
        this.createAxisLabels();

        // 创建旋转点
        this.createRotatingPoint();

        // 创建轨迹
        this.createTrail();

        // 创建五个数字
        this.createFiveNumbers();

        // 创建公式显示
        this.createFormulaDisplay();

        // 创建信息面板内容
        this.createInfoDisplay();

        // 创建庆祝粒子
        this.createCelebrationParticles();
    }

    /**
     * 创建星空背景
     */
    createStarField() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 2000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            const r = 60 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = r * Math.cos(phi);

            // 彩色星星
            const hue = Math.random();
            const color = new THREE.Color().setHSL(hue, 0.5, 0.8);
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMat = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        const stars = new THREE.Points(starGeo, starMat);
        this.scene.add(stars);
        this.stars = stars;
    }

    /**
     * 创建复平面
     */
    createComplexPlane() {
        const planeGroup = new THREE.Group();

        // 网格平面
        const gridSize = 16;
        const gridDivisions = 16;
        const grid = new THREE.GridHelper(gridSize, gridDivisions, 0x333366, 0x222244);
        grid.rotation.x = Math.PI / 2;
        planeGroup.add(grid);

        // 实轴（Re）- 绿色
        const realAxisGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-8, 0, 0),
            new THREE.Vector3(8, 0, 0)
        ]);
        const realAxisMat = new THREE.LineBasicMaterial({ 
            color: this.colors.real, 
            linewidth: 3 
        });
        const realAxis = new THREE.Line(realAxisGeo, realAxisMat);
        planeGroup.add(realAxis);

        // 实轴箭头
        const realArrowGeo = new THREE.ConeGeometry(0.15, 0.4, 8);
        const realArrowMat = new THREE.MeshBasicMaterial({ color: this.colors.real });
        const realArrow = new THREE.Mesh(realArrowGeo, realArrowMat);
        realArrow.position.set(8, 0, 0);
        realArrow.rotation.z = -Math.PI / 2;
        planeGroup.add(realArrow);

        // 虚轴（Im）- 粉色
        const imagAxisGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -8),
            new THREE.Vector3(0, 0, 8)
        ]);
        const imagAxisMat = new THREE.LineBasicMaterial({ 
            color: this.colors.imaginary, 
            linewidth: 3 
        });
        const imagAxis = new THREE.Line(imagAxisGeo, imagAxisMat);
        planeGroup.add(imagAxis);

        // 虚轴箭头
        const imagArrow = new THREE.Mesh(realArrowGeo.clone(), 
            new THREE.MeshBasicMaterial({ color: this.colors.imaginary }));
        imagArrow.position.set(0, 0, 8);
        imagArrow.rotation.x = Math.PI / 2;
        planeGroup.add(imagArrow);

        // 原点标记
        const originGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const originMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const origin = new THREE.Mesh(originGeo, originMat);
        planeGroup.add(origin);

        // 关键点标记
        this.createKeyPoints(planeGroup);

        this.complexPlane = planeGroup;
        this.mainGroup.add(planeGroup);
    }

    /**
     * 创建关键点（1, -1, i, -i）
     */
    createKeyPoints(parent) {
        const R = 5; // 单位圆半径（视觉上的）
        const points = [
            { pos: [R, 0, 0], label: '1', color: this.colors.one },
            { pos: [-R, 0, 0], label: '-1', color: 0xff4444 },
            { pos: [0, 0, R], label: 'i', color: this.colors.i },
            { pos: [0, 0, -R], label: '-i', color: 0xff88aa }
        ];

        points.forEach(p => {
            // 点
            const dotGeo = new THREE.SphereGeometry(0.2, 16, 16);
            const dotMat = new THREE.MeshBasicMaterial({ color: p.color });
            const dot = new THREE.Mesh(dotGeo, dotMat);
            dot.position.set(...p.pos);
            parent.add(dot);

            // 标签
            const label = this.createTextSprite(p.label, p.color);
            label.position.set(p.pos[0] * 1.3, 0.5, p.pos[2] * 1.3);
            label.scale.set(1.5, 0.75, 1);
            parent.add(label);

            // 交互
            dot.userData = {
                hoverTitle: p.label,
                hoverDesc: p.label === '1' ? '起点，θ=0' : 
                          p.label === '-1' ? '终点，θ=π' :
                          p.label === 'i' ? '虚数单位，θ=π/2' : 'θ=3π/2',
                hoverIcon: 'fa-circle',
                name: `点 ${p.label}`,
                description: this.getPointDescription(p.label),
                onClick: (target) => {
                    this.highlightObject(target);
                    this.showInfoPanel(target);
                }
            };
            this.interactables.push(dot);
        });
    }

    /**
     * 获取点的描述
     */
    getPointDescription(label) {
        const descriptions = {
            '1': `
                <p class="text-lg font-bold text-yellow-400 mb-3">📍 点 1（起点）</p>
                <p class="text-gray-300 mb-3">位于实轴正方向，是旋转的起点。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">数学表示：</p>
                    <p class="text-sm text-white font-mono">e^(i·0) = cos(0) + i·sin(0) = 1</p>
                    <p class="text-sm text-cyan-400 mt-2">θ = 0 时在这里</p>
                </div>
            `,
            '-1': `
                <p class="text-lg font-bold text-red-400 mb-3">🎯 点 -1（终点）</p>
                <p class="text-gray-300 mb-3">位于实轴负方向，是欧拉公式的关键！</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">⭐ 核心公式：</p>
                    <p class="text-sm text-white font-mono">e^(iπ) = cos(π) + i·sin(π) = -1</p>
                    <p class="text-sm text-green-400 mt-2">θ = π 时正好到达这里！</p>
                </div>
                <p class="text-sm text-purple-400">💡 所以 e^(iπ) + 1 = 0</p>
            `,
            'i': `
                <p class="text-lg font-bold text-cyan-400 mb-3">✨ 点 i（虚数单位）</p>
                <p class="text-gray-300 mb-3">虚轴正方向，i² = -1</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">数学表示：</p>
                    <p class="text-sm text-white font-mono">e^(i·π/2) = cos(π/2) + i·sin(π/2) = i</p>
                    <p class="text-sm text-cyan-400 mt-2">θ = π/2 时在这里</p>
                </div>
            `,
            '-i': `
                <p class="text-lg font-bold text-pink-400 mb-3">💫 点 -i</p>
                <p class="text-gray-300 mb-3">虚轴负方向。</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-white font-mono">e^(i·3π/2) = -i</p>
                    <p class="text-sm text-cyan-400 mt-2">θ = 3π/2 时在这里</p>
                </div>
            `
        };
        return descriptions[label] || '';
    }

    /**
     * 创建单位圆
     */
    createUnitCircle() {
        const R = 5;
        const circleGroup = new THREE.Group();

        // 主圆环
        const circleGeo = new THREE.TorusGeometry(R, 0.08, 16, 128);
        const circleMat = new THREE.MeshBasicMaterial({
            color: this.colors.circle,
            transparent: true,
            opacity: 0.8
        });
        const circle = new THREE.Mesh(circleGeo, circleMat);
        circle.rotation.x = Math.PI / 2;
        circleGroup.add(circle);

        // 发光光晕
        const glowGeo = new THREE.TorusGeometry(R, 0.3, 16, 128);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.colors.circle,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.rotation.x = Math.PI / 2;
        circleGroup.add(glow);

        // 交互
        circle.userData = {
            hoverTitle: '单位圆',
            hoverDesc: '|e^(iθ)| = 1，所有点到原点距离为1',
            hoverIcon: 'fa-circle-notch',
            name: '单位圆',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">⭕ 单位圆</p>
                <p class="text-gray-300 mb-3">复平面上所有模为1的点组成的圆。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">⭐ 欧拉公式：</p>
                    <p class="text-sm text-white font-mono">e^(iθ) = cos(θ) + i·sin(θ)</p>
                    <p class="text-xs text-gray-500 mt-2">θ 是与正实轴的夹角</p>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">几何意义：</p>
                    <p class="text-sm text-white">e^(iθ) 就是在单位圆上逆时针旋转 θ 弧度！</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(circle);

        this.unitCircle = circleGroup;
        this.mainGroup.add(circleGroup);
    }

    /**
     * 创建坐标轴标签
     */
    createAxisLabels() {
        // Re（实轴）标签
        const reLabel = this.createTextSprite('Re（实轴）', this.colors.real);
        reLabel.position.set(7, 1, 0);
        reLabel.scale.set(2.5, 1, 1);
        this.mainGroup.add(reLabel);

        // Im（虚轴）标签
        const imLabel = this.createTextSprite('Im（虚轴）', this.colors.imaginary);
        imLabel.position.set(0, 1, 7);
        imLabel.scale.set(2.5, 1, 1);
        this.mainGroup.add(imLabel);
    }

    /**
     * 创建旋转点
     */
    createRotatingPoint() {
        const R = 5;
        const pointGroup = new THREE.Group();

        // 核心点
        const coreGeo = new THREE.SphereGeometry(0.35, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: this.colors.point
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        pointGroup.add(core);

        // 多层光晕
        for (let i = 0; i < 3; i++) {
            const glowGeo = new THREE.SphereGeometry(0.5 + i * 0.25, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
                color: this.colors.point,
                transparent: true,
                opacity: 0.3 - i * 0.1
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            pointGroup.add(glow);
        }

        // 从原点到点的连线
        const lineGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(R, 0, 0)
        ]);
        const lineMat = new THREE.LineBasicMaterial({
            color: this.colors.point,
            transparent: true,
            opacity: 0.5
        });
        const line = new THREE.Line(lineGeo, lineMat);
        pointGroup.add(line);
        this.radiusLine = line;

        // 初始位置
        pointGroup.position.set(R, 0.3, 0);

        // 交互
        core.userData = {
            hoverTitle: 'e^(iθ)',
            hoverDesc: '在单位圆上旋转的点',
            hoverIcon: 'fa-dot-circle',
            name: 'e^(iθ) 旋转点',
            description: `
                <p class="text-lg font-bold text-yellow-400 mb-3">✨ 旋转点 e^(iθ)</p>
                <p class="text-gray-300 mb-3">随着 θ 增加，沿单位圆逆时针旋转。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">当前位置：</p>
                    <p class="text-sm text-white font-mono" id="current-position">θ = 0</p>
                    <p class="text-sm text-cyan-400" id="current-value">e^(i·0) = 1</p>
                </div>
                <p class="text-sm text-purple-400">🎮 拖动下方滑块控制 θ 值！</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(core);

        this.rotatingPoint = pointGroup;
        this.mainGroup.add(pointGroup);
    }

    /**
     * 创建轨迹
     */
    createTrail() {
        const maxPoints = this.params.trailLength;
        const positions = new Float32Array(maxPoints * 3);
        const colors = new Float32Array(maxPoints * 3);

        const trailGeo = new THREE.BufferGeometry();
        trailGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        trailGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        trailGeo.setDrawRange(0, 0);

        const trailMat = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });

        this.trail = new THREE.Line(trailGeo, trailMat);
        this.trail.position.y = 0.3;
        this.mainGroup.add(this.trail);
    }

    /**
     * 创建五个数字
     */
    createFiveNumbers() {
        const numbers = [
            { symbol: 'e', color: this.colors.e, pos: [-6, 5, -4], desc: '自然对数的底，约2.718' },
            { symbol: 'i', color: this.colors.i, pos: [-3, 6, -3], desc: '虚数单位，i² = -1' },
            { symbol: 'π', color: this.colors.pi, pos: [0, 7, -2], desc: '圆周率，约3.14159' },
            { symbol: '1', color: this.colors.one, pos: [3, 6, -3], desc: '乘法单位元' },
            { symbol: '0', color: this.colors.zero, pos: [6, 5, -4], desc: '加法单位元' }
        ];

        numbers.forEach((n, index) => {
            const sprite = this.createGlowingNumber(n.symbol, n.color);
            sprite.position.set(...n.pos);
            sprite.scale.set(2, 2, 1);
            sprite.userData.baseY = n.pos[1];
            sprite.userData.phaseOffset = index * 0.5;
            sprite.visible = false; // 初始隐藏

            sprite.userData.name = n.symbol;
            sprite.userData.description = `
                <p class="text-lg font-bold mb-3" style="color: #${n.color.toString(16).padStart(6, '0')}">${n.symbol}</p>
                <p class="text-gray-300">${n.desc}</p>
            `;

            this.numberSprites[n.symbol] = sprite;
            this.mainGroup.add(sprite);
        });
    }

    /**
     * 创建发光数字
     */
    createGlowingNumber(text, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');

        // 发光效果
        ctx.shadowColor = `#${color.toString(16).padStart(6, '0')}`;
        ctx.shadowBlur = 30;

        // 文字
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true,
            opacity: 0.9
        });
        return new THREE.Sprite(mat);
    }

    /**
     * 创建文字精灵
     */
    createTextSprite(text, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        return new THREE.Sprite(mat);
    }

    /**
     * 创建公式显示
     */
    createFormulaDisplay() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        this.formulaCanvas = canvas;
        this.formulaCtx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(0, 10, 0);
        sprite.scale.set(15, 3.75, 1);
        sprite.visible = false;

        this.formulaSprite = sprite;
        this.formulaTexture = texture;
        this.mainGroup.add(sprite);

        this.updateFormulaDisplay();
    }

    /**
     * 更新公式显示
     */
    updateFormulaDisplay() {
        const ctx = this.formulaCtx;
        ctx.clearRect(0, 0, 512, 128);

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(4, 4, 504, 120, 16);
        ctx.fill();

        // 边框渐变
        const gradient = ctx.createLinearGradient(0, 0, 512, 0);
        gradient.addColorStop(0, '#ff6b6b');
        gradient.addColorStop(0.25, '#4ecdc4');
        gradient.addColorStop(0.5, '#a855f7');
        gradient.addColorStop(0.75, '#ffd93d');
        gradient.addColorStop(1, '#6bcb77');
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 公式
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('eⁱᵖ + 1 = 0', 256, 64);

        this.formulaTexture.needsUpdate = true;
    }

    /**
     * 创建信息显示
     */
    createInfoDisplay() {
        // 当前 θ 值显示
        const thetaCanvas = document.createElement('canvas');
        thetaCanvas.width = 256;
        thetaCanvas.height = 64;
        this.thetaCanvas = thetaCanvas;
        this.thetaCtx = thetaCanvas.getContext('2d');

        const thetaTexture = new THREE.CanvasTexture(thetaCanvas);
        const thetaMat = new THREE.SpriteMaterial({ map: thetaTexture, transparent: true });
        const thetaSprite = new THREE.Sprite(thetaMat);
        thetaSprite.position.set(0, -4, 0);
        thetaSprite.scale.set(6, 1.5, 1);

        this.thetaSprite = thetaSprite;
        this.thetaTexture = thetaTexture;
        this.mainGroup.add(thetaSprite);

        this.updateThetaDisplay();
    }

    /**
     * 更新 θ 显示
     */
    updateThetaDisplay() {
        const ctx = this.thetaCtx;
        ctx.clearRect(0, 0, 256, 64);

        const theta = this.params.theta;
        const piMultiple = theta / Math.PI;

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.roundRect(4, 4, 248, 56, 8);
        ctx.fill();

        // θ 值
        ctx.fillStyle = '#ffd700';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let thetaText;
        if (Math.abs(piMultiple) < 0.01) {
            thetaText = 'θ = 0';
        } else if (Math.abs(piMultiple - 0.5) < 0.01) {
            thetaText = 'θ = π/2';
        } else if (Math.abs(piMultiple - 1) < 0.01) {
            thetaText = 'θ = π  🎯';
        } else {
            thetaText = `θ = ${piMultiple.toFixed(2)}π`;
        }
        ctx.fillText(thetaText, 128, 32);

        this.thetaTexture.needsUpdate = true;
    }

    /**
     * 创建庆祝粒子
     */
    createCelebrationParticles() {
        const particleCount = 100;
        const particleGeo = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = 0;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = 0;

            const color = new THREE.Color().setHSL(Math.random(), 1, 0.6);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            velocities.push({
                x: (Math.random() - 0.5) * 0.3,
                y: Math.random() * 0.2 + 0.1,
                z: (Math.random() - 0.5) * 0.3
            });
        }

        particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const particleMat = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0
        });

        this.celebrationParticles = new THREE.Points(particleGeo, particleMat);
        this.celebrationParticles.userData.velocities = velocities;
        this.mainGroup.add(this.celebrationParticles);
    }

    /**
     * 设置 θ 值
     */
    setTheta(theta, animate = true) {
        const R = 5;

        if (animate && Math.abs(theta - this.params.theta) > 0.01) {
            this.params.targetTheta = theta;
            this.params.isAnimating = true;
        } else {
            this.params.theta = theta;
            this.updatePointPosition();
        }
    }

    /**
     * 更新点位置
     */
    updatePointPosition() {
        const R = 5;
        const theta = this.params.theta;

        // 更新旋转点位置
        const x = R * Math.cos(theta);
        const z = R * Math.sin(theta);
        this.rotatingPoint.position.set(x, 0.3, z);

        // 更新半径线
        const positions = this.radiusLine.geometry.attributes.position.array;
        positions[3] = x;
        positions[4] = 0;
        positions[5] = z;
        this.radiusLine.geometry.attributes.position.needsUpdate = true;

        // 添加轨迹点
        this.addTrailPoint(x, z, theta);

        // 更新显示
        this.updateThetaDisplay();

        // 检查是否到达 π
        if (Math.abs(theta - Math.PI) < 0.05 && !this.params.showFormula) {
            this.triggerCelebration();
        }
    }

    /**
     * 添加轨迹点
     */
    addTrailPoint(x, z, theta) {
        this.trailPoints.push({ x, z, theta });

        if (this.trailPoints.length > this.params.trailLength) {
            this.trailPoints.shift();
        }

        // 更新轨迹几何
        const positions = this.trail.geometry.attributes.position.array;
        const colors = this.trail.geometry.attributes.color.array;

        for (let i = 0; i < this.trailPoints.length; i++) {
            const p = this.trailPoints[i];
            positions[i * 3] = p.x;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = p.z;

            // 彩虹渐变
            const hue = (p.theta / Math.PI) * 0.3 + 0.5;
            const color = new THREE.Color().setHSL(hue, 1, 0.6);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        this.trail.geometry.attributes.position.needsUpdate = true;
        this.trail.geometry.attributes.color.needsUpdate = true;
        this.trail.geometry.setDrawRange(0, this.trailPoints.length);
    }

    /**
     * 触发庆祝效果
     */
    triggerCelebration() {
        this.params.showFormula = true;
        this.params.celebrationMode = true;

        // 显示公式
        this.formulaSprite.visible = true;
        gsap.from(this.formulaSprite.scale, {
            x: 0, y: 0, z: 0,
            duration: 0.8,
            ease: 'elastic.out(1, 0.5)'
        });

        // 显示五个数字
        Object.values(this.numberSprites).forEach((sprite, i) => {
            sprite.visible = true;
            gsap.from(sprite.position, {
                y: sprite.position.y + 5,
                duration: 0.5,
                delay: i * 0.1,
                ease: 'bounce.out'
            });
            gsap.from(sprite.scale, {
                x: 0, y: 0,
                duration: 0.5,
                delay: i * 0.1
            });
        });

        // 粒子爆发
        gsap.to(this.celebrationParticles.material, {
            opacity: 1,
            duration: 0.3
        });

        // 重置粒子位置
        const positions = this.celebrationParticles.geometry.attributes.position.array;
        for (let i = 0; i < positions.length; i += 3) {
            positions[i] = -5; // -1 的位置
            positions[i + 1] = 0.3;
            positions[i + 2] = 0;
        }
        this.celebrationParticles.geometry.attributes.position.needsUpdate = true;

        this.showTeachingGuide('🎉 抵达 π！e^(iπ) = -1，加上 1 正好等于 0！');

        // 几秒后淡出粒子
        setTimeout(() => {
            gsap.to(this.celebrationParticles.material, {
                opacity: 0,
                duration: 2
            });
            this.params.celebrationMode = false;
        }, 3000);
    }

    /**
     * 自动旋转到 π
     */
    startJourneyToPi() {
        this.params.autoRotate = true;
        this.params.theta = 0;
        this.trailPoints = [];
        this.params.showFormula = false;
        this.formulaSprite.visible = false;
        Object.values(this.numberSprites).forEach(s => s.visible = false);

        this.showTeachingGuide('🚀 开始旋转之旅！从 1 出发，目标：π！');
    }

    /**
     * 重置场景
     */
    resetScene() {
        this.params.theta = 0;
        this.params.autoRotate = false;
        this.params.showFormula = false;
        this.trailPoints = [];
        this.formulaSprite.visible = false;
        Object.values(this.numberSprites).forEach(s => s.visible = false);
        this.updatePointPosition();
        this.showTeachingGuide('🔄 已重置！点击"旋转到π"开始旅程');
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-intro">
                <i class="fas fa-info"></i> 公式介绍
            </button>
            <button class="control-btn active" id="btn-journey">
                <i class="fas fa-play"></i> 旋转到π
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;

        // θ 滑块
        const sliderContainer = document.createElement('div');
        sliderContainer.className = 'absolute bottom-24 left-1/2 transform -translate-x-1/2 w-80';
        sliderContainer.innerHTML = `
            <div class="bg-black/60 backdrop-blur rounded-xl p-4 border border-purple-500/30">
                <div class="flex justify-between text-sm text-gray-400 mb-2">
                    <span>θ = 0</span>
                    <span class="text-yellow-400" id="theta-value">θ = 0</span>
                    <span>θ = π</span>
                </div>
                <input type="range" id="theta-slider" min="0" max="3.14159" step="0.01" value="0"
                    class="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500">
            </div>
        `;
        
        const container = document.getElementById('scene-canvas-container');
        container.appendChild(sliderContainer);

        // 绑定事件
        document.getElementById('btn-intro').onclick = () => this.showIntroduction();
        document.getElementById('btn-journey').onclick = () => this.startJourneyToPi();
        document.getElementById('btn-reset').onclick = () => this.resetScene();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();

        const slider = document.getElementById('theta-slider');
        slider.oninput = (e) => {
            this.params.autoRotate = false;
            this.setTheta(parseFloat(e.target.value), false);
            document.getElementById('theta-value').textContent = 
                `θ = ${(parseFloat(e.target.value) / Math.PI).toFixed(2)}π`;
        };
    }

    /**
     * 显示介绍
     */
    showIntroduction() {
        this.showTeachingGuide('📐 欧拉公式：e^(iθ) = cos(θ) + i·sin(θ)');
        setTimeout(() => {
            this.showTeachingGuide('⭕ 在复平面上，e^(iθ) 就是单位圆上的点！');
        }, 4000);
        setTimeout(() => {
            this.showTeachingGuide('🔄 θ 从 0 增加到 π，点从 1 逆时针转到 -1');
        }, 8000);
        setTimeout(() => {
            this.showTeachingGuide('✨ 所以 e^(iπ) = -1，加上 1 等于 0！');
        }, 12000);
    }

    /**
     * 显示教学引导
     */
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

    /**
     * 初始引导
     */
    showInitialGuide() {
        setTimeout(() => {
            this.showTeachingGuide('💡 拖动底部滑块控制 θ 值，或点击"旋转到π"！');
        }, 1000);
    }

    /**
     * 重置视角
     */
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

    /**
     * 高亮对象
     */
    highlightObject(target) {
        if (this.highlighted && this.highlighted.material) {
            // 恢复原状
        }
        this.highlighted = target;
        gsap.to(target.scale, { x: 1.3, y: 1.3, z: 1.3, duration: 0.15, yoyo: true, repeat: 1 });
    }

    /**
     * 显示信息面板
     */
    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        title.innerHTML = `<i class="fas fa-infinity mr-2"></i>${target.userData.name}`;
        content.innerHTML = target.userData.description;

        panel.classList.add('visible');
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        this.isAutoPlaying = true;
        setTimeout(() => {
            if (this.isAutoPlaying) {
                this.startJourneyToPi();
            }
        }, 1500);
    }

    /**
     * 动画循环
     */
    animate(time, delta) {
        // 自动旋转到 π
        if (this.params.autoRotate && this.params.theta < Math.PI) {
            this.params.theta += delta * 0.5;
            if (this.params.theta >= Math.PI) {
                this.params.theta = Math.PI;
                this.params.autoRotate = false;
            }
            this.updatePointPosition();

            // 同步滑块
            const slider = document.getElementById('theta-slider');
            if (slider) {
                slider.value = this.params.theta;
                document.getElementById('theta-value').textContent = 
                    `θ = ${(this.params.theta / Math.PI).toFixed(2)}π`;
            }
        }

        // 平滑动画
        if (this.params.isAnimating) {
            const diff = this.params.targetTheta - this.params.theta;
            if (Math.abs(diff) < 0.01) {
                this.params.theta = this.params.targetTheta;
                this.params.isAnimating = false;
            } else {
                this.params.theta += diff * 0.1;
            }
            this.updatePointPosition();
        }

        // 旋转点脉动
        if (this.rotatingPoint) {
            const pulse = 1 + Math.sin(time * 4) * 0.1;
            this.rotatingPoint.children[0].scale.setScalar(pulse);
        }

        // 单位圆呼吸
        if (this.unitCircle) {
            const breath = 1 + Math.sin(time * 2) * 0.02;
            this.unitCircle.scale.setScalar(breath);
        }

        // 五个数字浮动
        Object.values(this.numberSprites).forEach(sprite => {
            if (sprite.visible) {
                sprite.position.y = sprite.userData.baseY + 
                    Math.sin(time * 1.5 + sprite.userData.phaseOffset) * 0.3;
            }
        });

        // 庆祝粒子
        if (this.params.celebrationMode) {
            const positions = this.celebrationParticles.geometry.attributes.position.array;
            const velocities = this.celebrationParticles.userData.velocities;

            for (let i = 0; i < positions.length / 3; i++) {
                positions[i * 3] += velocities[i].x;
                positions[i * 3 + 1] += velocities[i].y;
                positions[i * 3 + 2] += velocities[i].z;
                velocities[i].y -= 0.005; // 重力
            }
            this.celebrationParticles.geometry.attributes.position.needsUpdate = true;
        }

        // 星空缓慢旋转
        if (this.stars) {
            this.stars.rotation.y += delta * 0.01;
        }
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return this.interactables;
    }

    /**
     * 清理资源
     */
    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        if (this.stars) this.scene.remove(this.stars);

        // 移除滑块
        const sliderContainer = document.querySelector('.absolute.bottom-24');
        if (sliderContainer) sliderContainer.remove();

        this.interactables = [];
        this.trailPoints = [];
    }

    /**
     * 点击背景
     */
    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
    }
};
