/**
 * 神经网络梯度下降 3D教学场景
 * ============================================
 * 可视化AI如何通过"下山"找到最优解
 * 
 * 教学内容：
 * 1. 损失函数曲面概念
 * 2. 梯度的几何意义
 * 3. 学习率的影响
 * 4. 局部最小值vs全局最小值
 * 5. 梯度下降优化过程
 * 
 * 目标学生：高中-大学
 * ============================================
 */

class GradientDescentScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'GradientDescentScene';
        this.mainGroup = null;
        
        // 场景元素
        this.surface = null;           // 损失函数曲面
        this.ball = null;              // 优化小球
        this.gradientArrow = null;     // 梯度箭头
        this.pathLine = null;          // 优化路径
        this.pathPoints = [];          // 路径点记录
        
        // 优化状态
        this.isOptimizing = false;
        this.isAutoPlay = false;
        this.animationTime = 0;
        
        // 当前位置（参数空间）
        this.currentX = 3;
        this.currentY = 3;
        this.learningRate = 0.15;
        this.momentum = 0;
        this.velocityX = 0;
        this.velocityY = 0;
        
        // 损失函数类型
        this.functionType = 'bowl'; // 'bowl', 'saddle', 'multiminima'
        
        // 颜色配置
        this.colors = {
            ball: 0xff5722,
            gradient: 0x00ff00,
            path: 0xffeb3b,
            minimum: 0x4caf50,
            surface: {
                low: 0x1a237e,
                high: 0xf44336
            }
        };
        
        // 统计
        this.iteration = 0;
        this.lossHistory = [];
    }

    init() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建背景
        this.createBackground();
        
        // 创建损失函数曲面
        this.createSurface();
        
        // 创建坐标轴
        this.createAxes();
        
        // 创建优化小球
        this.createBall();
        
        // 创建梯度箭头
        this.createGradientArrow();
        
        // 创建路径线
        this.createPathLine();
        
        // 创建最小值标记
        this.createMinimumMarker();
        
        // 创建信息面板
        this.createInfoPanel();
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(8, 10, 12);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 设置灯光
        this.setupLighting();
        
        // 创建UI
        this.setupUI();
        
        // 初始化小球位置
        this.resetOptimization();
        
        console.log('GradientDescentScene initialized');
    }

    /**
     * 创建背景
     */
    createBackground() {
        // 网格地面
        const gridHelper = new THREE.GridHelper(20, 20, 0x333355, 0x222244);
        gridHelper.position.y = -0.1;
        this.mainGroup.add(gridHelper);
        
        // 环境粒子
        const count = 200;
        const positions = new Float32Array(count * 3);
        
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 30;
            positions[i * 3 + 1] = Math.random() * 15;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.05,
            color: 0x6666aa,
            transparent: true,
            opacity: 0.5
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.mainGroup.add(this.particles);
    }

    /**
     * 损失函数定义
     */
    lossFunction(x, y) {
        switch (this.functionType) {
            case 'bowl':
                // 简单凸函数 - 碗形
                return 0.5 * (x * x + y * y);
                
            case 'saddle':
                // 鞍点函数
                return x * x - y * y + 0.5;
                
            case 'multiminima':
                // 多极值函数（有局部最小值）
                return (x * x + y * y) / 4 
                    + Math.sin(x * 2) * 0.5 
                    + Math.sin(y * 2) * 0.5 
                    + 2;
                
            case 'rosenbrock':
                // Rosenbrock函数（香蕉形）
                const a = 1, b = 5;
                return Math.pow(a - x, 2) + b * Math.pow(y - x * x, 2);
                
            default:
                return 0.5 * (x * x + y * y);
        }
    }

    /**
     * 计算梯度
     */
    computeGradient(x, y) {
        const h = 0.001;
        const dLdx = (this.lossFunction(x + h, y) - this.lossFunction(x - h, y)) / (2 * h);
        const dLdy = (this.lossFunction(x, y + h) - this.lossFunction(x, y - h)) / (2 * h);
        return { dx: dLdx, dy: dLdy };
    }

    /**
     * 创建损失函数曲面
     */
    createSurface() {
        this.updateSurface();
    }

    /**
     * 更新曲面
     */
    updateSurface() {
        // 移除旧曲面
        if (this.surface) {
            this.mainGroup.remove(this.surface);
            this.surface.geometry.dispose();
            this.surface.material.dispose();
        }
        
        const size = 8;
        const segments = 80;
        const geometry = new THREE.PlaneGeometry(size * 2, size * 2, segments, segments);
        
        const positions = geometry.attributes.position.array;
        const colors = new Float32Array(positions.length);
        
        let minZ = Infinity, maxZ = -Infinity;
        
        // 计算高度值
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = this.lossFunction(x, y);
            positions[i + 2] = z;
            
            minZ = Math.min(minZ, z);
            maxZ = Math.max(maxZ, z);
        }
        
        // 设置颜色（根据高度）
        for (let i = 0; i < positions.length; i += 3) {
            const z = positions[i + 2];
            const t = (z - minZ) / (maxZ - minZ + 0.001);
            
            // 从蓝色（低）到红色（高）
            const color = new THREE.Color();
            color.setHSL(0.7 - t * 0.5, 0.8, 0.3 + t * 0.4);
            
            colors[i] = color.r;
            colors[i + 1] = color.g;
            colors[i + 2] = color.b;
        }
        
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        
        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.85,
            shininess: 50
        });
        
        this.surface = new THREE.Mesh(geometry, material);
        this.surface.rotation.x = -Math.PI / 2;
        this.surface.userData = {
            name: '损失函数曲面',
            info: `<b>损失函数曲面 L(θ)</b><br><br>
                曲面上的每一点代表参数的一种组合，<br>
                高度表示该参数下的损失值（误差）。<br><br>
                <b>目标</b>：找到曲面的最低点！<br>
                <span style="color:#4caf50">🎯 最低点 = 最优参数</span>`,
            isInteractive: true
        };
        
        this.mainGroup.add(this.surface);
        
        // 添加等高线效果
        this.createContourLines(minZ, maxZ);
    }

    /**
     * 创建等高线
     */
    createContourLines(minZ, maxZ) {
        // 移除旧等高线
        if (this.contourLines) {
            this.contourLines.forEach(l => {
                this.mainGroup.remove(l);
                l.geometry.dispose();
                l.material.dispose();
            });
        }
        this.contourLines = [];
        
        const levels = 8;
        for (let i = 0; i < levels; i++) {
            const z = minZ + (maxZ - minZ) * i / levels;
            const points = [];
            
            // 采样等高线点
            for (let angle = 0; angle <= Math.PI * 2; angle += 0.1) {
                for (let r = 0.1; r < 8; r += 0.1) {
                    const x = r * Math.cos(angle);
                    const y = r * Math.sin(angle);
                    const loss = this.lossFunction(x, y);
                    
                    if (Math.abs(loss - z) < 0.1) {
                        points.push(new THREE.Vector3(x, z + 0.02, y));
                        break;
                    }
                }
            }
            
            if (points.length > 3) {
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0xffffff,
                    transparent: true,
                    opacity: 0.2
                });
                const line = new THREE.Line(geometry, material);
                this.contourLines.push(line);
                this.mainGroup.add(line);
            }
        }
    }

    /**
     * 创建坐标轴
     */
    createAxes() {
        const axisLength = 5;
        
        // X轴 - θ₁
        const xMaterial = new THREE.LineBasicMaterial({ color: 0xff4444 });
        const xGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-axisLength, 0, 0),
            new THREE.Vector3(axisLength, 0, 0)
        ]);
        const xAxis = new THREE.Line(xGeometry, xMaterial);
        this.mainGroup.add(xAxis);
        
        // Y轴 - θ₂
        const yMaterial = new THREE.LineBasicMaterial({ color: 0x4444ff });
        const yGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, -axisLength),
            new THREE.Vector3(0, 0, axisLength)
        ]);
        const yAxis = new THREE.Line(yGeometry, yMaterial);
        this.mainGroup.add(yAxis);
        
        // Z轴 - Loss
        const zMaterial = new THREE.LineBasicMaterial({ color: 0x44ff44 });
        const zGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 8, 0)
        ]);
        const zAxis = new THREE.Line(zGeometry, zMaterial);
        this.mainGroup.add(zAxis);
        
        // 轴标签
        this.createAxisLabel('θ₁', new THREE.Vector3(5.5, 0, 0), 0xff4444);
        this.createAxisLabel('θ₂', new THREE.Vector3(0, 0, 5.5), 0x4444ff);
        this.createAxisLabel('Loss', new THREE.Vector3(0, 8.5, 0), 0x44ff44);
    }

    /**
     * 创建轴标签
     */
    createAxisLabel(text, position, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        
        context.font = 'bold 32px Arial';
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.textAlign = 'center';
        context.fillText(text, 64, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(1.5, 0.75, 1);
        
        this.mainGroup.add(sprite);
    }

    /**
     * 创建优化小球
     */
    createBall() {
        const geometry = new THREE.SphereGeometry(0.25, 32, 32);
        const material = new THREE.MeshPhongMaterial({
            color: this.colors.ball,
            emissive: this.colors.ball,
            emissiveIntensity: 0.4,
            shininess: 100
        });
        
        this.ball = new THREE.Mesh(geometry, material);
        
        // 光晕效果
        const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.ball,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.ball.add(glow);
        
        this.ball.userData = {
            name: '参数状态',
            info: `<b>当前参数位置</b><br><br>
                这个小球代表神经网络的当前参数状态。<br><br>
                <b>目标</b>：通过梯度下降，让小球"滚"到最低点！`,
            isInteractive: true
        };
        
        this.mainGroup.add(this.ball);
    }

    /**
     * 创建梯度箭头
     */
    createGradientArrow() {
        this.gradientArrow = new THREE.ArrowHelper(
            new THREE.Vector3(0, -1, 0),
            new THREE.Vector3(0, 0, 0),
            1,
            this.colors.gradient,
            0.2,
            0.1
        );
        this.gradientArrow.userData = {
            name: '梯度方向',
            info: `<b>梯度 ∇L</b><br><br>
                箭头指向损失函数上升最快的方向。<br><br>
                <b>梯度下降</b>就是沿着<span style="color:#ff5722">相反方向</span>移动！<br>
                θ_new = θ_old - α × ∇L`,
            isInteractive: true
        };
        this.mainGroup.add(this.gradientArrow);
    }

    /**
     * 创建优化路径
     */
    createPathLine() {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3000), 3));
        
        const material = new THREE.LineBasicMaterial({
            color: this.colors.path,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        this.pathLine = new THREE.Line(geometry, material);
        this.mainGroup.add(this.pathLine);
    }

    /**
     * 创建最小值标记
     */
    createMinimumMarker() {
        const geometry = new THREE.RingGeometry(0.3, 0.5, 32);
        const material = new THREE.MeshBasicMaterial({
            color: this.colors.minimum,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        
        this.minimumMarker = new THREE.Mesh(geometry, material);
        this.minimumMarker.rotation.x = -Math.PI / 2;
        this.minimumMarker.position.set(0, 0.05, 0);
        
        // 脉动动画组件
        this.minimumMarker.userData.pulse = 0;
        
        this.mainGroup.add(this.minimumMarker);
        
        // 目标标签
        const label = this.createTextSprite('🎯 最优解', 0x4caf50);
        label.position.set(0, 0.8, 0);
        label.scale.set(2, 0.5, 1);
        this.mainGroup.add(label);
    }

    /**
     * 创建文字精灵
     */
    createTextSprite(text, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.font = 'bold 28px Arial';
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.textAlign = 'center';
        context.fillText(text, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        return new THREE.Sprite(material);
    }

    /**
     * 创建信息面板
     */
    createInfoPanel() {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        const panel = document.createElement('div');
        panel.id = 'gradient-info-panel';
        panel.className = 'gradient-info-panel';
        panel.innerHTML = `
            <div class="info-row">
                <span class="info-label">迭代次数</span>
                <span class="info-value" id="gd-iteration">0</span>
            </div>
            <div class="info-row">
                <span class="info-label">当前损失</span>
                <span class="info-value" id="gd-loss">-</span>
            </div>
            <div class="info-row">
                <span class="info-label">位置 (θ₁, θ₂)</span>
                <span class="info-value" id="gd-position">-</span>
            </div>
            <div class="info-row">
                <span class="info-label">梯度大小</span>
                <span class="info-value" id="gd-gradient">-</span>
            </div>
            <div class="loss-chart" id="loss-chart">
                <div class="chart-title">损失曲线</div>
                <canvas id="loss-canvas" width="200" height="80"></canvas>
            </div>
        `;
        container.appendChild(panel);
    }

    /**
     * 更新信息面板
     */
    updateInfoPanel() {
        const loss = this.lossFunction(this.currentX, this.currentY);
        const grad = this.computeGradient(this.currentX, this.currentY);
        const gradMag = Math.sqrt(grad.dx * grad.dx + grad.dy * grad.dy);
        
        document.getElementById('gd-iteration').textContent = this.iteration;
        document.getElementById('gd-loss').textContent = loss.toFixed(4);
        document.getElementById('gd-position').textContent = 
            `(${this.currentX.toFixed(2)}, ${this.currentY.toFixed(2)})`;
        document.getElementById('gd-gradient').textContent = gradMag.toFixed(4);
        
        // 更新损失曲线
        this.updateLossChart();
    }

    /**
     * 更新损失曲线图
     */
    updateLossChart() {
        const canvas = document.getElementById('loss-canvas');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.clearRect(0, 0, width, height);
        
        if (this.lossHistory.length < 2) return;
        
        const maxLoss = Math.max(...this.lossHistory);
        const minLoss = Math.min(...this.lossHistory);
        const range = maxLoss - minLoss + 0.001;
        
        ctx.strokeStyle = '#ff5722';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        this.lossHistory.forEach((loss, i) => {
            const x = (i / (this.lossHistory.length - 1)) * width;
            const y = height - ((loss - minLoss) / range) * (height - 10) - 5;
            
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        
        ctx.stroke();
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 5);
        this.scene.add(mainLight);
        
        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.3);
        fillLight.position.set(-5, 5, -5);
        this.scene.add(fillLight);
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="gradient-controls">
                <div class="control-group">
                    <label>损失函数</label>
                    <select id="function-select" class="gd-select">
                        <option value="bowl">碗形（凸函数）</option>
                        <option value="multiminima">多极值函数</option>
                        <option value="rosenbrock">Rosenbrock函数</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>学习率 α</label>
                    <div class="lr-control">
                        <input type="range" id="lr-slider" min="0.01" max="0.5" step="0.01" value="0.15">
                        <span id="lr-value">0.15</span>
                    </div>
                </div>
                <div class="control-group buttons">
                    <button class="action-btn" id="btn-step">
                        <i class="fas fa-shoe-prints"></i> 单步
                    </button>
                    <button class="action-btn" id="btn-auto">
                        <i class="fas fa-play"></i> 自动下降
                    </button>
                    <button class="action-btn" id="btn-reset-gd">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.getElementById('function-select')?.addEventListener('change', (e) => {
            this.functionType = e.target.value;
            this.updateSurface();
            this.resetOptimization();
        });
        
        document.getElementById('lr-slider')?.addEventListener('input', (e) => {
            this.learningRate = parseFloat(e.target.value);
            document.getElementById('lr-value').textContent = this.learningRate.toFixed(2);
        });
        
        document.getElementById('btn-step')?.addEventListener('click', () => {
            this.optimizationStep();
        });
        
        document.getElementById('btn-auto')?.addEventListener('click', (e) => {
            this.isAutoPlay = !this.isAutoPlay;
            e.target.innerHTML = this.isAutoPlay 
                ? '<i class="fas fa-pause"></i> 暂停'
                : '<i class="fas fa-play"></i> 自动下降';
        });
        
        document.getElementById('btn-reset-gd')?.addEventListener('click', () => {
            this.resetOptimization();
        });
    }

    /**
     * 单步优化
     */
    optimizationStep() {
        const grad = this.computeGradient(this.currentX, this.currentY);
        
        // 带动量的梯度下降
        this.velocityX = this.momentum * this.velocityX - this.learningRate * grad.dx;
        this.velocityY = this.momentum * this.velocityY - this.learningRate * grad.dy;
        
        this.currentX += this.velocityX;
        this.currentY += this.velocityY;
        
        // 边界限制
        this.currentX = Math.max(-7, Math.min(7, this.currentX));
        this.currentY = Math.max(-7, Math.min(7, this.currentY));
        
        this.iteration++;
        
        // 记录损失
        const loss = this.lossFunction(this.currentX, this.currentY);
        this.lossHistory.push(loss);
        if (this.lossHistory.length > 100) this.lossHistory.shift();
        
        // 更新可视化
        this.updateVisualization();
        
        // 记录路径
        this.addPathPoint();
        
        // 检查收敛
        if (Math.sqrt(grad.dx * grad.dx + grad.dy * grad.dy) < 0.001) {
            this.isAutoPlay = false;
            this.showGuide('🎉 收敛！找到最优解！');
            const autoBtn = document.getElementById('btn-auto');
            if (autoBtn) autoBtn.innerHTML = '<i class="fas fa-play"></i> 自动下降';
        }
    }

    /**
     * 更新可视化
     */
    updateVisualization() {
        const loss = this.lossFunction(this.currentX, this.currentY);
        const grad = this.computeGradient(this.currentX, this.currentY);
        
        // 更新小球位置
        this.ball.position.set(this.currentX, loss + 0.25, this.currentY);
        
        // 更新梯度箭头
        const gradLength = Math.sqrt(grad.dx * grad.dx + grad.dy * grad.dy);
        const gradDir = new THREE.Vector3(-grad.dx, 0, -grad.dy).normalize();
        
        this.gradientArrow.position.set(this.currentX, loss + 0.3, this.currentY);
        this.gradientArrow.setDirection(gradDir);
        this.gradientArrow.setLength(Math.min(gradLength * 2, 2), 0.3, 0.15);
        
        // 更新信息面板
        this.updateInfoPanel();
    }

    /**
     * 添加路径点
     */
    addPathPoint() {
        const loss = this.lossFunction(this.currentX, this.currentY);
        this.pathPoints.push(new THREE.Vector3(this.currentX, loss + 0.1, this.currentY));
        
        // 限制路径长度
        if (this.pathPoints.length > 1000) {
            this.pathPoints.shift();
        }
        
        // 更新路径线
        const positions = this.pathLine.geometry.attributes.position.array;
        for (let i = 0; i < this.pathPoints.length && i < 1000; i++) {
            positions[i * 3] = this.pathPoints[i].x;
            positions[i * 3 + 1] = this.pathPoints[i].y;
            positions[i * 3 + 2] = this.pathPoints[i].z;
        }
        this.pathLine.geometry.setDrawRange(0, this.pathPoints.length);
        this.pathLine.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * 重置优化
     */
    resetOptimization() {
        // 随机起始位置
        this.currentX = 3 + (Math.random() - 0.5) * 2;
        this.currentY = 3 + (Math.random() - 0.5) * 2;
        this.velocityX = 0;
        this.velocityY = 0;
        this.iteration = 0;
        this.lossHistory = [];
        this.pathPoints = [];
        this.isAutoPlay = false;
        
        // 清空路径
        this.pathLine.geometry.setDrawRange(0, 0);
        
        // 更新按钮状态
        const autoBtn = document.getElementById('btn-auto');
        if (autoBtn) autoBtn.innerHTML = '<i class="fas fa-play"></i> 自动下降';
        
        this.updateVisualization();
        this.showGuide('🎯 已重置！小球在随机位置，准备开始下降...');
    }

    /**
     * 显示引导消息
     */
    showGuide(message) {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        container.appendChild(guide);
        
        setTimeout(() => guide.classList.add('visible'), 100);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 300);
        }, 3000);
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        setTimeout(() => {
            this.showGuide('📉 梯度下降：AI如何通过"下山"找到最优解');
        }, 500);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        this.animationTime = time;
        
        // 自动优化
        if (this.isAutoPlay && this.iteration < 500) {
            if (Math.floor(time * 10) % 2 === 0) {
                this.optimizationStep();
            }
        }
        
        // 小球脉动
        if (this.ball) {
            const pulse = 1 + Math.sin(time * 5) * 0.1;
            this.ball.scale.setScalar(pulse);
        }
        
        // 最小值标记脉动
        if (this.minimumMarker) {
            const scale = 1 + Math.sin(time * 3) * 0.2;
            this.minimumMarker.scale.setScalar(scale);
        }
        
        // 粒子旋转
        if (this.particles) {
            this.particles.rotation.y = time * 0.02;
        }
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return [this.surface, this.ball, this.gradientArrow].filter(Boolean);
    }

    /**
     * 清理
     */
    dispose() {
        this.isAutoPlay = false;
        
        // 移除信息面板
        const panel = document.getElementById('gradient-info-panel');
        if (panel) panel.remove();
    }
}

// 注册到全局
window.GradientDescentScene = GradientDescentScene;
