/**
 * 立体几何题解题场景 - 正方体截面问题
 * ============================================
 * 题目：用平面截正方体，探索截面的形状和面积
 * 
 * 核心知识点：
 * - 空间想象力
 * - 截面构造方法
 * - 截面面积计算
 * - 平面与立体的关系
 * ============================================
 */
window.SolidGeometryScene = class SolidGeometryScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 正方体相关
        this.cubeSize = 6;
        this.cubeVertices = [];    // 8个顶点
        this.cubeEdges = [];       // 12条棱
        this.cubeFaces = [];       // 6个面
        this.vertexLabels = {};    // 顶点标签
        
        // 截面相关
        this.cutPlane = null;          // 截面平面
        this.cutSection = null;        // 截面图形
        this.cutPoints = [];           // 截面与棱的交点
        this.planeHeight = 0.5;        // 截面位置参数 (0-1)
        this.planeAngleX = 0;          // 截面X方向倾斜角
        this.planeAngleY = 0;          // 截面Y方向倾斜角
        
        // 拖拽点
        this.dragPoints = [];
        this.isDragging = false;
        this.dragTarget = null;
        
        // 状态
        this.isAutoPlaying = false;
        this.currentStep = 0;
        this.maxStep = 5;
        this.showWireframe = true;
        this.showVertexLabels = true;
        
        // 相机位置
        this.defaultCameraPos = { x: 12, y: 10, z: 15 };
        
        // 颜色方案（立体几何题专用 - 纯白背景）
        this.colors = {
            background: 0xffffff,
            cube: 0x3b82f6,            // 正方体 - 蓝色
            cubeEdge: 0x1e3a5f,        // 棱 - 深蓝
            cubeFace: 0x3b82f6,        // 面 - 蓝色半透明
            section: 0xef4444,         // 截面 - 红色
            sectionEdge: 0xdc2626,     // 截面边 - 深红
            vertex: 0x2563eb,          // 顶点 - 蓝色
            vertexLabel: 0x1f2937,     // 标签 - 深灰
            dragPoint: 0x10b981,       // 拖拽点 - 绿色
            highlight: 0xf59e0b,       // 高亮 - 橙色
            auxiliary: 0x8b5cf6,       // 辅助 - 紫色
            grid: 0xe5e7eb             // 网格 - 浅灰
        };
        
        // 解题步骤
        this.solutionSteps = [
            {
                id: 0,
                title: '📖 理解题意',
                description: '认识正方体的顶点、棱和面',
                action: 'observeCube'
            },
            {
                id: 1,
                title: '✂️ 引入截面',
                description: '用一个平面去"切"正方体',
                action: 'introducePlane'
            },
            {
                id: 2,
                title: '🔍 探索截面形状',
                description: '移动截面，观察不同位置的截面形状',
                action: 'exploreSections'
            },
            {
                id: 3,
                title: '📐 构造截面方法',
                description: '学习确定截面的方法',
                action: 'constructMethod'
            },
            {
                id: 4,
                title: '📏 计算截面面积',
                description: '根据截面形状计算面积',
                action: 'calculateArea'
            },
            {
                id: 5,
                title: '✅ 找最大截面',
                description: '探索什么位置截面面积最大',
                action: 'findMaxSection'
            }
        ];
    }

    init() {
        // 纯白背景
        this.scene.background = new THREE.Color(this.colors.background);
        
        // 透视相机设置
        this.camera.position.set(
            this.defaultCameraPos.x,
            this.defaultCameraPos.y,
            this.defaultCameraPos.z
        );
        this.camera.lookAt(0, 0, 0);
        
        this.setupLights();
        this.setupEnvironment();
        this.setupScene();
        this.setupUI();
        this.setupDragControl();
        
        // 初始提示
        setTimeout(() => {
            this.showGuide('🎲 立体几何：拖动绿色控制点调整截面位置');
        }, 500);
    }

    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);
        
        // 主光源
        const main = new THREE.DirectionalLight(0xffffff, 0.8);
        main.position.set(10, 20, 15);
        main.castShadow = true;
        this.scene.add(main);
        
        // 补光
        const fill = new THREE.DirectionalLight(0xffffff, 0.3);
        fill.position.set(-10, 10, -10);
        this.scene.add(fill);
    }

    setupEnvironment() {
        // 地面网格（淡灰色）
        const gridHelper = new THREE.GridHelper(30, 30, this.colors.grid, 0xf3f4f6);
        gridHelper.position.y = -this.cubeSize / 2 - 0.5;
        this.scene.add(gridHelper);
        
        // 坐标轴（细、淡）
        this.createAxes();
    }

    createAxes() {
        const axisLength = 10;
        const colors = {
            x: 0xef4444,  // 红
            y: 0x10b981,  // 绿
            z: 0x3b82f6   // 蓝
        };
        
        // X轴
        const xGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ]);
        const xAxis = new THREE.Line(xGeo, new THREE.LineBasicMaterial({ 
            color: colors.x, 
            transparent: true, 
            opacity: 0.3 
        }));
        this.scene.add(xAxis);
        
        // Y轴
        const yGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -axisLength, 0),
            new THREE.Vector3(0, axisLength, 0)
        ]);
        const yAxis = new THREE.Line(yGeo, new THREE.LineBasicMaterial({ 
            color: colors.y, 
            transparent: true, 
            opacity: 0.3 
        }));
        this.scene.add(yAxis);
        
        // Z轴
        const zGeo = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -axisLength),
            new THREE.Vector3(0, 0, axisLength)
        ]);
        const zAxis = new THREE.Line(zGeo, new THREE.LineBasicMaterial({ 
            color: colors.z, 
            transparent: true, 
            opacity: 0.3 
        }));
        this.scene.add(zAxis);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 1. 创建正方体
        this.createCube();
        
        // 2. 创建顶点标签
        this.createVertexLabels();
        
        // 3. 创建截面
        this.createCutPlane();
        
        // 4. 创建拖拽控制点
        this.createDragPoints();
        
        // 5. 创建信息面板
        this.createInfoPanel();
    }

    createCube() {
        const s = this.cubeSize / 2;
        
        // 8个顶点位置（正方体ABCD-A'B'C'D'）
        const vertices = [
            // 底面 ABCD
            new THREE.Vector3(-s, -s, -s),  // A (0)
            new THREE.Vector3(s, -s, -s),   // B (1)
            new THREE.Vector3(s, -s, s),    // C (2)
            new THREE.Vector3(-s, -s, s),   // D (3)
            // 顶面 A'B'C'D'
            new THREE.Vector3(-s, s, -s),   // A' (4)
            new THREE.Vector3(s, s, -s),    // B' (5)
            new THREE.Vector3(s, s, s),     // C' (6)
            new THREE.Vector3(-s, s, s)     // D' (7)
        ];
        
        this.cubeVertices = vertices;
        
        // 12条棱的索引
        const edgeIndices = [
            // 底面
            [0, 1], [1, 2], [2, 3], [3, 0],
            // 顶面
            [4, 5], [5, 6], [6, 7], [7, 4],
            // 侧棱
            [0, 4], [1, 5], [2, 6], [3, 7]
        ];
        
        // 创建棱（线框）
        edgeIndices.forEach(([i, j]) => {
            const geo = new THREE.BufferGeometry().setFromPoints([
                vertices[i], vertices[j]
            ]);
            const mat = new THREE.LineBasicMaterial({
                color: this.colors.cubeEdge,
                linewidth: 2
            });
            const edge = new THREE.Line(geo, mat);
            this.mainGroup.add(edge);
            this.cubeEdges.push({ line: edge, start: i, end: j });
        });
        
        // 创建顶点球
        vertices.forEach((v, i) => {
            const geo = new THREE.SphereGeometry(0.12, 16, 16);
            const mat = new THREE.MeshStandardMaterial({
                color: this.colors.vertex,
                metalness: 0.3,
                roughness: 0.5
            });
            const sphere = new THREE.Mesh(geo, mat);
            sphere.position.copy(v);
            sphere.userData = {
                name: this.getVertexName(i),
                hoverTitle: `顶点 ${this.getVertexName(i)}`,
                hoverDesc: `坐标: (${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)})`,
                hoverIcon: 'fa-circle'
            };
            this.mainGroup.add(sphere);
            this.interactables.push(sphere);
        });
        
        // 创建半透明面（可选显示）
        this.createCubeFaces();
    }

    getVertexName(index) {
        const names = ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"];
        return names[index];
    }

    createCubeFaces() {
        const s = this.cubeSize / 2;
        const faceIndices = [
            // 底面 ABCD
            [[0, 1, 2, 3], new THREE.Vector3(0, -1, 0)],
            // 顶面 A'B'C'D'
            [[4, 5, 6, 7], new THREE.Vector3(0, 1, 0)],
            // 前面 DCC'D'
            [[3, 2, 6, 7], new THREE.Vector3(0, 0, 1)],
            // 后面 ABB'A'
            [[0, 1, 5, 4], new THREE.Vector3(0, 0, -1)],
            // 左面 ADD'A'
            [[0, 3, 7, 4], new THREE.Vector3(-1, 0, 0)],
            // 右面 BCC'B'
            [[1, 2, 6, 5], new THREE.Vector3(1, 0, 0)]
        ];
        
        faceIndices.forEach(([indices, normal]) => {
            const shape = new THREE.Shape();
            const v = this.cubeVertices;
            
            // 投影到面上创建2D形状
            const points = indices.map(i => v[i]);
            
            // 创建面几何体
            const geo = new THREE.BufferGeometry();
            const positions = [];
            
            // 两个三角形组成四边形
            positions.push(
                points[0].x, points[0].y, points[0].z,
                points[1].x, points[1].y, points[1].z,
                points[2].x, points[2].y, points[2].z,
                points[0].x, points[0].y, points[0].z,
                points[2].x, points[2].y, points[2].z,
                points[3].x, points[3].y, points[3].z
            );
            
            geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
            geo.computeVertexNormals();
            
            const mat = new THREE.MeshStandardMaterial({
                color: this.colors.cubeFace,
                transparent: true,
                opacity: 0.1,
                side: THREE.DoubleSide
            });
            
            const face = new THREE.Mesh(geo, mat);
            this.mainGroup.add(face);
            this.cubeFaces.push(face);
        });
    }

    createVertexLabels() {
        const names = ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"];
        
        this.cubeVertices.forEach((v, i) => {
            const label = this.createTextSprite(names[i], this.colors.vertexLabel);
            label.position.set(v.x * 1.15, v.y * 1.15, v.z * 1.15);
            label.scale.set(1.5, 1.5, 1);
            this.mainGroup.add(label);
            this.vertexLabels[names[i]] = label;
        });
    }

    createTextSprite(text, color = 0x1f2937) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // 白色背景圆
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.beginPath();
        ctx.arc(64, 64, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // 边框
        ctx.strokeStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // 文字
        ctx.fillStyle = '#' + color.toString(16).padStart(6, '0');
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const mat = new THREE.SpriteMaterial({ map: texture });
        return new THREE.Sprite(mat);
    }

    createCutPlane() {
        // 初始化截面（水平面）
        this.updateCutSection();
    }

    updateCutSection() {
        // 移除旧截面
        if (this.cutSection) {
            this.mainGroup.remove(this.cutSection);
        }
        if (this.cutPlane) {
            this.mainGroup.remove(this.cutPlane);
        }
        
        // 计算截面交点
        this.cutPoints = this.calculateCutPoints();
        
        if (this.cutPoints.length >= 3) {
            // 创建截面多边形
            this.cutSection = this.createSectionMesh(this.cutPoints);
            this.mainGroup.add(this.cutSection);
            
            // 创建截面边框
            this.createSectionEdges(this.cutPoints);
        }
        
        // 更新信息面板
        this.updateInfoPanel();
    }

    calculateCutPoints() {
        const points = [];
        const s = this.cubeSize / 2;
        
        // 截面平面方程：y = h（高度）+ 倾斜
        // 简化：使用三个控制点定义平面
        const controlY = (this.planeHeight - 0.5) * this.cubeSize;
        const tiltX = this.planeAngleX * s;
        const tiltZ = this.planeAngleY * s;
        
        // 平面由三点确定
        const p1 = new THREE.Vector3(-s, controlY - tiltX - tiltZ, -s);
        const p2 = new THREE.Vector3(s, controlY + tiltX - tiltZ, -s);
        const p3 = new THREE.Vector3(-s, controlY - tiltX + tiltZ, s);
        
        // 计算平面法向量
        const v1 = new THREE.Vector3().subVectors(p2, p1);
        const v2 = new THREE.Vector3().subVectors(p3, p1);
        const normal = new THREE.Vector3().crossVectors(v1, v2).normalize();
        const d = -normal.dot(p1);
        
        // 对每条棱求交点
        this.cubeEdges.forEach(edge => {
            const start = this.cubeVertices[edge.start];
            const end = this.cubeVertices[edge.end];
            
            const intersection = this.linePlaneIntersection(start, end, normal, d);
            if (intersection) {
                points.push(intersection);
            }
        });
        
        // 按角度排序（形成凸多边形）
        if (points.length > 2) {
            const center = points.reduce((acc, p) => acc.add(p.clone()), new THREE.Vector3()).divideScalar(points.length);
            
            points.sort((a, b) => {
                const angleA = Math.atan2(a.z - center.z, a.x - center.x);
                const angleB = Math.atan2(b.z - center.z, b.x - center.x);
                return angleA - angleB;
            });
        }
        
        return points;
    }

    linePlaneIntersection(lineStart, lineEnd, planeNormal, planeD) {
        const direction = new THREE.Vector3().subVectors(lineEnd, lineStart);
        const denominator = planeNormal.dot(direction);
        
        if (Math.abs(denominator) < 0.0001) return null; // 平行
        
        const t = -(planeNormal.dot(lineStart) + planeD) / denominator;
        
        if (t < 0 || t > 1) return null; // 交点不在线段上
        
        return new THREE.Vector3().addVectors(
            lineStart,
            direction.multiplyScalar(t)
        );
    }

    createSectionMesh(points) {
        if (points.length < 3) return null;
        
        // 创建凸多边形
        const shape = new THREE.Shape();
        
        // 计算中心和法向量用于投影
        const center = points.reduce((acc, p) => acc.add(p.clone()), new THREE.Vector3()).divideScalar(points.length);
        
        // 使用简单的三角形扇形方法
        const geo = new THREE.BufferGeometry();
        const positions = [];
        
        for (let i = 1; i < points.length - 1; i++) {
            positions.push(
                points[0].x, points[0].y, points[0].z,
                points[i].x, points[i].y, points[i].z,
                points[i + 1].x, points[i + 1].y, points[i + 1].z
            );
        }
        
        geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geo.computeVertexNormals();
        
        const mat = new THREE.MeshStandardMaterial({
            color: this.colors.section,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
            metalness: 0.2,
            roughness: 0.6
        });
        
        return new THREE.Mesh(geo, mat);
    }

    createSectionEdges(points) {
        // 移除旧边
        this.mainGroup.children = this.mainGroup.children.filter(
            child => !child.userData.isSectionEdge
        );
        
        if (points.length < 3) return;
        
        // 创建截面边框
        const edgePoints = [...points, points[0]]; // 闭合
        const geo = new THREE.BufferGeometry().setFromPoints(edgePoints);
        const mat = new THREE.LineBasicMaterial({
            color: this.colors.sectionEdge,
            linewidth: 3
        });
        const line = new THREE.Line(geo, mat);
        line.userData.isSectionEdge = true;
        this.mainGroup.add(line);
        
        // 在交点处创建小球
        points.forEach((p, i) => {
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(0.1, 16, 16),
                new THREE.MeshStandardMaterial({
                    color: this.colors.sectionEdge,
                    metalness: 0.5,
                    roughness: 0.3
                })
            );
            sphere.position.copy(p);
            sphere.userData.isSectionEdge = true;
            this.mainGroup.add(sphere);
        });
    }

    createDragPoints() {
        // 创建控制点（用于调整截面）
        const s = this.cubeSize / 2;
        const controlY = (this.planeHeight - 0.5) * this.cubeSize;
        
        // 主控制点（中心高度控制）
        const mainControl = this.createControlPoint(
            new THREE.Vector3(0, controlY, 0),
            '高度控制点',
            0x10b981,
            'height'
        );
        this.dragPoints.push(mainControl);
        
        // 倾斜控制点X
        const tiltXControl = this.createControlPoint(
            new THREE.Vector3(s + 1, controlY, 0),
            'X方向倾斜',
            0xef4444,
            'tiltX'
        );
        this.dragPoints.push(tiltXControl);
        
        // 倾斜控制点Z
        const tiltZControl = this.createControlPoint(
            new THREE.Vector3(0, controlY, s + 1),
            'Z方向倾斜',
            0x3b82f6,
            'tiltZ'
        );
        this.dragPoints.push(tiltZControl);
    }

    createControlPoint(position, name, color, type) {
        const geo = new THREE.SphereGeometry(0.25, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
            color,
            metalness: 0.4,
            roughness: 0.4,
            emissive: color,
            emissiveIntensity: 0.3
        });
        
        const sphere = new THREE.Mesh(geo, mat);
        sphere.position.copy(position);
        sphere.userData = {
            name,
            hoverTitle: name,
            hoverDesc: '拖动调整截面',
            hoverIcon: 'fa-arrows-alt',
            controlType: type,
            isControlPoint: true
        };
        
        this.mainGroup.add(sphere);
        this.interactables.push(sphere);
        
        return sphere;
    }

    createInfoPanel() {
        const container = document.getElementById('scene-canvas-container');
        
        // 移除旧面板
        const oldPanel = container.querySelector('.solid-geo-panel');
        if (oldPanel) oldPanel.remove();
        
        const panel = document.createElement('div');
        panel.className = 'solid-geo-panel';
        panel.innerHTML = `
            <button class="sg-panel-close" id="sg-panel-close" title="关闭" style="
                position: absolute;
                top: 10px;
                right: 10px;
                width: 28px;
                height: 28px;
                border: none;
                background: rgba(0,0,0,0.08);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 14px;
            ">
                <i class="fas fa-times"></i>
            </button>
            <div class="sg-panel-title">📐 截面信息</div>
            <div class="sg-info-item">
                <span class="sg-label">截面形状：</span>
                <span class="sg-value" id="section-shape">--</span>
            </div>
            <div class="sg-info-item">
                <span class="sg-label">顶点数：</span>
                <span class="sg-value" id="section-vertices">--</span>
            </div>
            <div class="sg-info-item">
                <span class="sg-label">截面面积：</span>
                <span class="sg-value" id="section-area">--</span>
            </div>
            <div class="sg-info-item highlight">
                <span class="sg-label">面积/正方体面积：</span>
                <span class="sg-value" id="section-ratio">--</span>
            </div>
            <div class="sg-divider"></div>
            <div class="sg-tips">
                <div class="sg-tip-title">💡 截面形状规律</div>
                <div class="sg-tip-content">
                    <p>• 3边 → 三角形</p>
                    <p>• 4边 → 四边形</p>
                    <p>• 5边 → 五边形</p>
                    <p>• 6边 → 六边形（最多）</p>
                </div>
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
            min-width: 200px;
        `;
        container.appendChild(panel);
        this.infoPanel = panel;
        
        // 绑定关闭按钮事件
        document.getElementById('sg-panel-close')?.addEventListener('click', () => {
            panel.style.display = 'none';
        });
        
        this.addInfoPanelStyles();
    }

    addInfoPanelStyles() {
        if (document.getElementById('solid-geo-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'solid-geo-styles';
        style.textContent = `
            .sg-panel-title {
                font-size: 16px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
            }
            .sg-info-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #f3f4f6;
            }
            .sg-info-item.highlight {
                background: linear-gradient(135deg, #fef3c7, #fde68a);
                margin: 8px -16px;
                padding: 12px 16px;
                border: none;
                border-radius: 8px;
            }
            .sg-label {
                color: #6b7280;
                font-size: 14px;
            }
            .sg-value {
                font-weight: 600;
                color: #1f2937;
                font-size: 14px;
            }
            .sg-divider {
                height: 1px;
                background: #e5e7eb;
                margin: 12px 0;
            }
            .sg-tips {
                background: #f9fafb;
                border-radius: 8px;
                padding: 12px;
            }
            .sg-tip-title {
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
                font-size: 14px;
            }
            .sg-tip-content {
                font-size: 12px;
                color: #6b7280;
                line-height: 1.6;
            }
            .sg-tip-content p {
                margin: 4px 0;
            }
        `;
        document.head.appendChild(style);
    }

    updateInfoPanel() {
        const n = this.cutPoints.length;
        
        // 形状名称
        const shapeNames = {
            3: '三角形 △',
            4: '四边形 ◇',
            5: '五边形 ⬠',
            6: '六边形 ⬡'
        };
        
        const shapeEl = document.getElementById('section-shape');
        const verticesEl = document.getElementById('section-vertices');
        const areaEl = document.getElementById('section-area');
        const ratioEl = document.getElementById('section-ratio');
        
        if (shapeEl) shapeEl.textContent = shapeNames[n] || `${n}边形`;
        if (verticesEl) verticesEl.textContent = n;
        
        // 计算面积
        const area = this.calculateSectionArea();
        const cubeface = this.cubeSize * this.cubeSize;
        const ratio = area / cubeface;
        
        if (areaEl) areaEl.textContent = area.toFixed(2);
        if (ratioEl) ratioEl.textContent = (ratio * 100).toFixed(1) + '%';
    }

    calculateSectionArea() {
        if (this.cutPoints.length < 3) return 0;
        
        // 使用鞋带公式（投影到平面后）
        let area = 0;
        const n = this.cutPoints.length;
        
        // 简化：使用3D多边形面积公式
        const center = this.cutPoints.reduce((acc, p) => acc.add(p.clone()), new THREE.Vector3()).divideScalar(n);
        
        for (let i = 0; i < n; i++) {
            const p1 = this.cutPoints[i];
            const p2 = this.cutPoints[(i + 1) % n];
            
            // 三角形面积
            const v1 = new THREE.Vector3().subVectors(p1, center);
            const v2 = new THREE.Vector3().subVectors(p2, center);
            const cross = new THREE.Vector3().crossVectors(v1, v2);
            area += cross.length() / 2;
        }
        
        return area;
    }

    setupDragControl() {
        const container = document.getElementById('scene-canvas-container');
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        const getControls = () => window.sceneManager?.controls;
        
        const onMouseDown = (event) => {
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.dragPoints);
            
            if (intersects.length > 0) {
                this.dragTarget = intersects[0].object;
                this.isDragging = true;
                container.style.cursor = 'grabbing';
                
                const controls = getControls();
                if (controls) controls.enabled = false;
                
                event.stopPropagation();
                event.preventDefault();
            }
        };
        
        const onMouseMove = (event) => {
            if (!this.isDragging || !this.dragTarget) return;
            
            event.stopPropagation();
            event.preventDefault();
            
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            
            // 射线与Y平面的交点
            raycaster.setFromCamera(mouse, this.camera);
            
            const type = this.dragTarget.userData.controlType;
            const s = this.cubeSize / 2;
            
            if (type === 'height') {
                // 高度控制
                const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                const intersect = new THREE.Vector3();
                raycaster.ray.intersectPlane(plane, intersect);
                
                if (intersect) {
                    this.planeHeight = Math.max(0.1, Math.min(0.9, (intersect.y + s) / this.cubeSize));
                    this.dragTarget.position.y = (this.planeHeight - 0.5) * this.cubeSize;
                }
            } else if (type === 'tiltX') {
                // X倾斜控制
                const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
                const intersect = new THREE.Vector3();
                raycaster.ray.intersectPlane(plane, intersect);
                
                if (intersect) {
                    this.planeAngleX = Math.max(-0.8, Math.min(0.8, intersect.y / s));
                    this.dragTarget.position.y = (this.planeHeight - 0.5) * this.cubeSize + this.planeAngleX * s;
                }
            } else if (type === 'tiltZ') {
                // Z倾斜控制
                const plane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
                const intersect = new THREE.Vector3();
                raycaster.ray.intersectPlane(plane, intersect);
                
                if (intersect) {
                    this.planeAngleY = Math.max(-0.8, Math.min(0.8, intersect.y / s));
                    this.dragTarget.position.y = (this.planeHeight - 0.5) * this.cubeSize + this.planeAngleY * s;
                }
            }
            
            // 更新截面
            this.updateCutSection();
            this.updateControlPoints();
        };
        
        const onMouseUp = () => {
            if (this.isDragging) {
                const controls = getControls();
                if (controls) controls.enabled = true;
            }
            this.isDragging = false;
            this.dragTarget = null;
            container.style.cursor = 'default';
        };
        
        container.addEventListener('mousedown', onMouseDown, true);
        container.addEventListener('mousemove', onMouseMove, true);
        container.addEventListener('mouseup', onMouseUp, true);
        container.addEventListener('mouseleave', onMouseUp, true);
        
        this.dragHandlers = { onMouseDown, onMouseMove, onMouseUp };
    }

    updateControlPoints() {
        const s = this.cubeSize / 2;
        const controlY = (this.planeHeight - 0.5) * this.cubeSize;
        
        this.dragPoints.forEach(point => {
            const type = point.userData.controlType;
            if (type === 'height') {
                point.position.set(0, controlY, 0);
            } else if (type === 'tiltX') {
                point.position.set(s + 1, controlY + this.planeAngleX * s, 0);
            } else if (type === 'tiltZ') {
                point.position.set(0, controlY + this.planeAngleY * s, s + 1);
            }
        });
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-auto-demo">
                <i class="fas fa-play"></i> 自动演示
            </button>
            <button class="control-btn" id="btn-step-guide">
                <i class="fas fa-book"></i> 解题步骤
            </button>
            <button class="control-btn" id="btn-special-section">
                <i class="fas fa-star"></i> 特殊截面
            </button>
            <button class="control-btn" id="btn-find-max">
                <i class="fas fa-expand"></i> 最大六边形
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        document.getElementById('btn-auto-demo').onclick = () => this.toggleAutoPlay();
        document.getElementById('btn-step-guide').onclick = () => this.showStepGuide();
        document.getElementById('btn-special-section').onclick = () => this.showSpecialSections();
        document.getElementById('btn-find-max').onclick = () => this.findMaxHexagon();
        document.getElementById('btn-reset').onclick = () => this.reset();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        
        const btn = document.getElementById('btn-auto-demo');
        btn.innerHTML = this.isAutoPlaying 
            ? '<i class="fas fa-pause"></i> 暂停' 
            : '<i class="fas fa-play"></i> 自动演示';
        
        if (this.isAutoPlaying) {
            this.showGuide('🔄 观察截面随高度变化的形状');
        }
    }

    showStepGuide() {
        const container = document.getElementById('scene-canvas-container');
        
        // 切换面板
        const oldPanel = container.querySelector('.solid-geo-blackboard');
        if (oldPanel) {
            oldPanel.remove();
            return;
        }
        
        this.addBlackboardStyles();
        
        const panel = document.createElement('div');
        panel.className = 'solid-geo-blackboard geometry-blackboard';
        panel.innerHTML = this.getBlackboardContent();
        container.appendChild(panel);
        
        setTimeout(() => panel.classList.add('visible'), 50);
        this.bindBlackboardEvents(panel);
    }

    getBlackboardContent() {
        const step = this.solutionSteps[this.currentStep];
        const detailedContent = this.getDetailedStepContent(this.currentStep);
        
        return `
            <div class="blackboard-header">
                <div class="blackboard-title">
                    <i class="fas fa-chalkboard-teacher"></i>
                    正方体截面问题
                </div>
                <button class="blackboard-close" id="bb-close">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="blackboard-content">
                <!-- 问题描述 -->
                <div class="blackboard-section problem-section">
                    <div class="section-title">
                        <i class="fas fa-question-circle"></i> 问题
                    </div>
                    <div class="problem-box">
                        <p class="problem-text">
                            用一个平面去截棱长为a的正方体ABCD-A'B'C'D'
                        </p>
                        <p class="problem-question">
                            <strong>探索：</strong>
                            <br>1. 截面可能是什么形状？
                            <br>2. 截面最多有几条边？
                            <br>3. 什么情况下截面面积最大？
                        </p>
                    </div>
                </div>
                
                <!-- 知识点 -->
                <div class="blackboard-section knowledge-section">
                    <div class="section-title">
                        <i class="fas fa-lightbulb"></i> 核心知识点
                    </div>
                    <div class="knowledge-tags">
                        <span class="tag tag-primary">空间想象</span>
                        <span class="tag tag-primary">截面构造</span>
                        <span class="tag tag-secondary">平面与棱交点</span>
                        <span class="tag tag-accent">正六边形截面</span>
                    </div>
                </div>
                
                <!-- 关键结论 -->
                <div class="blackboard-section thought-section">
                    <div class="section-title">
                        <i class="fas fa-brain"></i> 关键结论
                    </div>
                    <div class="thought-content">
                        <div class="thought-item">
                            <span class="thought-icon">📐</span>
                            <div class="thought-text">
                                <strong>截面形状：</strong>
                                可以是三角形、四边形、五边形或六边形
                            </div>
                        </div>
                        <div class="thought-item">
                            <span class="thought-icon">⬡</span>
                            <div class="thought-text">
                                <strong>最多六边：</strong>
                                因为正方体只有6个面，平面最多与6个面相交
                            </div>
                        </div>
                        <div class="thought-item">
                            <span class="thought-icon">✨</span>
                            <div class="thought-text">
                                <strong>最大截面：</strong>
                                过体对角线中点且⊥体对角线的截面是正六边形
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- 步骤详情 -->
                <div class="blackboard-section steps-section">
                    <div class="section-title">
                        <i class="fas fa-shoe-prints"></i> 操作步骤
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
                    <i class="fas fa-play"></i> 演示
                </button>
                <button class="bb-btn bb-btn-secondary" id="bb-next" ${this.currentStep >= this.maxStep ? 'disabled' : ''}>
                    下一步 <i class="fas fa-arrow-right"></i>
                </button>
            </div>
        `;
    }

    getDetailedStepContent(stepIndex) {
        const contents = [
            // Step 0: 理解题意
            `<div class="detail-block">
                <p><strong>🎯 目标：</strong>熟悉正方体结构</p>
                <ul class="detail-list">
                    <li>正方体有<span class="hl-blue">8个顶点</span>：A,B,C,D,A',B',C',D'</li>
                    <li>有<span class="hl-green">12条棱</span>，每条棱长为a</li>
                    <li>有<span class="hl-red">6个面</span>，每个面是正方形</li>
                </ul>
                <div class="detail-tip">
                    💡 旋转正方体，从不同角度观察它的结构
                </div>
            </div>`,
            
            // Step 1: 引入截面
            `<div class="detail-block">
                <p><strong>✂️ 什么是截面？</strong></p>
                <ul class="detail-list">
                    <li>用一个平面去"切"立体图形</li>
                    <li>平面与立体图形表面相交形成的图形</li>
                    <li>截面一定是<span class="hl-green">封闭的多边形</span></li>
                </ul>
                <div class="detail-tip">
                    💡 拖动绿色控制点，观察截面的变化
                </div>
            </div>`,
            
            // Step 2: 探索截面形状
            `<div class="detail-block">
                <p><strong>🔍 截面可以是什么形状？</strong></p>
                <div class="discovery-box">
                    <p>正方体的截面可能是：</p>
                    <ul class="detail-list">
                        <li>三角形 △ - 平面过一个顶点</li>
                        <li>四边形 ◇ - 包括正方形、矩形、菱形等</li>
                        <li>五边形 ⬠ - 较少见</li>
                        <li>六边形 ⬡ - 最多六条边！</li>
                    </ul>
                </div>
                <div class="detail-tip">
                    💡 试试能不能切出七边形？（不可能！）
                </div>
            </div>`,
            
            // Step 3: 构造方法
            `<div class="detail-block">
                <p><strong>📐 如何确定截面？</strong></p>
                <div class="auxiliary-reason">
                    <p><strong>三点定面法：</strong></p>
                    <p>不共线的三点确定一个平面</p>
                </div>
                <ul class="detail-list">
                    <li>选择3个不共线的点</li>
                    <li>连接在同一面上的两点</li>
                    <li>利用平行关系找其他交点</li>
                </ul>
            </div>`,
            
            // Step 4: 计算面积
            `<div class="detail-block">
                <p><strong>📏 截面面积计算：</strong></p>
                <div class="detail-formula">
                    S = 各小三角形面积之和
                </div>
                <ul class="detail-list">
                    <li>分解为多个三角形</li>
                    <li>用向量叉积计算各三角形面积</li>
                    <li>求和得到截面总面积</li>
                </ul>
            </div>`,
            
            // Step 5: 最大截面
            `<div class="detail-block">
                <p><strong>✅ 最大截面是什么？</strong></p>
                <div class="conclusion-box">
                    <p class="conclusion-key">正六边形截面面积最大！</p>
                    <div class="detail-formula">
                        S<sub>max</sub> = (3√2/2) × a²
                    </div>
                </div>
                <ul class="detail-list">
                    <li>过体对角线AG的中点</li>
                    <li>截面⊥体对角线</li>
                    <li>截面为正六边形</li>
                </ul>
                <div class="detail-tip success">
                    🎉 点击"最大六边形"按钮查看！
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
            .thought-content {
                padding: 0;
            }
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
        panel.querySelector('#bb-close').onclick = () => {
            panel.classList.remove('visible');
            setTimeout(() => panel.remove(), 300);
        };
        
        panel.querySelector('#bb-prev').onclick = () => {
            if (this.currentStep > 0) {
                this.currentStep--;
                panel.remove();
                this.showStepGuide();
            }
        };
        
        panel.querySelector('#bb-next').onclick = () => {
            if (this.currentStep < this.maxStep) {
                this.currentStep++;
                panel.remove();
                this.showStepGuide();
            }
        };
        
        panel.querySelector('#bb-action').onclick = () => {
            this.executeStepAction(this.solutionSteps[this.currentStep].action);
        };
    }

    executeStepAction(action) {
        switch (action) {
            case 'observeCube':
                this.resetView();
                this.showGuide('📖 旋转视角，观察正方体的顶点、棱和面');
                break;
            case 'introducePlane':
                this.reset();
                this.showGuide('✂️ 红色区域就是截面，拖动控制点调整');
                break;
            case 'exploreSections':
                this.toggleAutoPlay();
                break;
            case 'constructMethod':
                this.showGuide('📐 截面由平面与各棱的交点连接而成');
                break;
            case 'calculateArea':
                this.showGuide('📏 截面面积 = ' + this.calculateSectionArea().toFixed(2));
                break;
            case 'findMaxSection':
                this.findMaxHexagon();
                break;
        }
    }

    showSpecialSections() {
        // 展示特殊截面
        const container = document.getElementById('scene-canvas-container');
        
        // 创建特殊截面选择面板
        const oldPanel = container.querySelector('.special-section-panel');
        if (oldPanel) {
            oldPanel.remove();
            return;
        }
        
        const panel = document.createElement('div');
        panel.className = 'special-section-panel';
        panel.innerHTML = `
            <button class="ssp-close" id="ssp-close" title="关闭" style="
                position: absolute;
                top: 8px;
                right: 8px;
                width: 24px;
                height: 24px;
                border: none;
                background: rgba(0,0,0,0.08);
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #666;
                font-size: 12px;
            ">
                <i class="fas fa-times"></i>
            </button>
            <div class="ssp-title">📐 特殊截面</div>
            <button class="ssp-btn" data-type="horizontal">
                <span>水平截面</span>
                <small>正方形</small>
            </button>
            <button class="ssp-btn" data-type="diagonal">
                <span>对角截面</span>
                <small>矩形</small>
            </button>
            <button class="ssp-btn" data-type="corner">
                <span>顶点截面</span>
                <small>三角形</small>
            </button>
            <button class="ssp-btn" data-type="hexagon">
                <span>正六边形</span>
                <small>最大面积</small>
            </button>
        `;
        panel.style.cssText = `
            position: absolute;
            left: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255,255,255,0.95);
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 16px;
            z-index: 100;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        `;
        
        // 添加样式
        this.addSpecialSectionStyles();
        
        container.appendChild(panel);
        
        // 绑定关闭按钮事件
        panel.querySelector('#ssp-close').onclick = () => {
            panel.remove();
        };
        
        // 绑定事件
        panel.querySelectorAll('.ssp-btn').forEach(btn => {
            btn.onclick = () => {
                const type = btn.dataset.type;
                this.setSpecialSection(type);
            };
        });
    }

    addSpecialSectionStyles() {
        if (document.getElementById('special-section-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'special-section-styles';
        style.textContent = `
            .ssp-title {
                font-size: 14px;
                font-weight: 600;
                color: #1f2937;
                margin-bottom: 12px;
                padding-bottom: 8px;
                border-bottom: 1px solid #e5e7eb;
            }
            .ssp-btn {
                display: flex;
                flex-direction: column;
                width: 100%;
                padding: 12px;
                margin-bottom: 8px;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                background: white;
                cursor: pointer;
                transition: all 0.2s;
                text-align: left;
            }
            .ssp-btn:hover {
                border-color: #3b82f6;
                background: #eff6ff;
            }
            .ssp-btn span {
                font-size: 14px;
                font-weight: 500;
                color: #1f2937;
            }
            .ssp-btn small {
                font-size: 12px;
                color: #6b7280;
                margin-top: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    setSpecialSection(type) {
        switch (type) {
            case 'horizontal':
                // 水平截面（正方形）
                this.planeHeight = 0.5;
                this.planeAngleX = 0;
                this.planeAngleY = 0;
                this.showGuide('📐 水平截面是正方形');
                break;
            case 'diagonal':
                // 对角截面（矩形）
                this.planeHeight = 0.5;
                this.planeAngleX = 0.6;
                this.planeAngleY = 0;
                this.showGuide('📐 对角截面是矩形');
                break;
            case 'corner':
                // 顶点附近截面（三角形）
                this.planeHeight = 0.15;
                this.planeAngleX = 0.5;
                this.planeAngleY = 0.5;
                this.showGuide('📐 靠近顶点的截面是三角形');
                break;
            case 'hexagon':
                this.findMaxHexagon();
                return;
        }
        
        this.updateCutSection();
        this.updateControlPoints();
    }

    findMaxHexagon() {
        // 动画移动到正六边形截面位置
        this.showGuide('🔍 正在找最大的正六边形截面...');
        
        const timeline = gsap.timeline();
        
        // 过渡到正六边形位置
        timeline.to(this, {
            planeHeight: 0.5,
            duration: 0.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.updateCutSection();
                this.updateControlPoints();
            }
        });
        
        timeline.to(this, {
            planeAngleX: 0.333,
            planeAngleY: 0.333,
            duration: 1,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.updateCutSection();
                this.updateControlPoints();
            },
            onComplete: () => {
                this.showGuide('✅ 这就是正六边形截面！面积最大');
                
                // 高亮效果
                if (this.cutSection) {
                    gsap.to(this.cutSection.material, {
                        opacity: 0.8,
                        duration: 0.3,
                        yoyo: true,
                        repeat: 3
                    });
                }
            }
        });
    }

    reset() {
        this.isAutoPlaying = false;
        this.currentStep = 0;
        this.planeHeight = 0.5;
        this.planeAngleX = 0;
        this.planeAngleY = 0;
        
        this.updateCutSection();
        this.updateControlPoints();
        
        const btn = document.getElementById('btn-auto-demo');
        if (btn) btn.innerHTML = '<i class="fas fa-play"></i> 自动演示';
        
        this.showGuide('🔄 已重置');
    }

    resetView() {
        gsap.to(this.camera.position, {
            x: this.defaultCameraPos.x,
            y: this.defaultCameraPos.y,
            z: this.defaultCameraPos.z,
            duration: 0.8,
            ease: 'power2.out',
            onComplete: () => {
                this.camera.lookAt(0, 0, 0);
            }
        });
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

    highlightObject(target) {
        if (this.highlighted?.material?.emissive) {
            this.highlighted.material.emissive.setHex(
                this.highlighted.userData.originalEmissive || 0
            );
        }
        
        if (target.material?.emissive) {
            target.userData.originalEmissive = target.material.emissive.getHex();
            target.material.emissive.setHex(this.colors.highlight);
        }
        this.highlighted = target;
        
        gsap.to(target.scale, {
            x: 1.3, y: 1.3, z: 1.3,
            duration: 0.15,
            yoyo: true,
            repeat: 1
        });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        if (!panel) return;
        
        document.getElementById('info-title').innerHTML = 
            `<i class="fas fa-cube mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = 
            target.userData.description || '';
        panel.classList.add('visible');
    }

    animate(time, delta) {
        // 自动演示：截面上下移动
        if (this.isAutoPlaying && !this.isDragging) {
            this.planeHeight = 0.5 + Math.sin(time * 0.5) * 0.35;
            this.planeAngleX = Math.sin(time * 0.3) * 0.3;
            this.planeAngleY = Math.cos(time * 0.4) * 0.3;
            
            this.updateCutSection();
            this.updateControlPoints();
        }
        
        // 控制点发光呼吸效果
        this.dragPoints.forEach(point => {
            if (!this.isDragging) {
                const scale = 1 + Math.sin(time * 3) * 0.1;
                point.scale.set(scale, scale, scale);
            }
        });
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        // 清理HTML元素
        const container = document.getElementById('scene-canvas-container');
        const panels = container.querySelectorAll('.solid-geo-panel, .solid-geo-blackboard, .special-section-panel');
        panels.forEach(p => p.remove());
        
        // 清理事件
        if (this.dragHandlers) {
            container.removeEventListener('mousedown', this.dragHandlers.onMouseDown, true);
            container.removeEventListener('mousemove', this.dragHandlers.onMouseMove, true);
            container.removeEventListener('mouseup', this.dragHandlers.onMouseUp, true);
            container.removeEventListener('mouseleave', this.dragHandlers.onMouseUp, true);
        }
        
        if (this.mainGroup) this.scene.remove(this.mainGroup);
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
        
        // 关闭特殊截面面板
        const ssp = document.querySelector('.special-section-panel');
        if (ssp) ssp.remove();
        
        if (this.highlighted?.material?.emissive) {
            this.highlighted.material.emissive.setHex(
                this.highlighted.userData.originalEmissive || 0
            );
            this.highlighted = null;
        }
    }
};
