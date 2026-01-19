/**
 * 几何题解题场景 - 三角形面积之和最大值问题
 * ============================================
 * 题目：点C在圆O上运动，求 S_△ABC + S_△OCD 的最大值
 * 
 * 核心知识点：
 * - 动点轨迹问题
 * - 面积等量转化
 * - 对角线⊥时面积最大
 * ============================================
 */
window.GeometryProblemScene = class GeometryProblemScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 几何元素
        this.points = {};      // 所有点
        this.lines = {};       // 所有线段
        this.triangles = {};   // 三角形
        this.labels = {};      // 标签
        this.auxiliaryLines = []; // 辅助线
        
        // 题目参数（根据具体题目调整）
        this.params = {
            // 圆O的圆心和半径
            circleCenter: new THREE.Vector3(0, 0, 0),
            circleRadius: 3,
            
            // 固定点坐标
            pointA: new THREE.Vector3(-5, 0, 0),
            pointB: new THREE.Vector3(-2, 4, 0),
            pointD: new THREE.Vector3(4, 0, 0),
            
            // 动点C的初始角度（在圆上）
            angleC: Math.PI / 2  // 90度，即圆顶
        };
        
        // 状态
        this.isAutoPlaying = false;
        this.isDragging = false;
        this.currentStep = 0;
        this.maxStep = 5;
        
        // 面积记录
        this.areaHistory = [];
        this.maxAreaFound = 0;
        this.maxAreaAngle = 0;
        
        this.defaultCameraPos = { x: 0, y: 0, z: 25 };
        
        // 颜色方案（几何题专用 - 纯白背景）
        this.colors = {
            background: 0xffffff,
            point: 0x2563eb,          // 点 - 蓝色
            pointC: 0xef4444,         // 动点C - 红色
            line: 0x374151,           // 线 - 深灰
            circle: 0x8b5cf6,         // 圆 - 紫色
            triangle1: 0xef4444,      // 三角形1 - 红色
            triangle2: 0x3b82f6,      // 三角形2 - 蓝色
            auxiliary: 0x10b981,      // 辅助线 - 绿色
            highlight: 0xf59e0b,      // 高亮 - 橙色
            text: 0x1f2937            // 文字 - 深灰
        };
        
        // 解题步骤
        this.solutionSteps = [
            {
                id: 0,
                title: '📖 观察题目',
                description: '点C在圆O上运动，观察两个三角形的变化',
                action: 'observeProblem'
            },
            {
                id: 1,
                title: '🔄 动态演示',
                description: '拖动点C或观看自动演示，发现面积变化规律',
                action: 'animatePointC'
            },
            {
                id: 2,
                title: '❓ 发现问题',
                description: '两个三角形不同时取到最大值！',
                action: 'showDiscovery'
            },
            {
                id: 3,
                title: '✏️ 构造辅助线',
                description: '连接关键点，转化问题',
                action: 'drawAuxiliaryLines'
            },
            {
                id: 4,
                title: '🔀 面积转化',
                description: '等量替换，将问题转化为四边形对角线问题',
                action: 'showAreaTransform'
            },
            {
                id: 5,
                title: '✅ 求最大值',
                description: '当对角线⊥时，面积最大！',
                action: 'showMaxCondition'
            }
        ];
    }

    init() {
        // 纯白背景
        this.scene.background = new THREE.Color(this.colors.background);
        
        // 正交相机视角（2D几何更清晰）
        this.camera.position.set(0, 0, 25);
        this.camera.lookAt(0, 0, 0);
        
        this.setupLights();
        this.setupEnvironment();
        this.setupScene();
        this.setupUI();
        this.setupDragControl();
        
        // 初始提示
        setTimeout(() => {
            this.showGuide('📐 几何解题：拖动红色点C观察三角形面积变化');
        }, 500);
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 1);
        this.scene.add(ambient);
        
        const directional = new THREE.DirectionalLight(0xffffff, 0.3);
        directional.position.set(0, 0, 10);
        this.scene.add(directional);
    }

    setupEnvironment() {
        // 淡灰色网格（几何题背景）
        const gridHelper = new THREE.GridHelper(30, 30, 0xdddddd, 0xeeeeee);
        gridHelper.rotation.x = Math.PI / 2;  // 旋转到XY平面
        gridHelper.position.z = -0.1;
        this.scene.add(gridHelper);
        
        // 坐标轴（淡色，不抢眼）
        this.createAxes();
    }

    createAxes() {
        const axisLength = 12;
        const axisColor = 0xcccccc;
        
        // X轴
        const xAxisGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ]);
        const xAxis = new THREE.Line(xAxisGeo, new THREE.LineBasicMaterial({ color: axisColor }));
        this.scene.add(xAxis);
        
        // Y轴
        const yAxisGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -axisLength, 0),
            new THREE.Vector3(0, axisLength, 0)
        ]);
        const yAxis = new THREE.Line(yAxisGeo, new THREE.LineBasicMaterial({ color: axisColor }));
        this.scene.add(yAxis);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 1. 创建圆O
        this.createCircle();
        
        // 2. 创建固定点
        this.createFixedPoints();
        
        // 3. 创建动点C
        this.createPointC();
        
        // 4. 创建连线
        this.createLines();
        
        // 5. 创建三角形填充
        this.createTriangles();
        
        // 6. 创建面积显示面板
        this.createAreaPanel();
        
        // 7. 创建点标签
        this.createPointLabels();
    }

    createCircle() {
        // 圆O
        const circleGeo = new THREE.RingGeometry(
            this.params.circleRadius - 0.03,
            this.params.circleRadius + 0.03,
            64
        );
        const circleMat = new THREE.MeshBasicMaterial({
            color: this.colors.circle,
            side: THREE.DoubleSide
        });
        const circle = new THREE.Mesh(circleGeo, circleMat);
        this.mainGroup.add(circle);
        
        // 圆心O点
        this.points.O = this.createPoint(
            this.params.circleCenter,
            this.colors.point,
            'O',
            '圆心'
        );
    }

    createFixedPoints() {
        // 点A
        this.points.A = this.createPoint(
            this.params.pointA,
            this.colors.point,
            'A',
            '固定点'
        );
        
        // 点B
        this.points.B = this.createPoint(
            this.params.pointB,
            this.colors.point,
            'B',
            '固定点'
        );
        
        // 点D
        this.points.D = this.createPoint(
            this.params.pointD,
            this.colors.point,
            'D',
            '固定点'
        );
    }

    createPointC() {
        // 动点C（在圆上）
        const cx = this.params.circleRadius * Math.cos(this.params.angleC);
        const cy = this.params.circleRadius * Math.sin(this.params.angleC);
        
        this.points.C = this.createPoint(
            new THREE.Vector3(cx, cy, 0),
            this.colors.pointC,
            'C',
            '动点（可拖动）',
            true  // 可交互
        );
        
        // 加一个发光效果表示可拖动
        const glowGeo = new THREE.CircleGeometry(0.5, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.colors.pointC,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.copy(this.points.C.position);
        this.mainGroup.add(glow);
        this.pointCGlow = glow;
    }

    createPoint(position, color, label, description, interactive = false) {
        const pointGeo = new THREE.CircleGeometry(0.25, 32);
        const pointMat = new THREE.MeshBasicMaterial({ color });
        const point = new THREE.Mesh(pointGeo, pointMat);
        point.position.copy(position);
        
        point.userData = {
            label,
            hoverTitle: `点 ${label}`,
            hoverDesc: description,
            hoverIcon: 'fa-circle',
            name: `点 ${label}`,
            description: `<p class="text-lg font-bold">${label}</p><p>${description}</p>`,
            isPoint: true,
            interactive
        };
        
        if (interactive) {
            this.interactables.push(point);
        }
        
        this.mainGroup.add(point);
        return point;
    }

    createLines() {
        // AB线段
        this.lines.AB = this.createLine(
            this.params.pointA,
            this.params.pointB,
            this.colors.line
        );
        
        // 更新动态线段
        this.updateDynamicLines();
    }

    updateDynamicLines() {
        const posC = this.points.C.position;
        
        // 删除旧的动态线
        ['BC', 'AC', 'OC', 'CD'].forEach(name => {
            if (this.lines[name]) {
                this.mainGroup.remove(this.lines[name]);
            }
        });
        
        // BC线段
        this.lines.BC = this.createLine(
            this.params.pointB,
            posC,
            this.colors.triangle1
        );
        
        // AC线段
        this.lines.AC = this.createLine(
            this.params.pointA,
            posC,
            this.colors.line
        );
        
        // OC线段
        this.lines.OC = this.createLine(
            this.params.circleCenter,
            posC,
            this.colors.triangle2
        );
        
        // CD线段
        this.lines.CD = this.createLine(
            posC,
            this.params.pointD,
            this.colors.triangle2
        );
        
        // OD线段
        if (!this.lines.OD) {
            this.lines.OD = this.createLine(
                this.params.circleCenter,
                this.params.pointD,
                this.colors.line
            );
        }
    }

    createLine(start, end, color, dashed = false) {
        const points = [start.clone(), end.clone()];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        
        let mat;
        if (dashed) {
            mat = new THREE.LineDashedMaterial({
                color,
                dashSize: 0.3,
                gapSize: 0.2
            });
        } else {
            mat = new THREE.LineBasicMaterial({ color, linewidth: 2 });
        }
        
        const line = new THREE.Line(geo, mat);
        if (dashed) line.computeLineDistances();
        
        this.mainGroup.add(line);
        return line;
    }

    createTriangles() {
        this.updateTriangles();
    }

    updateTriangles() {
        // 删除旧三角形
        ['ABC', 'OCD'].forEach(name => {
            if (this.triangles[name]) {
                this.mainGroup.remove(this.triangles[name]);
            }
        });
        
        const posC = this.points.C.position;
        
        // △ABC（红色半透明）
        this.triangles.ABC = this.createTriangleFill(
            this.params.pointA,
            this.params.pointB,
            posC,
            this.colors.triangle1
        );
        
        // △OCD（蓝色半透明）
        this.triangles.OCD = this.createTriangleFill(
            this.params.circleCenter,
            posC,
            this.params.pointD,
            this.colors.triangle2
        );
    }

    createTriangleFill(p1, p2, p3, color) {
        const shape = new THREE.Shape();
        shape.moveTo(p1.x, p1.y);
        shape.lineTo(p2.x, p2.y);
        shape.lineTo(p3.x, p3.y);
        shape.closePath();
        
        const geo = new THREE.ShapeGeometry(shape);
        const mat = new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.25,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.z = -0.05;  // 稍微在后面
        this.mainGroup.add(mesh);
        return mesh;
    }

    createPointLabels() {
        Object.keys(this.points).forEach(name => {
            const point = this.points[name];
            this.createTextLabel(name, point.position, name === 'C' ? this.colors.pointC : this.colors.text);
        });
    }

    createTextLabel(text, position, color = 0x1f2937) {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(1.2, 1.2, 1);
        sprite.position.set(position.x + 0.5, position.y + 0.5, 0.1);
        
        this.mainGroup.add(sprite);
        this.labels[text] = sprite;
        
        return sprite;
    }

    createAreaPanel() {
        // HTML面板显示面积
        const container = document.getElementById('scene-canvas-container');
        
        // 移除旧面板
        const oldPanel = container.querySelector('.geometry-area-panel');
        if (oldPanel) oldPanel.remove();
        
        const panel = document.createElement('div');
        panel.className = 'geometry-area-panel';
        panel.innerHTML = `
            <div class="geo-panel-title">📐 面积计算</div>
            <div class="geo-area-item" style="border-left: 4px solid #ef4444;">
                <span class="geo-area-label">S<sub>△ABC</sub></span>
                <span class="geo-area-value" id="area-abc">0.00</span>
            </div>
            <div class="geo-area-item" style="border-left: 4px solid #3b82f6;">
                <span class="geo-area-label">S<sub>△OCD</sub></span>
                <span class="geo-area-value" id="area-ocd">0.00</span>
            </div>
            <div class="geo-area-total">
                <span class="geo-area-label">总和</span>
                <span class="geo-area-value" id="area-total">0.00</span>
            </div>
            <div class="geo-max-record">
                <span>最大值记录: </span>
                <span id="area-max">0.00</span>
            </div>
        `;
        panel.style.cssText = `
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.95);
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            font-family: system-ui, sans-serif;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
            z-index: 100;
            min-width: 180px;
        `;
        container.appendChild(panel);
        this.areaPanel = panel;
        
        // 添加样式
        this.addPanelStyles();
        
        // 初始计算
        this.updateAreaDisplay();
    }

    addPanelStyles() {
        if (document.getElementById('geometry-panel-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'geometry-panel-styles';
        style.textContent = `
            .geo-panel-title {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
            }
            .geo-area-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 12px;
                margin: 6px 0;
                background: #f9fafb;
                border-radius: 6px;
            }
            .geo-area-label {
                color: #4b5563;
                font-size: 14px;
            }
            .geo-area-value {
                font-weight: 600;
                font-family: monospace;
                font-size: 16px;
                color: #1f2937;
            }
            .geo-area-total {
                display: flex;
                justify-content: space-between;
                padding: 10px 12px;
                margin-top: 10px;
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                border-radius: 8px;
                border: 1px solid #f59e0b;
            }
            .geo-area-total .geo-area-value {
                color: #b45309;
                font-size: 18px;
            }
            .geo-max-record {
                margin-top: 12px;
                padding-top: 10px;
                border-top: 1px dashed #d1d5db;
                font-size: 13px;
                color: #6b7280;
                display: flex;
                justify-content: space-between;
            }
            .geo-max-record span:last-child {
                font-weight: 600;
                color: #059669;
            }
            
            .geometry-step-panel {
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(255,255,255,0.95);
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 16px 24px;
                font-family: system-ui, sans-serif;
                box-shadow: 0 4px 20px rgba(0,0,0,0.1);
                z-index: 100;
                text-align: center;
                max-width: 500px;
            }
            .step-title {
                font-size: 18px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 8px;
            }
            .step-desc {
                font-size: 14px;
                color: #6b7280;
                margin-bottom: 12px;
            }
            .step-buttons {
                display: flex;
                gap: 12px;
                justify-content: center;
            }
            .step-btn {
                padding: 8px 20px;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-size: 14px;
                transition: all 0.2s;
            }
            .step-btn-primary {
                background: #3b82f6;
                color: white;
            }
            .step-btn-primary:hover {
                background: #2563eb;
            }
            .step-btn-secondary {
                background: #f3f4f6;
                color: #374151;
            }
            .step-btn-secondary:hover {
                background: #e5e7eb;
            }
        `;
        document.head.appendChild(style);
    }

    calculateArea(p1, p2, p3) {
        // 使用向量叉积计算三角形面积
        const v1 = new THREE.Vector3().subVectors(p2, p1);
        const v2 = new THREE.Vector3().subVectors(p3, p1);
        const cross = new THREE.Vector3().crossVectors(v1, v2);
        return Math.abs(cross.z) / 2;
    }

    updateAreaDisplay() {
        const posC = this.points.C.position;
        
        const areaABC = this.calculateArea(
            this.params.pointA,
            this.params.pointB,
            posC
        );
        
        const areaOCD = this.calculateArea(
            this.params.circleCenter,
            posC,
            this.params.pointD
        );
        
        const total = areaABC + areaOCD;
        
        // 更新显示
        const elABC = document.getElementById('area-abc');
        const elOCD = document.getElementById('area-ocd');
        const elTotal = document.getElementById('area-total');
        const elMax = document.getElementById('area-max');
        
        if (elABC) elABC.textContent = areaABC.toFixed(2);
        if (elOCD) elOCD.textContent = areaOCD.toFixed(2);
        if (elTotal) elTotal.textContent = total.toFixed(2);
        
        // 更新最大值记录
        if (total > this.maxAreaFound) {
            this.maxAreaFound = total;
            this.maxAreaAngle = this.params.angleC;
            if (elMax) {
                elMax.textContent = total.toFixed(2);
                elMax.style.color = '#059669';
                gsap.fromTo(elMax, { scale: 1.3 }, { scale: 1, duration: 0.3 });
            }
        }
        
        // 记录历史
        this.areaHistory.push({ angle: this.params.angleC, total });
    }

    setupDragControl() {
        const container = document.getElementById('scene-canvas-container');
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        let dragTarget = null;
        
        // 获取OrbitControls引用（通过SceneManager）
        const getControls = () => {
            if (window.sceneManager && window.sceneManager.controls) {
                return window.sceneManager.controls;
            }
            return null;
        };
        
        const onMouseDown = (event) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects([this.points.C]);
            
            if (intersects.length > 0) {
                dragTarget = intersects[0].object;
                this.isDragging = true;
                container.style.cursor = 'grabbing';
                
                // 🔑 禁用OrbitControls，防止视角跟着转
                const controls = getControls();
                if (controls) {
                    controls.enabled = false;
                }
                
                // 阻止事件冒泡
                event.stopPropagation();
                event.preventDefault();
            }
        };
        
        const onMouseMove = (event) => {
            if (!this.isDragging || !dragTarget) return;
            
            // 阻止事件冒泡
            event.stopPropagation();
            event.preventDefault();
            
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            // 将鼠标位置转换为世界坐标
            const worldPos = new THREE.Vector3(mouse.x, mouse.y, 0);
            worldPos.unproject(this.camera);
            
            // 计算在圆上的位置
            const dx = worldPos.x - this.params.circleCenter.x;
            const dy = worldPos.y - this.params.circleCenter.y;
            const angle = Math.atan2(dy, dx);
            
            // 更新点C位置
            this.updatePointCPosition(angle);
        };
        
        const onMouseUp = () => {
            if (this.isDragging) {
                // 🔑 恢复OrbitControls
                const controls = getControls();
                if (controls) {
                    controls.enabled = true;
                }
            }
            
            this.isDragging = false;
            dragTarget = null;
            container.style.cursor = 'default';
        };
        
        // 使用捕获阶段，优先处理拖动事件
        container.addEventListener('mousedown', onMouseDown, true);
        container.addEventListener('mousemove', onMouseMove, true);
        container.addEventListener('mouseup', onMouseUp, true);
        container.addEventListener('mouseleave', onMouseUp, true);
        
        this.dragHandlers = { onMouseDown, onMouseMove, onMouseUp };
    }

    updatePointCPosition(angle) {
        this.params.angleC = angle;
        
        const cx = this.params.circleRadius * Math.cos(angle);
        const cy = this.params.circleRadius * Math.sin(angle);
        
        // 更新点C位置
        this.points.C.position.set(cx, cy, 0);
        if (this.pointCGlow) {
            this.pointCGlow.position.set(cx, cy, 0);
        }
        
        // 更新标签C的位置
        if (this.labels.C) {
            this.labels.C.position.set(cx + 0.5, cy + 0.5, 0.1);
        }
        
        // 更新动态线段
        this.updateDynamicLines();
        
        // 更新三角形
        this.updateTriangles();
        
        // 更新面积显示
        this.updateAreaDisplay();
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-auto-play">
                <i class="fas fa-play"></i> 自动演示
            </button>
            <button class="control-btn" id="btn-step-guide">
                <i class="fas fa-book"></i> 解题步骤
            </button>
            <button class="control-btn" id="btn-auxiliary">
                <i class="fas fa-pencil-ruler"></i> 辅助线
            </button>
            <button class="control-btn" id="btn-find-max">
                <i class="fas fa-search"></i> 找最大值
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-auto-play').onclick = () => this.toggleAutoPlay();
        document.getElementById('btn-step-guide').onclick = () => this.showStepGuide();
        document.getElementById('btn-auxiliary').onclick = () => this.toggleAuxiliaryLines();
        document.getElementById('btn-find-max').onclick = () => this.findMaxArea();
        document.getElementById('btn-reset').onclick = () => this.reset();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        
        const btn = document.getElementById('btn-auto-play');
        btn.innerHTML = this.isAutoPlaying 
            ? '<i class="fas fa-pause"></i> 暂停' 
            : '<i class="fas fa-play"></i> 自动演示';
        
        if (this.isAutoPlaying) {
            this.showGuide('🔄 观察点C沿圆运动时，面积如何变化');
        }
    }

    showStepGuide() {
        const container = document.getElementById('scene-canvas-container');
        
        // 移除旧面板
        const oldPanel = container.querySelector('.geometry-blackboard');
        if (oldPanel) {
            oldPanel.remove();
            return; // 点击关闭
        }
        
        // 添加黑板样式
        this.addBlackboardStyles();
        
        const panel = document.createElement('div');
        panel.className = 'geometry-blackboard';
        panel.innerHTML = this.getBlackboardContent();
        container.appendChild(panel);
        
        // 动画进入
        setTimeout(() => panel.classList.add('visible'), 50);
        
        // 绑定事件
        this.bindBlackboardEvents(panel);
    }
    
    getBlackboardContent() {
        const step = this.solutionSteps[this.currentStep];
        
        // 详细的解题内容
        const detailedContent = this.getDetailedStepContent(this.currentStep);
        
        return `
            <div class="blackboard-header">
                <div class="blackboard-title">
                    <i class="fas fa-chalkboard-teacher"></i>
                    解题思路讲解
                </div>
                <button class="blackboard-close" id="blackboard-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="blackboard-content">
                <!-- 原题题目 -->
                <div class="blackboard-section problem-section">
                    <div class="section-title">
                        <i class="fas fa-question-circle"></i> 原题
                    </div>
                    <div class="problem-box">
                        <p class="problem-text">
                            如图，点C在以O为圆心、半径为3的圆上运动。已知A(-5, 0)，B(-2, 4)，D(4, 0)，O为原点。
                        </p>
                        <p class="problem-question">
                            <strong>求：</strong> S<sub>△ABC</sub> + S<sub>△OCD</sub> 的<span class="highlight">最大值</span>
                        </p>
                    </div>
                </div>
                
                <!-- 知识点分析 -->
                <div class="blackboard-section knowledge-section">
                    <div class="section-title">
                        <i class="fas fa-lightbulb"></i> 考察知识点
                    </div>
                    <div class="knowledge-tags">
                        <span class="tag tag-primary">动点轨迹</span>
                        <span class="tag tag-primary">三角形面积</span>
                        <span class="tag tag-secondary">面积转化</span>
                        <span class="tag tag-secondary">辅助线构造</span>
                        <span class="tag tag-accent">对角线⊥面积最大</span>
                    </div>
                </div>
                
                <!-- 解题思路 -->
                <div class="blackboard-section thought-section">
                    <div class="section-title">
                        <i class="fas fa-brain"></i> 解题思路分析
                    </div>
                    <div class="thought-content">
                        <div class="thought-item">
                            <span class="thought-icon">❓</span>
                            <div class="thought-text">
                                <strong>直觉想法：</strong>
                                C在最高点时，△ABC面积最大 → 但此时△OCD不是最大！
                            </div>
                        </div>
                        <div class="thought-item">
                            <span class="thought-icon">💡</span>
                            <div class="thought-text">
                                <strong>核心发现：</strong>
                                两个三角形不同时取到最大值，不能分开求！
                            </div>
                        </div>
                        <div class="thought-item">
                            <span class="thought-icon">🔑</span>
                            <div class="thought-text">
                                <strong>解题关键：</strong>
                                将两个三角形面积和 → 转化为四边形面积问题
                            </div>
                        </div>
                        <div class="thought-item">
                            <span class="thought-icon">✨</span>
                            <div class="thought-text">
                                <strong>数学原理：</strong>
                                四边形面积 = ½ × d₁ × d₂ × sin(θ)，当θ=90°时最大
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 条件分析 -->
                <div class="blackboard-section conditions-section">
                    <div class="section-title">
                        <i class="fas fa-list-check"></i> 已知条件梳理
                    </div>
                    <div class="conditions-grid">
                        <div class="condition-item">
                            <span class="condition-label">圆O：</span>
                            <span class="condition-value">x² + y² = 9</span>
                        </div>
                        <div class="condition-item">
                            <span class="condition-label">点A：</span>
                            <span class="condition-value">(-5, 0)</span>
                        </div>
                        <div class="condition-item">
                            <span class="condition-label">点B：</span>
                            <span class="condition-value">(-2, 4)</span>
                        </div>
                        <div class="condition-item">
                            <span class="condition-label">点D：</span>
                            <span class="condition-value">(4, 0)</span>
                        </div>
                        <div class="condition-item">
                            <span class="condition-label">点C：</span>
                            <span class="condition-value">(3cosθ, 3sinθ) 在圆上</span>
                        </div>
                    </div>
                </div>
                
                <!-- 当前解题步骤 -->
                <div class="blackboard-section steps-section">
                    <div class="section-title">
                        <i class="fas fa-shoe-prints"></i> 详细解题步骤
                    </div>
                    <div class="steps-progress">
                        ${this.solutionSteps.map((s, i) => `
                            <div class="step-indicator ${i === this.currentStep ? 'active' : ''} ${i < this.currentStep ? 'completed' : ''}">
                                <span class="step-number">${i + 1}</span>
                            </div>
                        `).join('<div class="step-line"></div>')}
                    </div>
                    
                    <div class="current-step-detail">
                        <div class="step-header">
                            <span class="step-badge">第 ${this.currentStep + 1} 步</span>
                            <span class="step-title-text">${step.title}</span>
                        </div>
                        <div class="step-detail-content">
                            ${detailedContent}
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="blackboard-footer">
                <button class="bb-btn bb-btn-secondary" id="bb-prev" ${this.currentStep === 0 ? 'disabled' : ''}>
                    <i class="fas fa-arrow-left"></i> 上一步
                </button>
                <button class="bb-btn bb-btn-primary" id="bb-action">
                    <i class="fas fa-play"></i> 演示此步骤
                </button>
                <button class="bb-btn bb-btn-secondary" id="bb-next" ${this.currentStep >= this.maxStep ? 'disabled' : ''}>
                    下一步 <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    }
    
    getDetailedStepContent(stepIndex) {
        const contents = [
            // Step 0: 观察题目
            `<div class="detail-block">
                <p><strong>🎯 目标：</strong>理解题目要求</p>
                <ul class="detail-list">
                    <li>点C是<span class="hl-red">动点</span>，在圆O上运动</li>
                    <li>需要求的是两个三角形面积之<span class="hl-blue">和</span>的最大值</li>
                    <li>不是分别求最大，是<span class="hl-green">同时</span>考虑！</li>
                </ul>
                <div class="detail-tip">
                    💡 拖动红色点C，观察两个三角形的面积变化
                </div>
            </div>`,
            
            // Step 1: 动态演示
            `<div class="detail-block">
                <p><strong>🔍 观察发现：</strong></p>
                <ul class="detail-list">
                    <li>当C移动时，△ABC（红色）和△OCD（蓝色）都在变化</li>
                    <li>面积计算公式：S = ½ × 底 × 高</li>
                    <li>观察：哪个位置面积和最大？</li>
                </ul>
                <div class="detail-formula">
                    S<sub>△ABC</sub> = ½|<span class="hl-red">AB</span> × <span class="hl-red">AC</span>|
                    <br>
                    S<sub>△OCD</sub> = ½|<span class="hl-blue">OC</span> × <span class="hl-blue">OD</span>|
                </div>
            </div>`,
            
            // Step 2: 发现问题
            `<div class="detail-block">
                <p><strong>❗ 关键发现：</strong></p>
                <div class="discovery-box">
                    <p>当C在圆顶（最高点）时：</p>
                    <ul class="detail-list">
                        <li>△ABC 面积最大 ✅</li>
                        <li>但 △OCD 面积不是最大 ❌</li>
                    </ul>
                    <p class="hl-orange">⚠️ 两个三角形不同时取最大值！</p>
                </div>
                <div class="detail-tip">
                    💡 这说明不能分开优化，需要整体考虑！
                </div>
            </div>`,
            
            // Step 3: 构造辅助线
            `<div class="detail-block">
                <p><strong>✏️ 为什么要做辅助线？</strong></p>
                <ul class="detail-list">
                    <li>目的：将两个分散的三角形<span class="hl-green">联系起来</span></li>
                    <li>连接A和D：形成四边形ABCD的一条对角线</li>
                    <li>连接B和O：寻找面积转化的关键</li>
                </ul>
                <div class="auxiliary-reason">
                    <p><strong>辅助线选择原因：</strong></p>
                    <p>通过连接AD，可以把△ABC和△OCD"拼接"成一个与四边形相关的问题</p>
                </div>
            </div>`,
            
            // Step 4: 面积转化
            `<div class="detail-block">
                <p><strong>🔄 面积等量转化：</strong></p>
                <div class="transform-box">
                    <p>利用三角形面积的等量关系：</p>
                    <p class="formula-big">
                        S<sub>△ABC</sub> + S<sub>△OCD</sub> = S<sub>四边形BOCD</sub>的一部分
                    </p>
                    <p>转化后的问题变为：</p>
                    <p class="hl-blue">求四边形对角线乘积的最大值</p>
                </div>
                <div class="detail-formula">
                    S = ½ × d₁ × d₂ × sin(θ)
                </div>
            </div>`,
            
            // Step 5: 求最大值
            `<div class="detail-block">
                <p><strong>✅ 最终结论：</strong></p>
                <div class="conclusion-box">
                    <p class="conclusion-key">当两条对角线<span class="hl-red">垂直</span>时，面积最大！</p>
                    <div class="detail-formula">
                        sin(90°) = 1 → S<sub>max</sub> = ½ × d₁ × d₂
                    </div>
                </div>
                <ul class="detail-list">
                    <li>找到使对角线⊥的C点位置</li>
                    <li>代入计算得到最大值</li>
                </ul>
                <div class="detail-tip success">
                    🎉 点击"演示"按钮，看系统自动找到最大值位置！
                </div>
            </div>`
        ];
        
        return contents[stepIndex] || contents[0];
    }
    
    addBlackboardStyles() {
        if (document.getElementById('blackboard-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'blackboard-styles';
        style.textContent = `
            .geometry-blackboard {
                position: absolute;
                left: 20px;
                top: 80px;
                bottom: 80px;
                width: 420px;
                background: #1a1f2e;
                border: 1px solid #2d3548;
                border-radius: 12px;
                box-shadow: 0 16px 48px rgba(0,0,0,0.35);
                display: flex;
                flex-direction: column;
                font-family: system-ui, -apple-system, sans-serif;
                opacity: 0;
                transform: translateX(-20px);
                transition: all 0.3s ease;
                z-index: 200;
                overflow: hidden;
            }
            .geometry-blackboard.visible {
                opacity: 1;
                transform: translateX(0);
            }
            
            .blackboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 14px 18px;
                background: #252b3d;
                border-bottom: 1px solid #2d3548;
            }
            .blackboard-title {
                color: #f1f5f9;
                font-size: 16px;
                font-weight: 600;
            }
            .blackboard-title i {
                margin-right: 10px;
                color: #10b981;
            }
            .blackboard-close {
                background: rgba(255,255,255,0.08);
                border: none;
                color: #94a3b8;
                width: 28px;
                height: 28px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s;
            }
            .blackboard-close:hover {
                background: rgba(255,255,255,0.15);
                color: #f1f5f9;
            }
            
            .blackboard-content {
                flex: 1;
                overflow-y: auto;
                padding: 14px;
            }
            .blackboard-content::-webkit-scrollbar {
                width: 5px;
            }
            .blackboard-content::-webkit-scrollbar-thumb {
                background: #3d4559;
                border-radius: 3px;
            }
            
            .blackboard-section {
                margin-bottom: 14px;
                padding: 12px 14px;
                background: rgba(255,255,255,0.03);
                border-radius: 8px;
            }
            .section-title {
                font-size: 13px;
                font-weight: 600;
                color: #a1a1aa;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .section-title i {
                margin-right: 8px;
                color: #10b981;
            }
            
            /* 题目区 */
            .problem-box {
                background: rgba(0,0,0,0.25);
                padding: 12px;
                border-radius: 8px;
            }
            .problem-text {
                color: #d4d4d8;
                font-size: 14px;
                line-height: 1.6;
                margin-bottom: 8px;
            }
            .problem-question {
                color: #fbbf24;
                font-size: 15px;
            }
            .highlight {
                color: #ef4444;
                font-weight: bold;
            }
            
            /* 知识点标签 */
            .knowledge-tags {
                display: flex;
                flex-wrap: wrap;
                gap: 6px;
            }
            .tag {
                padding: 4px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 500;
            }
            .tag-primary {
                background: #10b981;
                color: white;
            }
            .tag-secondary {
                background: #52525b;
                color: #e4e4e7;
            }
            .tag-accent {
                background: #f59e0b;
                color: white;
            }
            
            /* 思路分析 */
            .thought-item {
                display: flex;
                align-items: flex-start;
                margin-bottom: 10px;
                padding: 8px;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
            }
            .thought-icon {
                font-size: 18px;
                margin-right: 10px;
                flex-shrink: 0;
            }
            .thought-text {
                color: #cbd5e1;
                font-size: 13px;
                line-height: 1.5;
            }
            .thought-text strong {
                color: #f1f5f9;
            }
            
            /* 条件梳理 */
            .conditions-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
            }
            .condition-item {
                background: rgba(0,0,0,0.2);
                padding: 8px 12px;
                border-radius: 6px;
            }
            .condition-label {
                color: #94a3b8;
                font-size: 12px;
            }
            .condition-value {
                color: #60a5fa;
                font-family: monospace;
                font-size: 13px;
            }
            
            /* 步骤进度条 */
            .steps-progress {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
            }
            .step-indicator {
                width: 26px;
                height: 26px;
                border-radius: 50%;
                background: #3f3f46;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s;
            }
            .step-indicator.active {
                background: #10b981;
                transform: scale(1.15);
                box-shadow: 0 0 10px rgba(16,185,129,0.4);
            }
            .step-indicator.completed {
                background: #059669;
            }
            .step-number {
                color: white;
                font-size: 11px;
                font-weight: 600;
            }
            .step-line {
                width: 16px;
                height: 2px;
                background: #3f3f46;
            }
            
            /* 当前步骤详情 */
            .current-step-detail {
                background: rgba(16,185,129,0.08);
                border: 1px solid rgba(16,185,129,0.25);
                border-radius: 8px;
                overflow: hidden;
            }
            .step-header {
                background: rgba(16,185,129,0.15);
                padding: 10px 14px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .step-badge {
                background: #10b981;
                color: white;
                padding: 3px 10px;
                border-radius: 4px;
                font-size: 12px;
                font-weight: 600;
            }
            .step-title-text {
                color: #f1f5f9;
                font-size: 14px;
                font-weight: 500;
            }
            .step-detail-content {
                padding: 14px;
            }
            
            /* 详情块样式 */
            .detail-block p {
                color: #d4d4d8;
                font-size: 13px;
                margin-bottom: 10px;
            }
            .detail-list {
                margin: 8px 0;
                padding-left: 20px;
            }
            .detail-list li {
                color: #a1a1aa;
                font-size: 13px;
                margin-bottom: 6px;
                line-height: 1.5;
            }
            .detail-tip {
                background: rgba(16,185,129,0.15);
                padding: 10px 12px;
                margin-top: 12px;
                border-radius: 6px;
                color: #6ee7b7;
                font-size: 13px;
            }
            .detail-tip.success {
                background: rgba(16,185,129,0.2);
                color: #6ee7b7;
            }
            .detail-formula {
                background: rgba(0,0,0,0.3);
                padding: 12px;
                border-radius: 8px;
                text-align: center;
                color: #fbbf24;
                font-family: 'Times New Roman', serif;
                font-size: 15px;
                margin: 10px 0;
            }
            .discovery-box, .transform-box, .conclusion-box {
                background: rgba(0,0,0,0.3);
                padding: 12px;
                border-radius: 8px;
                margin: 10px 0;
            }
            .discovery-box p, .transform-box p, .conclusion-box p {
                margin-bottom: 8px;
            }
            .conclusion-key {
                font-size: 15px !important;
                color: #fbbf24 !important;
                font-weight: 600;
            }
            .auxiliary-reason {
                margin-top: 12px;
                padding: 10px;
                background: rgba(16,185,129,0.15);
                border-radius: 8px;
                border: 1px dashed #10b981;
            }
            .auxiliary-reason p {
                color: #6ee7b7 !important;
            }
            
            /* 高亮文字 */
            .hl-red { color: #ef4444; font-weight: 600; }
            .hl-blue { color: #60a5fa; font-weight: 600; }
            .hl-green { color: #10b981; font-weight: 600; }
            .hl-orange { color: #f59e0b; font-weight: 600; }
            
            /* 底部按钮 */
            .blackboard-footer {
                display: flex;
                gap: 8px;
                padding: 14px;
                background: #1f2533;
                border-top: 1px solid #2d3548;
            }
            .bb-btn {
                flex: 1;
                padding: 10px 14px;
                border: none;
                border-radius: 6px;
                font-size: 13px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 6px;
            }
            .bb-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            .bb-btn-primary {
                background: #10b981;
                color: white;
            }
            .bb-btn-primary:hover:not(:disabled) {
                background: #059669;
            }
            .bb-btn-secondary {
                background: #3f3f46;
                color: #d4d4d8;
            }
            .bb-btn-secondary:hover:not(:disabled) {
                background: #52525b;
            }
        `;
        document.head.appendChild(style);
    }
    
    bindBlackboardEvents(panel) {
        // 关闭按钮
        panel.querySelector('#blackboard-close').onclick = () => {
            panel.classList.remove('visible');
            setTimeout(() => panel.remove(), 300);
        };
        
        // 上一步
        panel.querySelector('#bb-prev').onclick = () => {
            if (this.currentStep > 0) {
                this.currentStep--;
                panel.remove();
                this.showStepGuide();
            }
        };
        
        // 下一步
        panel.querySelector('#bb-next').onclick = () => {
            if (this.currentStep < this.maxStep) {
                this.currentStep++;
                panel.remove();
                this.showStepGuide();
            }
        };
        
        // 演示按钮
        panel.querySelector('#bb-action').onclick = () => {
            const step = this.solutionSteps[this.currentStep];
            this.executeStepAction(step.action);
        };
    }

    executeStepAction(action) {
        switch (action) {
            case 'observeProblem':
                this.showGuide('📖 题目：点C在圆O上运动，求 S_ABC + S_OCD 的最大值');
                break;
            case 'animatePointC':
                this.isAutoPlaying = true;
                document.getElementById('btn-auto-play').innerHTML = '<i class="fas fa-pause"></i> 暂停';
                this.showGuide('🔄 观察：随着C点移动，两个三角形面积在变化');
                break;
            case 'showDiscovery':
                this.showDiscoveryAnimation();
                break;
            case 'drawAuxiliaryLines':
                this.toggleAuxiliaryLines(true);
                break;
            case 'showAreaTransform':
                this.showAreaTransformAnimation();
                break;
            case 'showMaxCondition':
                this.findMaxArea();
                break;
        }
    }

    showDiscoveryAnimation() {
        // 移动到"最高点"
        gsap.to(this, {
            duration: 1.5,
            onUpdate: () => {
                this.params.angleC += 0.02;
                if (this.params.angleC > Math.PI / 2) {
                    this.params.angleC = Math.PI / 2;
                }
                this.updatePointCPosition(this.params.angleC);
            },
            onComplete: () => {
                this.showGuide('❓ C在最高点时，△ABC最大，但△OCD不是最大！');
                
                // 闪烁提示
                setTimeout(() => {
                    this.showGuide('💡 所以两个三角形不同时取到最大值！问题在哪？');
                }, 2500);
            }
        });
    }

    toggleAuxiliaryLines(forceShow = false) {
        if (this.auxiliaryLines.length > 0 && !forceShow) {
            // 移除辅助线
            this.auxiliaryLines.forEach(line => this.mainGroup.remove(line));
            this.auxiliaryLines = [];
            this.showGuide('已隐藏辅助线');
        } else {
            // 绘制辅助线
            this.drawAuxiliaryLines();
        }
    }

    drawAuxiliaryLines() {
        // 清除旧的辅助线
        this.auxiliaryLines.forEach(line => this.mainGroup.remove(line));
        this.auxiliaryLines = [];
        
        const posC = this.points.C.position;
        
        // 辅助线1：连接A和D
        const aux1 = this.createLine(
            this.params.pointA,
            this.params.pointD,
            this.colors.auxiliary,
            true  // 虚线
        );
        this.auxiliaryLines.push(aux1);
        
        // 辅助线2：连接B和O
        const aux2 = this.createLine(
            this.params.pointB,
            this.params.circleCenter,
            this.colors.auxiliary,
            true
        );
        this.auxiliaryLines.push(aux2);
        
        this.showGuide('✏️ 辅助线已绘制：连接AD，连接BO');
        
        // 动画效果
        this.auxiliaryLines.forEach((line, i) => {
            gsap.fromTo(line.material, 
                { opacity: 0 },
                { opacity: 1, duration: 0.5, delay: i * 0.3 }
            );
        });
    }

    showAreaTransformAnimation() {
        // 面积转化动画
        this.showGuide('🔀 利用面积等量转化...');
        
        // 闪烁三角形表示等量关系
        setTimeout(() => {
            if (this.triangles.ABC) {
                gsap.to(this.triangles.ABC.material, {
                    opacity: 0.6,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 3
                });
            }
        }, 500);
        
        setTimeout(() => {
            if (this.triangles.OCD) {
                gsap.to(this.triangles.OCD.material, {
                    opacity: 0.6,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 3
                });
            }
        }, 1500);
        
        setTimeout(() => {
            this.showGuide('💡 转化后：求四边形面积最大 → 对角线⊥时最大！');
        }, 3000);
    }

    findMaxArea() {
        this.showGuide('🔍 正在寻找最大值位置...');
        
        // 遍历所有角度，找最大面积
        let maxArea = 0;
        let maxAngle = 0;
        
        for (let angle = 0; angle < Math.PI * 2; angle += 0.01) {
            const cx = this.params.circleRadius * Math.cos(angle);
            const cy = this.params.circleRadius * Math.sin(angle);
            const posC = new THREE.Vector3(cx, cy, 0);
            
            const areaABC = this.calculateArea(this.params.pointA, this.params.pointB, posC);
            const areaOCD = this.calculateArea(this.params.circleCenter, posC, this.params.pointD);
            const total = areaABC + areaOCD;
            
            if (total > maxArea) {
                maxArea = total;
                maxAngle = angle;
            }
        }
        
        // 动画移动到最大值位置
        gsap.to(this.params, {
            angleC: maxAngle,
            duration: 1.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.updatePointCPosition(this.params.angleC);
            },
            onComplete: () => {
                this.showGuide(`✅ 找到最大值！S_max = ${maxArea.toFixed(2)}`);
                
                // 高亮显示
                this.highlightMaxState();
            }
        });
    }

    highlightMaxState() {
        // 点C发光效果
        if (this.pointCGlow) {
            gsap.to(this.pointCGlow.material, {
                opacity: 0.5,
                duration: 0.5,
                yoyo: true,
                repeat: 3
            });
            gsap.to(this.pointCGlow.scale, {
                x: 1.5,
                y: 1.5,
                duration: 0.5,
                yoyo: true,
                repeat: 3
            });
        }
        
        // 三角形高亮
        [this.triangles.ABC, this.triangles.OCD].forEach(tri => {
            if (tri) {
                gsap.to(tri.material, {
                    opacity: 0.5,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 2
                });
            }
        });
    }

    reset() {
        this.isAutoPlaying = false;
        this.currentStep = 0;
        this.maxAreaFound = 0;
        this.areaHistory = [];
        
        // 重置点C到初始位置
        this.updatePointCPosition(Math.PI / 2);
        
        // 移除辅助线
        this.auxiliaryLines.forEach(line => this.mainGroup.remove(line));
        this.auxiliaryLines = [];
        
        // 重置按钮
        document.getElementById('btn-auto-play').innerHTML = '<i class="fas fa-play"></i> 自动演示';
        
        // 重置最大值显示
        const elMax = document.getElementById('area-max');
        if (elMax) elMax.textContent = '0.00';
        
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

    showGuide(message) {
        const container = document.getElementById('scene-canvas-container');
        const old = container.querySelector('.scene-guide-message');
        if (old) old.remove();
        
        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        guide.style.cssText = `
            background: rgba(255,255,255,0.95);
            color: #1f2937;
            border: 1px solid #e5e7eb;
        `;
        container.appendChild(guide);
        
        setTimeout(() => guide.classList.add('visible'), 100);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 300);
        }, 4000);
    }

    animate(time, delta) {
        // 自动播放时，点C沿圆运动
        if (this.isAutoPlaying && !this.isDragging) {
            this.params.angleC += delta * 0.5;
            if (this.params.angleC > Math.PI * 2) {
                this.params.angleC -= Math.PI * 2;
            }
            this.updatePointCPosition(this.params.angleC);
        }
        
        // 点C发光效果呼吸动画
        if (this.pointCGlow && !this.isDragging) {
            const scale = 1 + Math.sin(time * 2) * 0.1;
            this.pointCGlow.scale.set(scale, scale, 1);
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        // 清理HTML元素
        const container = document.getElementById('scene-canvas-container');
        const areaPanel = container.querySelector('.geometry-area-panel');
        const stepPanel = container.querySelector('.geometry-step-panel');
        if (areaPanel) areaPanel.remove();
        if (stepPanel) stepPanel.remove();
        
        // 清理事件监听器
        if (this.dragHandlers) {
            container.removeEventListener('mousedown', this.dragHandlers.onMouseDown);
            container.removeEventListener('mousemove', this.dragHandlers.onMouseMove);
            container.removeEventListener('mouseup', this.dragHandlers.onMouseUp);
        }
        
        if (this.mainGroup) this.scene.remove(this.mainGroup);
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
    }
};
