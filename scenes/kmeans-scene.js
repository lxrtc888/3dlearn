/**
 * K-Means 聚类算法可视化 3D教学场景
 * ============================================
 * 直观展示K-Means聚类的迭代演变过程
 * 
 * 教学内容：
 * 1. 理解"物以类聚"的机器学习思想
 * 2. K个聚类中心的初始化
 * 3. 分配：每个点归属最近中心
 * 4. 更新：重新计算中心位置
 * 5. 迭代直到收敛
 * 
 * 目标学生：高中-大学AI入门
 * ============================================
 */

class KMeansScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'KMeansScene';
        this.mainGroup = null;
        
        // 数据点
        this.numPoints = 150;
        this.points = [];
        this.pointMeshes = [];
        
        // 聚类中心
        this.k = 3;
        this.centroids = [];
        this.centroidMeshes = [];
        this.centroidPaths = []; // 记录中心移动轨迹
        
        // 状态
        this.iteration = 0;
        this.maxIterations = 20;
        this.isRunning = false;
        this.isPaused = false;
        this.hasConverged = false;
        this.iterationSpeed = 1000; // 毫秒
        
        // 颜色配置（对应不同聚类）
        this.clusterColors = [
            0xff6b6b, // 红
            0x4ecdc4, // 青
            0xffe66d, // 黄
            0x95e1d3, // 绿
            0xdda0dd, // 粉紫
            0x87ceeb  // 天蓝
        ];
        
        // 连线
        this.connectionLines = [];
    }

    init() {
        // 设置场景背景
        this.scene.background = new THREE.Color(0x0a1525);
        this.scene.fog = new THREE.FogExp2(0x0a1525, 0.008);
        
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建环境
        this.setupEnvironment();
        
        // 创建灯光
        this.setupLighting();
        
        // 生成数据点
        this.generateDataPoints();
        
        // 初始化聚类中心
        this.initializeCentroids();
        
        // 创建可视化
        this.createVisualization();
        
        // 创建信息面板
        this.createInfoPanel();
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(0, 25, 30);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 创建UI
        this.setupUI();
        
        console.log('KMeansScene initialized');
    }

    /**
     * 设置环境
     */
    setupEnvironment() {
        // 网格地面
        const grid = new THREE.GridHelper(40, 40, 0x4fc3f7, 0x1a2a3a);
        grid.position.y = -0.1;
        grid.material.opacity = 0.3;
        grid.material.transparent = true;
        this.scene.add(grid);
        
        // XY坐标轴
        this.createAxes();
        
        // 背景粒子
        const particleCount = 100;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 20 + 5;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.08,
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.3
        });
        
        this.bgParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.mainGroup.add(this.bgParticles);
    }

    /**
     * 创建坐标轴
     */
    createAxes() {
        const axisLength = 18;
        const axisGroup = new THREE.Group();
        
        // X轴（红）
        const xAxisGeo = new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8);
        const xAxisMat = new THREE.MeshBasicMaterial({ color: 0xff6b6b });
        const xAxis = new THREE.Mesh(xAxisGeo, xAxisMat);
        xAxis.rotation.z = -Math.PI / 2;
        xAxis.position.x = axisLength / 2;
        axisGroup.add(xAxis);
        
        // Y轴（绿）- 在3D中用Z轴表示
        const yAxisGeo = new THREE.CylinderGeometry(0.05, 0.05, axisLength, 8);
        const yAxisMat = new THREE.MeshBasicMaterial({ color: 0x4ecdc4 });
        const yAxis = new THREE.Mesh(yAxisGeo, yAxisMat);
        yAxis.rotation.x = Math.PI / 2;
        yAxis.position.z = axisLength / 2;
        axisGroup.add(yAxis);
        
        // 轴标签
        const xLabel = this.createTextSprite('X', 0xff6b6b);
        xLabel.position.set(axisLength + 1, 0, 0);
        axisGroup.add(xLabel);
        
        const yLabel = this.createTextSprite('Y', 0x4ecdc4);
        yLabel.position.set(0, 0, axisLength + 1);
        axisGroup.add(yLabel);
        
        this.mainGroup.add(axisGroup);
    }

    /**
     * 创建文字精灵
     */
    createTextSprite(text, color) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.font = 'bold 48px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, 32, 32);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1.5, 1.5, 1);
        
        return sprite;
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        // 彩色点光源
        const redLight = new THREE.PointLight(0xff6b6b, 0.4, 30);
        redLight.position.set(-10, 10, 10);
        this.scene.add(redLight);
        
        const cyanLight = new THREE.PointLight(0x4ecdc4, 0.4, 30);
        cyanLight.position.set(10, 10, -10);
        this.scene.add(cyanLight);
    }

    /**
     * 生成数据点（模拟有聚类结构的数据）
     */
    generateDataPoints() {
        this.points = [];
        
        // 生成3个簇的数据
        const clusterCenters = [
            { x: -8, z: -8 },
            { x: 8, z: -5 },
            { x: 0, z: 10 }
        ];
        
        const pointsPerCluster = Math.floor(this.numPoints / 3);
        
        clusterCenters.forEach((center) => {
            for (let i = 0; i < pointsPerCluster; i++) {
                // 高斯分布模拟
                const angle = Math.random() * Math.PI * 2;
                const radius = (Math.random() + Math.random() + Math.random()) / 3 * 5;
                
                this.points.push({
                    x: center.x + Math.cos(angle) * radius,
                    z: center.z + Math.sin(angle) * radius,
                    cluster: -1 // 未分配
                });
            }
        });
        
        // 打乱顺序
        this.points.sort(() => Math.random() - 0.5);
    }

    /**
     * 初始化聚类中心（K-means++策略）
     */
    initializeCentroids() {
        this.centroids = [];
        this.centroidPaths = [];
        
        // 随机选择第一个中心
        const firstIdx = Math.floor(Math.random() * this.points.length);
        this.centroids.push({
            x: this.points[firstIdx].x,
            z: this.points[firstIdx].z
        });
        this.centroidPaths.push([{ x: this.points[firstIdx].x, z: this.points[firstIdx].z }]);
        
        // K-means++ 选择后续中心
        for (let i = 1; i < this.k; i++) {
            const distances = this.points.map(p => {
                return Math.min(...this.centroids.map(c => 
                    Math.pow(p.x - c.x, 2) + Math.pow(p.z - c.z, 2)
                ));
            });
            
            const totalDist = distances.reduce((a, b) => a + b, 0);
            let random = Math.random() * totalDist;
            
            for (let j = 0; j < this.points.length; j++) {
                random -= distances[j];
                if (random <= 0) {
                    this.centroids.push({
                        x: this.points[j].x,
                        z: this.points[j].z
                    });
                    this.centroidPaths.push([{ x: this.points[j].x, z: this.points[j].z }]);
                    break;
                }
            }
        }
    }

    /**
     * 创建可视化元素
     */
    createVisualization() {
        // 创建数据点
        this.pointMeshes = [];
        const pointGeo = new THREE.SphereGeometry(0.25, 16, 16);
        
        this.points.forEach((point, idx) => {
            const mat = new THREE.MeshPhongMaterial({
                color: 0x888888,
                emissive: 0x444444,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.8
            });
            
            const mesh = new THREE.Mesh(pointGeo, mat);
            mesh.position.set(point.x, 0.5, point.z);
            mesh.userData = { type: 'dataPoint', index: idx };
            
            this.pointMeshes.push(mesh);
            this.mainGroup.add(mesh);
        });
        
        // 创建聚类中心
        this.centroidMeshes = [];
        const centroidGeo = new THREE.OctahedronGeometry(0.8, 0);
        
        this.centroids.forEach((centroid, idx) => {
            const color = this.clusterColors[idx];
            const mat = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.9
            });
            
            const mesh = new THREE.Mesh(centroidGeo, mat);
            mesh.position.set(centroid.x, 1.5, centroid.z);
            mesh.userData = {
                type: 'centroid',
                index: idx,
                hoverTitle: `聚类中心 ${idx + 1}`,
                hoverDesc: '通过迭代移动到簇的中心位置'
            };
            
            // 添加光晕
            const glowGeo = new THREE.SphereGeometry(1.2, 16, 16);
            const glowMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.15
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            mesh.add(glow);
            
            this.centroidMeshes.push(mesh);
            this.mainGroup.add(mesh);
        });
    }

    /**
     * 分配步骤：每个点归属最近的中心
     */
    assignPoints() {
        let changed = false;
        
        this.points.forEach((point, idx) => {
            let minDist = Infinity;
            let newCluster = 0;
            
            this.centroids.forEach((centroid, cIdx) => {
                const dist = Math.pow(point.x - centroid.x, 2) + Math.pow(point.z - centroid.z, 2);
                if (dist < minDist) {
                    minDist = dist;
                    newCluster = cIdx;
                }
            });
            
            if (point.cluster !== newCluster) {
                changed = true;
                point.cluster = newCluster;
            }
        });
        
        return changed;
    }

    /**
     * 更新步骤：重新计算中心位置
     */
    updateCentroids() {
        const oldPositions = this.centroids.map(c => ({ x: c.x, z: c.z }));
        
        this.centroids.forEach((centroid, idx) => {
            const clusterPoints = this.points.filter(p => p.cluster === idx);
            
            if (clusterPoints.length > 0) {
                const newX = clusterPoints.reduce((sum, p) => sum + p.x, 0) / clusterPoints.length;
                const newZ = clusterPoints.reduce((sum, p) => sum + p.z, 0) / clusterPoints.length;
                
                centroid.x = newX;
                centroid.z = newZ;
                
                // 记录轨迹
                this.centroidPaths[idx].push({ x: newX, z: newZ });
            }
        });
        
        return oldPositions;
    }

    /**
     * 更新可视化
     */
    async updateVisualization(oldCentroidPositions) {
        // 更新数据点颜色
        this.points.forEach((point, idx) => {
            const mesh = this.pointMeshes[idx];
            const color = point.cluster >= 0 ? this.clusterColors[point.cluster] : 0x888888;
            
            gsap.to(mesh.material.color, {
                r: ((color >> 16) & 255) / 255,
                g: ((color >> 8) & 255) / 255,
                b: (color & 255) / 255,
                duration: 0.3
            });
            
            mesh.material.emissive.setHex(color);
        });
        
        // 动画移动中心点
        await Promise.all(this.centroids.map((centroid, idx) => {
            const mesh = this.centroidMeshes[idx];
            const oldPos = oldCentroidPositions[idx];
            
            return new Promise(resolve => {
                gsap.to(mesh.position, {
                    x: centroid.x,
                    z: centroid.z,
                    duration: 0.5,
                    ease: 'power2.out',
                    onComplete: resolve
                });
            });
        }));
        
        // 更新连线
        this.updateConnectionLines();
    }

    /**
     * 更新连接线
     */
    updateConnectionLines() {
        // 清除旧连线
        this.connectionLines.forEach(line => this.mainGroup.remove(line));
        this.connectionLines = [];
        
        // 为每个点画到中心的连线
        this.points.forEach((point, idx) => {
            if (point.cluster < 0) return;
            
            const centroid = this.centroids[point.cluster];
            const color = this.clusterColors[point.cluster];
            
            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.2
            });
            
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(point.x, 0.3, point.z),
                new THREE.Vector3(centroid.x, 1.5, centroid.z)
            ]);
            
            const line = new THREE.Line(geometry, material);
            this.connectionLines.push(line);
            this.mainGroup.add(line);
        });
        
        // 画中心移动轨迹
        this.centroidPaths.forEach((path, idx) => {
            if (path.length < 2) return;
            
            const color = this.clusterColors[idx];
            const material = new THREE.LineDashedMaterial({
                color: color,
                dashSize: 0.3,
                gapSize: 0.15,
                linewidth: 2
            });
            
            const points = path.map(p => new THREE.Vector3(p.x, 1.5, p.z));
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            
            const line = new THREE.Line(geometry, material);
            line.computeLineDistances();
            this.connectionLines.push(line);
            this.mainGroup.add(line);
        });
    }

    /**
     * 执行一次迭代
     */
    async runIteration() {
        this.iteration++;
        
        // 步骤1：分配
        this.showGuide(`📍 迭代 ${this.iteration}：分配数据点到最近的中心...`);
        const changed = this.assignPoints();
        
        // 更新颜色
        this.points.forEach((point, idx) => {
            const mesh = this.pointMeshes[idx];
            const color = this.clusterColors[point.cluster];
            mesh.material.color.setHex(color);
            mesh.material.emissive.setHex(color);
        });
        
        this.updateConnectionLines();
        await this.delay(this.iterationSpeed / 2);
        
        // 步骤2：更新中心
        this.showGuide(`📍 迭代 ${this.iteration}：重新计算聚类中心...`);
        const oldPositions = this.updateCentroids();
        await this.updateVisualization(oldPositions);
        
        // 更新信息面板
        this.updateInfoPanel();
        
        // 检查收敛
        if (!changed || this.iteration >= this.maxIterations) {
            this.hasConverged = true;
            this.isRunning = false;
            this.showGuide(`✅ K-Means 收敛！共迭代 ${this.iteration} 次`);
        }
    }

    /**
     * 开始运行
     */
    async startClustering() {
        if (this.isRunning || this.hasConverged) return;
        
        this.isRunning = true;
        this.isPaused = false;
        
        while (this.isRunning && !this.hasConverged) {
            if (this.isPaused) {
                await this.delay(100);
                continue;
            }
            
            await this.runIteration();
            await this.delay(this.iterationSpeed);
        }
    }

    /**
     * 单步执行
     */
    async stepOnce() {
        if (this.hasConverged) return;
        await this.runIteration();
    }

    /**
     * 暂停/继续
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    /**
     * 停止
     */
    stop() {
        this.isRunning = false;
        this.isPaused = false;
    }

    /**
     * 重置
     */
    reset() {
        this.stop();
        
        // 清除可视化
        this.pointMeshes.forEach(m => this.mainGroup.remove(m));
        this.centroidMeshes.forEach(m => this.mainGroup.remove(m));
        this.connectionLines.forEach(l => this.mainGroup.remove(l));
        
        this.pointMeshes = [];
        this.centroidMeshes = [];
        this.connectionLines = [];
        
        // 重新生成
        this.iteration = 0;
        this.hasConverged = false;
        
        this.generateDataPoints();
        this.initializeCentroids();
        this.createVisualization();
        
        this.updateInfoPanel();
    }

    /**
     * 延迟
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 创建信息面板
     */
    createInfoPanel() {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        const panel = document.createElement('div');
        panel.id = 'kmeans-info-panel';
        panel.className = 'kmeans-info-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <i class="fas fa-project-diagram"></i>
                <span>K-Means 聚类</span>
            </div>
            <div class="algo-desc">
                "物以类聚" - 无监督学习经典算法
            </div>
            <div class="stats-grid">
                <div class="stat-item">
                    <span class="stat-label">K值</span>
                    <span class="stat-value" id="stat-k">${this.k}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">迭代</span>
                    <span class="stat-value" id="stat-iteration">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">数据点</span>
                    <span class="stat-value" id="stat-points">${this.numPoints}</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">状态</span>
                    <span class="stat-value" id="stat-status">就绪</span>
                </div>
            </div>
            <div class="cluster-info">
                <div class="cluster-title">各簇点数</div>
                <div class="cluster-counts" id="cluster-counts">
                    ${this.centroids.map((_, i) => 
                        `<div class="cluster-count" style="background: #${this.clusterColors[i].toString(16).padStart(6, '0')}30; border-color: #${this.clusterColors[i].toString(16).padStart(6, '0')}">
                            <span class="cluster-idx">${i + 1}</span>
                            <span class="cluster-num" id="cluster-${i}-count">0</span>
                        </div>`
                    ).join('')}
                </div>
            </div>
            <div class="algorithm-steps">
                <div class="step-title">算法步骤</div>
                <div class="steps-list">
                    <div class="step" id="step-init"><i class="fas fa-dot-circle"></i> 初始化K个中心</div>
                    <div class="step" id="step-assign"><i class="fas fa-arrows-alt"></i> 分配点到最近中心</div>
                    <div class="step" id="step-update"><i class="fas fa-sync-alt"></i> 更新中心位置</div>
                    <div class="step" id="step-check"><i class="fas fa-check-circle"></i> 检查是否收敛</div>
                </div>
            </div>
        `;
        container.appendChild(panel);
    }

    /**
     * 更新信息面板
     */
    updateInfoPanel() {
        const iterEl = document.getElementById('stat-iteration');
        const statusEl = document.getElementById('stat-status');
        
        if (iterEl) iterEl.textContent = this.iteration;
        if (statusEl) {
            statusEl.textContent = this.hasConverged ? '已收敛' : (this.isRunning ? '运行中' : '就绪');
        }
        
        // 更新各簇点数
        this.centroids.forEach((_, idx) => {
            const count = this.points.filter(p => p.cluster === idx).length;
            const el = document.getElementById(`cluster-${idx}-count`);
            if (el) el.textContent = count;
        });
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="kmeans-controls">
                <div class="control-group">
                    <label>聚类数 K</label>
                    <div class="k-selector">
                        <button class="k-btn" data-k="2">2</button>
                        <button class="k-btn active" data-k="3">3</button>
                        <button class="k-btn" data-k="4">4</button>
                        <button class="k-btn" data-k="5">5</button>
                    </div>
                </div>
                <div class="control-group">
                    <label>速度</label>
                    <div class="speed-control">
                        <input type="range" id="kmeans-speed" min="200" max="2000" value="1000">
                        <span id="speed-display">1.0s</span>
                    </div>
                </div>
                <div class="control-group buttons">
                    <button class="action-btn primary" id="btn-run">
                        <i class="fas fa-play"></i> 自动运行
                    </button>
                    <button class="action-btn" id="btn-step">
                        <i class="fas fa-step-forward"></i> 单步
                    </button>
                    <button class="action-btn" id="btn-reset">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.querySelectorAll('.k-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.k-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.k = parseInt(e.target.dataset.k);
                this.reset();
            });
        });
        
        document.getElementById('kmeans-speed')?.addEventListener('input', (e) => {
            this.iterationSpeed = parseInt(e.target.value);
            document.getElementById('speed-display').textContent = (this.iterationSpeed / 1000).toFixed(1) + 's';
        });
        
        document.getElementById('btn-run')?.addEventListener('click', (e) => {
            if (this.isRunning) {
                const paused = this.togglePause();
                e.target.innerHTML = paused 
                    ? '<i class="fas fa-play"></i> 继续' 
                    : '<i class="fas fa-pause"></i> 暂停';
            } else {
                this.startClustering();
                e.target.innerHTML = '<i class="fas fa-pause"></i> 暂停';
            }
        });
        
        document.getElementById('btn-step')?.addEventListener('click', () => {
            this.stepOnce();
        });
        
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.reset();
            document.getElementById('btn-run').innerHTML = '<i class="fas fa-play"></i> 自动运行';
        });
    }

    /**
     * 显示引导消息
     */
    showGuide(message) {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        const oldGuide = container.querySelector('.scene-guide-message');
        if (oldGuide) oldGuide.remove();
        
        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        container.appendChild(guide);
        
        setTimeout(() => guide.classList.add('visible'), 100);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 300);
        }, 2500);
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        setTimeout(() => {
            this.showGuide('🎯 K-Means聚类：观察"物以类聚"的机器学习过程！');
        }, 500);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        // 背景粒子旋转
        if (this.bgParticles) {
            this.bgParticles.rotation.y = time * 0.015;
        }
        
        // 中心点旋转
        this.centroidMeshes.forEach((mesh, i) => {
            mesh.rotation.y = time * 0.5 + i * Math.PI / 3;
            mesh.rotation.x = Math.sin(time * 0.3 + i) * 0.2;
        });
        
        // 数据点微微浮动
        this.pointMeshes.forEach((mesh, i) => {
            mesh.position.y = 0.5 + Math.sin(time * 2 + i * 0.1) * 0.05;
        });
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return [...this.pointMeshes, ...this.centroidMeshes];
    }

    /**
     * 清理
     */
    dispose() {
        this.stop();
        
        const panel = document.getElementById('kmeans-info-panel');
        if (panel) panel.remove();
    }
}

// 注册到全局
window.KMeansScene = KMeansScene;
