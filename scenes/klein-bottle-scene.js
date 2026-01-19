/**
 * 克莱因瓶演变场景 - Klein Bottle Evolution
 * ============================================
 * 从点到克莱因瓶的维度递进之旅
 * 
 * 演化阶段：
 * 0. 点（0维）- 维度的起点
 * 1. 线（1维）- 点运动形成线
 * 2. 面（2维）- 线扫描形成矩形带
 * 3. 莫比乌斯带 - 扭转180°连接，只有一个面
 * 4. 克莱因瓶 - 边缘连接，没有内外之分
 * ============================================
 * 教学重点：
 * - 维度的概念
 * - 拓扑学基础
 * - 单面曲面的神奇性质
 * - 4D空间的投影
 * ============================================
 */
window.KleinBottleScene = class KleinBottleScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 演化阶段
        this.stages = [
            { name: '点', dimension: '0维', desc: '维度的起点，没有长宽高' },
            { name: '线', dimension: '1维', desc: '点运动形成线，只有长度' },
            { name: '矩形带', dimension: '2维', desc: '线扫描形成面，有正反两面' },
            { name: '莫比乌斯带', dimension: '单面曲面', desc: '扭转180°连接，只有一个面！' },
            { name: '克莱因瓶', dimension: '4D投影', desc: '没有内外之分，需要4D空间' }
        ];

        // 场景元素
        this.point = null;              // 点
        this.line = null;               // 线
        this.rectangle = null;          // 矩形带
        this.mobiusStrip = null;        // 莫比乌斯带
        this.kleinBottle = null;        // 克莱因瓶
        this.ant = null;                // 蚂蚁（证明单面性）
        this.currentObject = null;      // 当前显示的对象

        // 参数
        this.params = {
            currentStage: 0,            // 当前阶段 (0-4)
            isTransitioning: false,     // 是否正在过渡
            transitionProgress: 0,      // 过渡进度
            autoPlay: false,            // 自动播放
            showAnt: false,             // 显示蚂蚁
            antProgress: 0,             // 蚂蚁位置
            rotationSpeed: 0.3,         // 自动旋转速度
            isPaused: false
        };

        // 颜色主题
        this.colors = {
            point: 0x00ffff,
            line: 0x00ff88,
            surface: 0xff6b9d,
            mobius: 0xa855f7,
            klein: 0x3b82f6,
            ant: 0xffff00,
            glow: 0x60a5fa
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 5, z: 20 };
        
        // 自动播放
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

        // 背景 - 深空紫色
        this.scene.background = new THREE.Color(0x0a0515);
        this.scene.fog = new THREE.FogExp2(0x0a0515, 0.01);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();

        // 显示初始阶段
        this.showStage(0);
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0x333355, 0.5);
        this.scene.add(ambient);

        // 主光源
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);

        // 紫色氛围光
        const purpleLight = new THREE.PointLight(0xa855f7, 1.5, 40);
        purpleLight.position.set(-10, 5, 10);
        this.scene.add(purpleLight);

        // 青色氛围光
        const cyanLight = new THREE.PointLight(0x00d4ff, 1.5, 40);
        cyanLight.position.set(10, -5, -10);
        this.scene.add(cyanLight);
    }

    /**
     * 创建场景内容
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建所有阶段的对象（初始不可见）
        this.createPoint();
        this.createLine();
        this.createRectangle();
        this.createMobiusStrip();
        this.createKleinBottle();
        this.createAnt();

        // 创建背景网格
        this.createGrid();

        // 创建星空
        this.createStarField();

        // 创建阶段标签
        this.createStageLabel();
    }

    /**
     * 创建点（阶段0）
     */
    createPoint() {
        const group = new THREE.Group();

        // 核心点
        const coreGeo = new THREE.SphereGeometry(0.3, 32, 32);
        const coreMat = new THREE.MeshBasicMaterial({
            color: this.colors.point,
            transparent: true,
            opacity: 1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        group.add(core);

        // 发光光晕
        for (let i = 0; i < 3; i++) {
            const glowGeo = new THREE.SphereGeometry(0.5 + i * 0.3, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
                color: this.colors.point,
                transparent: true,
                opacity: 0.3 - i * 0.1
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            group.add(glow);
        }

        group.visible = false;
        group.userData = {
            hoverTitle: '点（0维）',
            hoverDesc: '没有长宽高，维度的起点',
            hoverIcon: 'fa-circle',
            name: '点 - 0维',
            description: `
                <p class="text-lg font-bold text-cyan-400 mb-3">⚬ 点（0维）</p>
                <p class="text-gray-300 mb-3">维度的起点，没有任何尺寸。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">数学定义：</p>
                    <p class="text-sm text-white">只有位置，没有大小</p>
                    <p class="text-sm text-gray-500 mt-1">维度 = 0</p>
                </div>
                <p class="text-sm text-purple-400">💡 点是所有几何的基础！</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(core);

        this.point = group;
        this.mainGroup.add(group);
    }

    /**
     * 创建线（阶段1）
     */
    createLine() {
        const group = new THREE.Group();

        // 主线段
        const points = [];
        const segments = 100;
        for (let i = 0; i <= segments; i++) {
            const t = (i / segments) * 2 - 1; // -1 to 1
            points.push(new THREE.Vector3(t * 5, 0, 0));
        }

        const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
        const lineMat = new THREE.LineBasicMaterial({
            color: this.colors.line,
            linewidth: 3
        });
        const line = new THREE.Line(lineGeo, lineMat);
        group.add(line);

        // 端点球
        const endGeo = new THREE.SphereGeometry(0.15, 16, 16);
        const endMat = new THREE.MeshBasicMaterial({ color: this.colors.point });
        
        const startPoint = new THREE.Mesh(endGeo, endMat);
        startPoint.position.set(-5, 0, 0);
        group.add(startPoint);

        const endPoint = new THREE.Mesh(endGeo, endMat.clone());
        endPoint.position.set(5, 0, 0);
        group.add(endPoint);

        // 发光效果
        const glowMat = new THREE.LineBasicMaterial({
            color: this.colors.green,
            transparent: true,
            opacity: 0.3
        });

        group.visible = false;
        group.userData = {
            hoverTitle: '线（1维）',
            hoverDesc: '点运动形成线，只有长度',
            hoverIcon: 'fa-minus',
            name: '线段 - 1维',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">━ 线（1维）</p>
                <p class="text-gray-300 mb-3">点沿一个方向运动，形成线段。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">特征：</p>
                    <p class="text-sm text-white">只有长度，没有宽度和厚度</p>
                    <p class="text-sm text-gray-500 mt-1">维度 = 1</p>
                </div>
                <p class="text-sm text-cyan-400">→ 下一步：线扫描形成面</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(line);

        this.line = group;
        this.mainGroup.add(group);
    }

    /**
     * 创建矩形带（阶段2）
     */
    createRectangle() {
        const group = new THREE.Group();

        // 矩形面（双面）
        const rectGeo = new THREE.PlaneGeometry(10, 4, 32, 8);
        
        // 正面（粉色）
        const frontMat = new THREE.MeshStandardMaterial({
            color: this.colors.surface,
            side: THREE.FrontSide,
            metalness: 0.2,
            roughness: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const front = new THREE.Mesh(rectGeo, frontMat);
        group.add(front);

        // 背面（青色）- 表示有两面
        const backMat = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            side: THREE.BackSide,
            metalness: 0.2,
            roughness: 0.5,
            transparent: true,
            opacity: 0.9
        });
        const back = new THREE.Mesh(rectGeo.clone(), backMat);
        group.add(back);

        // 边框
        const edgeGeo = new THREE.EdgesGeometry(rectGeo);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
        const edges = new THREE.LineSegments(edgeGeo, edgeMat);
        group.add(edges);

        // 标记A和A（用于演示连接）
        const labelA = this.createSmallLabel('A', new THREE.Vector3(-5, 0, 0.1), 0xffff00);
        const labelA2 = this.createSmallLabel('A', new THREE.Vector3(5, 0, 0.1), 0xffff00);
        group.add(labelA);
        group.add(labelA2);

        group.visible = false;
        group.userData = {
            hoverTitle: '矩形带（2维）',
            hoverDesc: '有正反两面，边A需要连接',
            hoverIcon: 'fa-square',
            name: '矩形带 - 2维',
            description: `
                <p class="text-lg font-bold text-pink-400 mb-3">▢ 矩形带（2维）</p>
                <p class="text-gray-300 mb-3">线沿垂直方向扫描，形成2D曲面。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">普通纸带特征：</p>
                    <ul class="text-sm text-white list-disc ml-4">
                        <li>有<span class="text-pink-400">正面</span>和<span class="text-cyan-400">背面</span></li>
                        <li>有两条边</li>
                        <li>蚂蚁只能走一面</li>
                    </ul>
                </div>
                <p class="text-sm text-yellow-400">💡 如果把两端A扭转180°连接会怎样？</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(front);

        this.rectangle = group;
        this.mainGroup.add(group);
    }

    /**
     * 创建莫比乌斯带（阶段3）
     */
    createMobiusStrip() {
        const group = new THREE.Group();

        // 莫比乌斯带参数方程
        const mobiusGeo = new THREE.ParametricGeometry((u, v, target) => {
            u = u * Math.PI * 2;
            v = v * 2 - 1; // -1 to 1
            
            const R = 4; // 主半径
            const w = 1.5; // 带宽

            // 莫比乌斯带参数方程
            const x = (R + w * v * Math.cos(u / 2)) * Math.cos(u);
            const y = (R + w * v * Math.cos(u / 2)) * Math.sin(u);
            const z = w * v * Math.sin(u / 2);

            target.set(x, z, y);
        }, 128, 16);

        // 渐变材质
        const mobiusMat = new THREE.MeshStandardMaterial({
            color: this.colors.mobius,
            side: THREE.DoubleSide,
            metalness: 0.3,
            roughness: 0.4,
            transparent: true,
            opacity: 0.9
        });

        const mobius = new THREE.Mesh(mobiusGeo, mobiusMat);
        group.add(mobius);

        // 边缘线（只有一条边！）
        const edgeCurve = new THREE.CurvePath();
        const edgePoints = [];
        for (let i = 0; i <= 256; i++) {
            const u = (i / 256) * Math.PI * 4; // 走两圈才能回到起点
            const R = 4;
            const w = 1.5;
            const v = (i % 2 === 0) ? 1 : 1; // 边缘
            
            const x = (R + w * v * Math.cos(u / 2)) * Math.cos(u);
            const y = (R + w * v * Math.cos(u / 2)) * Math.sin(u);
            const z = w * v * Math.sin(u / 2);
            
            edgePoints.push(new THREE.Vector3(x, z, y));
        }
        const edgeGeo = new THREE.BufferGeometry().setFromPoints(edgePoints);
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x00ff88, linewidth: 2 });
        const edge = new THREE.Line(edgeGeo, edgeMat);
        group.add(edge);

        group.visible = false;
        group.userData = {
            hoverTitle: '莫比乌斯带',
            hoverDesc: '扭转180°连接，只有一个面！',
            hoverIcon: 'fa-infinity',
            name: '莫比乌斯带 - 单面曲面',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">∞ 莫比乌斯带</p>
                <p class="text-gray-300 mb-3">将纸带扭转180°后连接两端。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">⭐ 神奇性质：</p>
                    <ul class="text-sm text-white list-disc ml-4">
                        <li><span class="text-green-400">只有一个面</span>！</li>
                        <li>只有<span class="text-green-400">一条边</span>！</li>
                        <li>蚂蚁可以走遍整个表面</li>
                        <li>纵向剪开不会分成两半</li>
                    </ul>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">发现者：</p>
                    <p class="text-sm text-white">莫比乌斯 & 李斯廷（1858年）</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(mobius);

        // 保存几何信息用于蚂蚁行走
        group.userData.mobiusParams = { R: 4, w: 1.5 };

        this.mobiusStrip = group;
        this.mainGroup.add(group);
    }

    /**
     * 创建克莱因瓶（阶段4）
     */
    createKleinBottle() {
        const group = new THREE.Group();

        // 克莱因瓶参数方程（Figure-8 immersion）
        const kleinGeo = new THREE.ParametricGeometry((u, v, target) => {
            u = u * Math.PI * 2;
            v = v * Math.PI * 2;

            const a = 3;
            
            // Figure-8 Klein bottle
            const x = (a + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v)) * Math.cos(u);
            const y = (a + Math.cos(u / 2) * Math.sin(v) - Math.sin(u / 2) * Math.sin(2 * v)) * Math.sin(u);
            const z = Math.sin(u / 2) * Math.sin(v) + Math.cos(u / 2) * Math.sin(2 * v);

            target.set(x * 1.2, z * 1.5, y * 1.2);
        }, 64, 32);

        // 主材质 - 半透明蓝色
        const kleinMat = new THREE.MeshPhysicalMaterial({
            color: this.colors.klein,
            side: THREE.DoubleSide,
            metalness: 0.1,
            roughness: 0.3,
            transparent: true,
            opacity: 0.7,
            transmission: 0.3
        });

        const klein = new THREE.Mesh(kleinGeo, kleinMat);
        group.add(klein);

        // 线框辅助
        const wireGeo = new THREE.WireframeGeometry(kleinGeo);
        const wireMat = new THREE.LineBasicMaterial({
            color: 0x00d4ff,
            transparent: true,
            opacity: 0.3
        });
        const wireframe = new THREE.LineSegments(wireGeo, wireMat);
        group.add(wireframe);

        group.visible = false;
        group.userData = {
            hoverTitle: '克莱因瓶',
            hoverDesc: '没有内外之分的4D曲面',
            hoverIcon: 'fa-flask',
            name: '克莱因瓶 - 4D投影',
            description: `
                <p class="text-lg font-bold text-blue-400 mb-3">🧪 克莱因瓶</p>
                <p class="text-gray-300 mb-3">莫比乌斯带的"升级版"，没有内外之分。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-yellow-400">⭐ 神奇性质：</p>
                    <ul class="text-sm text-white list-disc ml-4">
                        <li><span class="text-cyan-400">没有内部和外部</span></li>
                        <li>只有一个面</li>
                        <li>需要<span class="text-purple-400">4维空间</span>才能不自交</li>
                        <li>在3D中必须"穿过自己"</li>
                    </ul>
                </div>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-gray-400">想象方式：</p>
                    <p class="text-sm text-white">把瓶子的颈部穿过瓶身连接到底部</p>
                    <p class="text-xs text-gray-500 mt-1">在3D中不可能，但在4D中可以！</p>
                </div>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        this.interactables.push(klein);

        this.kleinBottle = group;
        this.mainGroup.add(group);
    }

    /**
     * 创建蚂蚁（用于演示单面性）
     */
    createAnt() {
        const antGroup = new THREE.Group();

        // 蚂蚁身体（简化为发光小球）
        const bodyGeo = new THREE.SphereGeometry(0.2, 16, 16);
        const bodyMat = new THREE.MeshBasicMaterial({
            color: this.colors.ant,
            emissive: this.colors.ant,
            emissiveIntensity: 0.5
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        antGroup.add(body);

        // 发光尾迹
        const glowGeo = new THREE.SphereGeometry(0.3, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.colors.ant,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        antGroup.add(glow);

        antGroup.visible = false;
        this.ant = antGroup;
        this.mainGroup.add(antGroup);
    }

    /**
     * 创建小标签
     */
    createSmallLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.position.copy(position);
        sprite.scale.set(1, 1, 1);

        return sprite;
    }

    /**
     * 创建阶段标签
     */
    createStageLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        this.stageLabelCanvas = canvas;
        this.stageLabelCtx = canvas.getContext('2d');

        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(mat);
        sprite.position.set(0, 8, 0);
        sprite.scale.set(12, 3, 1);

        this.stageLabel = sprite;
        this.stageLabelTexture = texture;
        this.mainGroup.add(sprite);

        this.updateStageLabel();
    }

    /**
     * 更新阶段标签
     */
    updateStageLabel() {
        const ctx = this.stageLabelCtx;
        const stage = this.stages[this.params.currentStage];

        ctx.clearRect(0, 0, 512, 128);

        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(4, 4, 504, 120, 16);
        ctx.fill();

        // 边框
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 阶段号
        ctx.fillStyle = '#a855f7';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`阶段 ${this.params.currentStage + 1}/5`, 20, 40);

        // 阶段名称
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 32px Arial';
        ctx.fillText(stage.name, 150, 45);

        // 维度
        ctx.fillStyle = '#00d4ff';
        ctx.font = '20px Arial';
        ctx.fillText(stage.dimension, 20, 80);

        // 描述
        ctx.fillStyle = '#aaaaaa';
        ctx.font = '18px Arial';
        ctx.fillText(stage.desc, 20, 105);

        this.stageLabelTexture.needsUpdate = true;
    }

    /**
     * 创建背景网格
     */
    createGrid() {
        const grid = new THREE.GridHelper(40, 40, 0x222244, 0x111133);
        grid.position.y = -8;
        this.mainGroup.add(grid);
    }

    /**
     * 创建星空
     */
    createStarField() {
        const starGeo = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount * 3; i += 3) {
            const r = 50 + Math.random() * 30;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i] = r * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = r * Math.cos(phi);
        }

        starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.6
        });

        const stars = new THREE.Points(starGeo, starMat);
        this.scene.add(stars);
        this.stars = stars;
    }

    /**
     * 显示指定阶段
     */
    showStage(stageIndex, animate = true) {
        if (stageIndex < 0 || stageIndex >= this.stages.length) return;
        if (this.params.isTransitioning) return;

        const oldStage = this.params.currentStage;
        this.params.currentStage = stageIndex;

        // 隐藏所有对象
        [this.point, this.line, this.rectangle, this.mobiusStrip, this.kleinBottle].forEach(obj => {
            if (obj) obj.visible = false;
        });

        // 显示当前阶段对象
        const objects = [this.point, this.line, this.rectangle, this.mobiusStrip, this.kleinBottle];
        const current = objects[stageIndex];
        if (current) {
            current.visible = true;
            this.currentObject = current;

            if (animate) {
                // 缩放动画
                current.scale.set(0.01, 0.01, 0.01);
                gsap.to(current.scale, {
                    x: 1, y: 1, z: 1,
                    duration: 0.8,
                    ease: 'elastic.out(1, 0.5)'
                });
            }
        }

        // 更新标签
        this.updateStageLabel();

        // 显示蚂蚁（仅在莫比乌斯带阶段）
        this.params.showAnt = stageIndex === 3;
        if (this.ant) {
            this.ant.visible = this.params.showAnt;
        }

        // 教学提示
        const messages = [
            '⚬ 这是一个点，维度为0，没有任何尺寸',
            '━ 点向一个方向运动，形成了一条线（1维）',
            '▢ 线向垂直方向扫描，形成了一个面（2维），有正反两面',
            '∞ 将纸带扭转180°连接两端，变成莫比乌斯带——只有一个面！',
            '🧪 把莫比乌斯带的边缘连接起来，就得到了克莱因瓶——没有内外之分！'
        ];
        this.showTeachingGuide(messages[stageIndex]);

        // 更新进度条
        this.updateProgressBar();
    }

    /**
     * 过渡到下一阶段
     */
    nextStage() {
        if (this.params.currentStage < this.stages.length - 1) {
            this.showStage(this.params.currentStage + 1);
        }
    }

    /**
     * 返回上一阶段
     */
    prevStage() {
        if (this.params.currentStage > 0) {
            this.showStage(this.params.currentStage - 1);
        }
    }

    /**
     * 自动演化
     */
    startAutoEvolution() {
        if (this.params.autoPlay) return;
        
        this.params.autoPlay = true;
        this.showStage(0);

        const evolve = (stage) => {
            if (!this.params.autoPlay || stage >= this.stages.length) {
                this.params.autoPlay = false;
                if (stage >= this.stages.length) {
                    this.showTeachingGuide('🎉 演化完成！从0维的点到4D的克莱因瓶！');
                }
                return;
            }

            this.showStage(stage);
            setTimeout(() => evolve(stage + 1), 3500);
        };

        evolve(0);
    }

    /**
     * 停止自动演化
     */
    stopAutoEvolution() {
        this.params.autoPlay = false;
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-auto">
                <i class="fas fa-play"></i> 自动演化
            </button>
            <button class="control-btn" id="btn-prev">
                <i class="fas fa-arrow-left"></i> 上一步
            </button>
            <button class="control-btn" id="btn-next">
                <i class="fas fa-arrow-right"></i> 下一步
            </button>
            <button class="control-btn" id="btn-ant">
                <i class="fas fa-bug"></i> 蚂蚁行走
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;

        // 进度条
        const progressBar = document.createElement('div');
        progressBar.id = 'evolution-progress';
        progressBar.className = 'absolute bottom-20 left-1/2 transform -translate-x-1/2 flex gap-2';
        progressBar.innerHTML = this.stages.map((s, i) => 
            `<div class="progress-dot w-4 h-4 rounded-full bg-gray-600 cursor-pointer hover:bg-purple-400 transition-all" data-stage="${i}"></div>`
        ).join('');
        
        const container = document.getElementById('scene-canvas-container');
        container.appendChild(progressBar);

        // 绑定进度点击
        progressBar.querySelectorAll('.progress-dot').forEach(dot => {
            dot.onclick = () => this.showStage(parseInt(dot.dataset.stage));
        });

        document.getElementById('btn-auto').onclick = () => {
            if (this.params.autoPlay) {
                this.stopAutoEvolution();
                document.getElementById('btn-auto').innerHTML = '<i class="fas fa-play"></i> 自动演化';
            } else {
                this.startAutoEvolution();
                document.getElementById('btn-auto').innerHTML = '<i class="fas fa-stop"></i> 停止';
            }
        };
        document.getElementById('btn-prev').onclick = () => this.prevStage();
        document.getElementById('btn-next').onclick = () => this.nextStage();
        document.getElementById('btn-ant').onclick = () => this.toggleAntWalk();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    /**
     * 更新进度条
     */
    updateProgressBar() {
        const dots = document.querySelectorAll('.progress-dot');
        dots.forEach((dot, i) => {
            if (i === this.params.currentStage) {
                dot.classList.remove('bg-gray-600');
                dot.classList.add('bg-purple-500', 'scale-125');
            } else if (i < this.params.currentStage) {
                dot.classList.remove('bg-gray-600', 'scale-125');
                dot.classList.add('bg-purple-300');
            } else {
                dot.classList.remove('bg-purple-500', 'bg-purple-300', 'scale-125');
                dot.classList.add('bg-gray-600');
            }
        });
    }

    /**
     * 切换蚂蚁行走
     */
    toggleAntWalk() {
        if (this.params.currentStage !== 3) {
            this.showTeachingGuide('🐜 请先切换到莫比乌斯带阶段！');
            this.showStage(3);
            return;
        }

        this.params.showAnt = !this.params.showAnt;
        this.ant.visible = this.params.showAnt;

        if (this.params.showAnt) {
            this.showTeachingGuide('🐜 观察小球沿莫比乌斯带行走，它能走遍整个表面！');
        }
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
            this.showTeachingGuide('💡 点击"自动演化"观看从点到克莱因瓶的维度之旅！');
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

        gsap.to(target.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.15, yoyo: true, repeat: 1 });
    }

    /**
     * 显示信息面板
     */
    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        title.innerHTML = `<i class="fas fa-shapes mr-2"></i>${target.userData.name}`;
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
                this.startAutoEvolution();
            }
        }, 1000);
    }

    /**
     * 动画循环
     */
    animate(time, delta) {
        if (this.params.isPaused) return;

        // 当前对象缓慢旋转
        if (this.currentObject && this.currentObject.visible) {
            this.currentObject.rotation.y += delta * this.params.rotationSpeed;
        }

        // 蚂蚁沿莫比乌斯带行走
        if (this.ant && this.ant.visible && this.mobiusStrip.visible) {
            this.params.antProgress += delta * 0.3;
            const u = this.params.antProgress % (Math.PI * 4); // 两圈回到原点
            
            const { R, w } = this.mobiusStrip.userData.mobiusParams;
            const v = 0; // 中间

            const x = (R + w * v * Math.cos(u / 2)) * Math.cos(u);
            const y = (R + w * v * Math.cos(u / 2)) * Math.sin(u);
            const z = w * v * Math.sin(u / 2);

            this.ant.position.set(x, z, y);
            
            // 蚂蚁脉动效果
            const pulse = 1 + Math.sin(time * 5) * 0.2;
            this.ant.scale.setScalar(pulse);
        }

        // 点的脉动
        if (this.point && this.point.visible) {
            const pulse = 1 + Math.sin(time * 3) * 0.1;
            this.point.children[0].scale.setScalar(pulse);
        }

        // 克莱因瓶的4D旋转效果
        if (this.kleinBottle && this.kleinBottle.visible) {
            this.kleinBottle.rotation.x = Math.sin(time * 0.5) * 0.2;
            this.kleinBottle.rotation.z = Math.cos(time * 0.3) * 0.1;
        }

        // 星空缓慢旋转
        if (this.stars) {
            this.stars.rotation.y += delta * 0.02;
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
        
        // 移除进度条
        const progress = document.getElementById('evolution-progress');
        if (progress) progress.remove();
        
        this.interactables = [];
    }

    /**
     * 点击背景
     */
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
