/**
 * 排序算法可视化 3D教学场景
 * ============================================
 * 直观展示不同排序算法的效率差异
 * 
 * 教学内容：
 * 1. 冒泡排序 (Bubble Sort) - O(n²)
 * 2. 选择排序 (Selection Sort) - O(n²)
 * 3. 插入排序 (Insertion Sort) - O(n²)
 * 4. 快速排序 (Quick Sort) - O(n log n)
 * 5. 归并排序 (Merge Sort) - O(n log n)
 * 
 * 目标学生：高中-大学编程入门
 * ============================================
 */

class SortingScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'SortingScene';
        this.mainGroup = null;
        
        // 数据
        this.arraySize = 20;
        this.originalArray = [];
        this.displayBars = [];
        
        // 排序状态
        this.isSorting = false;
        this.isPaused = false;
        this.currentAlgorithm = 'bubble';
        this.sortSpeed = 100; // 毫秒
        this.comparisons = 0;
        this.swaps = 0;
        this.sortSteps = [];
        this.currentStep = 0;
        
        // 竞速模式
        this.isRacing = false;
        this.raceBars = {};
        
        // 颜色配置
        this.colors = {
            default: 0x4fc3f7,      // 默认 - 蓝色
            comparing: 0xffeb3b,     // 比较中 - 黄色
            swapping: 0xff5722,      // 交换中 - 橙色
            sorted: 0x4caf50,        // 已排序 - 绿色
            pivot: 0xab47bc,         // 基准值 - 紫色
            selected: 0xe91e63       // 选中 - 粉色
        };
        
        // 算法信息
        this.algorithms = {
            bubble: {
                name: '冒泡排序',
                complexity: 'O(n²)',
                description: '相邻元素比较交换，大的"冒泡"到末尾',
                color: 0x4fc3f7
            },
            selection: {
                name: '选择排序',
                complexity: 'O(n²)',
                description: '每次找最小值放到前面',
                color: 0xff9800
            },
            insertion: {
                name: '插入排序',
                complexity: 'O(n²)',
                description: '像整理扑克牌，逐个插入正确位置',
                color: 0x9c27b0
            },
            quick: {
                name: '快速排序',
                complexity: 'O(n log n)',
                description: '分治法，选基准值分区递归',
                color: 0x4caf50
            },
            merge: {
                name: '归并排序',
                complexity: 'O(n log n)',
                description: '分治法，先分后合',
                color: 0x2196f3
            }
        };
    }

    init() {
        // 设置场景背景
        this.scene.background = new THREE.Color(0x0a1525);
        this.scene.fog = new THREE.FogExp2(0x0a1525, 0.015);
        
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建环境
        this.setupEnvironment();
        
        // 创建灯光
        this.setupLighting();
        
        // 生成随机数组并创建柱状图
        this.generateArray();
        this.createBars();
        
        // 创建信息面板
        this.createInfoPanel();
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(0, 15, 25);
            this.camera.lookAt(0, 5, 0);
        }
        
        // 创建UI
        this.setupUI();
        
        console.log('SortingScene initialized');
    }

    /**
     * 设置环境
     */
    setupEnvironment() {
        // 网格地面
        const grid = new THREE.GridHelper(50, 50, 0x4fc3f7, 0x1a2a3a);
        grid.position.y = 0;
        grid.material.opacity = 0.3;
        grid.material.transparent = true;
        this.scene.add(grid);
        
        // 背景粒子
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 1] = Math.random() * 30;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 40;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.4
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.mainGroup.add(this.particles);
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        const blueLight = new THREE.PointLight(0x4fc3f7, 0.5, 30);
        blueLight.position.set(-10, 10, 10);
        this.scene.add(blueLight);
        
        const greenLight = new THREE.PointLight(0x4caf50, 0.3, 25);
        greenLight.position.set(10, 10, -10);
        this.scene.add(greenLight);
    }

    /**
     * 生成随机数组
     */
    generateArray() {
        this.originalArray = [];
        for (let i = 0; i < this.arraySize; i++) {
            this.originalArray.push(Math.floor(Math.random() * 15) + 1);
        }
    }

    /**
     * 创建柱状图
     */
    createBars() {
        // 清除旧的柱子
        this.displayBars.forEach(bar => {
            this.mainGroup.remove(bar);
        });
        this.displayBars = [];
        
        const barWidth = 0.8;
        const gap = 0.3;
        const totalWidth = this.arraySize * (barWidth + gap);
        const startX = -totalWidth / 2;
        
        for (let i = 0; i < this.originalArray.length; i++) {
            const height = this.originalArray[i];
            const bar = this.createBar(height, i);
            bar.position.x = startX + i * (barWidth + gap);
            bar.position.y = height / 2;
            bar.userData.index = i;
            bar.userData.value = height;
            
            this.displayBars.push(bar);
            this.mainGroup.add(bar);
        }
    }

    /**
     * 创建单个柱子
     */
    createBar(height, index) {
        const group = new THREE.Group();
        
        // 主体
        const geometry = new THREE.BoxGeometry(0.8, height, 0.8);
        const material = new THREE.MeshPhongMaterial({
            color: this.colors.default,
            emissive: this.colors.default,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.9
        });
        const mesh = new THREE.Mesh(geometry, material);
        group.add(mesh);
        
        // 顶部发光
        const topGeo = new THREE.BoxGeometry(0.85, 0.1, 0.85);
        const topMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.5
        });
        const top = new THREE.Mesh(topGeo, topMat);
        top.position.y = height / 2;
        group.add(top);
        
        // 数值标签
        const label = this.createValueLabel(height);
        label.position.y = height / 2 + 0.8;
        group.add(label);
        
        group.userData.mesh = mesh;
        group.userData.label = label;
        
        return group;
    }

    /**
     * 创建数值标签
     */
    createValueLabel(value) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 32;
        
        context.fillStyle = '#ffffff';
        context.font = 'bold 20px Arial';
        context.textAlign = 'center';
        context.fillText(value.toString(), 32, 22);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true 
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(1, 0.5, 1);
        
        return sprite;
    }

    /**
     * 更新柱子颜色
     */
    setBarColor(index, colorType) {
        if (index < 0 || index >= this.displayBars.length) return;
        
        const bar = this.displayBars[index];
        const mesh = bar.userData.mesh;
        const color = this.colors[colorType] || this.colors.default;
        
        mesh.material.color.setHex(color);
        mesh.material.emissive.setHex(color);
        mesh.material.emissiveIntensity = colorType === 'default' ? 0.2 : 0.5;
    }

    /**
     * 交换两个柱子的位置（动画）
     */
    async swapBars(i, j) {
        if (i === j) return;
        
        const bar1 = this.displayBars[i];
        const bar2 = this.displayBars[j];
        
        const pos1 = bar1.position.x;
        const pos2 = bar2.position.x;
        
        // 高亮
        this.setBarColor(i, 'swapping');
        this.setBarColor(j, 'swapping');
        
        // 动画交换
        await this.animateSwap(bar1, bar2, pos1, pos2);
        
        // 更新数组和显示
        [this.displayBars[i], this.displayBars[j]] = [this.displayBars[j], this.displayBars[i]];
        this.displayBars[i].userData.index = i;
        this.displayBars[j].userData.index = j;
        
        this.swaps++;
        this.updateStats();
    }

    /**
     * 交换动画
     */
    animateSwap(bar1, bar2, pos1, pos2) {
        return new Promise(resolve => {
            const duration = this.sortSpeed;
            const startTime = Date.now();
            const height = 3; // 弧形高度
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // 缓动函数
                const eased = 1 - Math.pow(1 - progress, 3);
                
                // 弧形路径
                const arc = Math.sin(progress * Math.PI) * height;
                
                bar1.position.x = pos1 + (pos2 - pos1) * eased;
                bar1.position.z = arc;
                
                bar2.position.x = pos2 + (pos1 - pos2) * eased;
                bar2.position.z = -arc * 0.5;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    bar1.position.z = 0;
                    bar2.position.z = 0;
                    resolve();
                }
            };
            
            animate();
        });
    }

    /**
     * 等待延迟
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms || this.sortSpeed));
    }

    /**
     * 冒泡排序
     */
    async bubbleSort() {
        const n = this.displayBars.length;
        
        for (let i = 0; i < n - 1; i++) {
            for (let j = 0; j < n - i - 1; j++) {
                if (!this.isSorting) return;
                while (this.isPaused) await this.delay(100);
                
                // 比较
                this.setBarColor(j, 'comparing');
                this.setBarColor(j + 1, 'comparing');
                this.comparisons++;
                this.updateStats();
                await this.delay();
                
                if (this.displayBars[j].userData.value > this.displayBars[j + 1].userData.value) {
                    await this.swapBars(j, j + 1);
                }
                
                this.setBarColor(j, 'default');
            }
            // 标记已排序
            this.setBarColor(n - 1 - i, 'sorted');
        }
        this.setBarColor(0, 'sorted');
    }

    /**
     * 选择排序
     */
    async selectionSort() {
        const n = this.displayBars.length;
        
        for (let i = 0; i < n - 1; i++) {
            let minIdx = i;
            this.setBarColor(minIdx, 'selected');
            
            for (let j = i + 1; j < n; j++) {
                if (!this.isSorting) return;
                while (this.isPaused) await this.delay(100);
                
                this.setBarColor(j, 'comparing');
                this.comparisons++;
                this.updateStats();
                await this.delay();
                
                if (this.displayBars[j].userData.value < this.displayBars[minIdx].userData.value) {
                    this.setBarColor(minIdx, 'default');
                    minIdx = j;
                    this.setBarColor(minIdx, 'selected');
                } else {
                    this.setBarColor(j, 'default');
                }
            }
            
            if (minIdx !== i) {
                await this.swapBars(i, minIdx);
            }
            
            this.setBarColor(i, 'sorted');
        }
        this.setBarColor(n - 1, 'sorted');
    }

    /**
     * 插入排序
     */
    async insertionSort() {
        const n = this.displayBars.length;
        
        for (let i = 1; i < n; i++) {
            let j = i;
            this.setBarColor(j, 'selected');
            await this.delay();
            
            while (j > 0) {
                if (!this.isSorting) return;
                while (this.isPaused) await this.delay(100);
                
                this.setBarColor(j - 1, 'comparing');
                this.comparisons++;
                this.updateStats();
                await this.delay();
                
                if (this.displayBars[j].userData.value < this.displayBars[j - 1].userData.value) {
                    await this.swapBars(j, j - 1);
                    this.setBarColor(j, 'default');
                    j--;
                } else {
                    this.setBarColor(j - 1, 'default');
                    break;
                }
            }
            
            this.setBarColor(j, 'sorted');
        }
        
        // 标记全部已排序
        for (let i = 0; i < n; i++) {
            this.setBarColor(i, 'sorted');
        }
    }

    /**
     * 快速排序
     */
    async quickSort(left = 0, right = this.displayBars.length - 1) {
        if (left >= right) {
            if (left === right) this.setBarColor(left, 'sorted');
            return;
        }
        
        const pivotIdx = await this.partition(left, right);
        await this.quickSort(left, pivotIdx - 1);
        await this.quickSort(pivotIdx + 1, right);
    }

    async partition(left, right) {
        const pivotValue = this.displayBars[right].userData.value;
        this.setBarColor(right, 'pivot');
        
        let i = left - 1;
        
        for (let j = left; j < right; j++) {
            if (!this.isSorting) return left;
            while (this.isPaused) await this.delay(100);
            
            this.setBarColor(j, 'comparing');
            this.comparisons++;
            this.updateStats();
            await this.delay();
            
            if (this.displayBars[j].userData.value < pivotValue) {
                i++;
                if (i !== j) {
                    await this.swapBars(i, j);
                }
                this.setBarColor(i, 'default');
            }
            this.setBarColor(j, 'default');
        }
        
        await this.swapBars(i + 1, right);
        this.setBarColor(i + 1, 'sorted');
        
        return i + 1;
    }

    /**
     * 归并排序
     */
    async mergeSort(left = 0, right = this.displayBars.length - 1) {
        if (left >= right) {
            this.setBarColor(left, 'sorted');
            return;
        }
        
        const mid = Math.floor((left + right) / 2);
        
        // 高亮分区
        for (let i = left; i <= mid; i++) {
            this.setBarColor(i, 'comparing');
        }
        await this.delay();
        for (let i = left; i <= mid; i++) {
            this.setBarColor(i, 'default');
        }
        
        await this.mergeSort(left, mid);
        await this.mergeSort(mid + 1, right);
        await this.merge(left, mid, right);
    }

    async merge(left, mid, right) {
        const temp = [];
        let i = left, j = mid + 1;
        
        while (i <= mid && j <= right) {
            if (!this.isSorting) return;
            while (this.isPaused) await this.delay(100);
            
            this.setBarColor(i, 'comparing');
            this.setBarColor(j, 'comparing');
            this.comparisons++;
            this.updateStats();
            await this.delay();
            
            if (this.displayBars[i].userData.value <= this.displayBars[j].userData.value) {
                temp.push({ bar: this.displayBars[i], value: this.displayBars[i].userData.value });
                this.setBarColor(i, 'default');
                i++;
            } else {
                temp.push({ bar: this.displayBars[j], value: this.displayBars[j].userData.value });
                this.setBarColor(j, 'default');
                j++;
            }
        }
        
        while (i <= mid) {
            temp.push({ bar: this.displayBars[i], value: this.displayBars[i].userData.value });
            i++;
        }
        while (j <= right) {
            temp.push({ bar: this.displayBars[j], value: this.displayBars[j].userData.value });
            j++;
        }
        
        // 重新排列柱子位置
        const barWidth = 0.8;
        const gap = 0.3;
        const totalWidth = this.arraySize * (barWidth + gap);
        const startX = -totalWidth / 2;
        
        for (let k = 0; k < temp.length; k++) {
            const targetIdx = left + k;
            const bar = temp[k].bar;
            
            this.displayBars[targetIdx] = bar;
            bar.userData.index = targetIdx;
            
            // 动画移动到新位置
            const targetX = startX + targetIdx * (barWidth + gap);
            await this.animateMove(bar, targetX);
            this.setBarColor(targetIdx, 'sorted');
        }
    }

    /**
     * 移动动画
     */
    animateMove(bar, targetX) {
        return new Promise(resolve => {
            const startX = bar.position.x;
            const duration = this.sortSpeed / 2;
            const startTime = Date.now();
            
            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = Math.min(elapsed / duration, 1);
                const eased = 1 - Math.pow(1 - progress, 2);
                
                bar.position.x = startX + (targetX - startX) * eased;
                
                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };
            
            animate();
        });
    }

    /**
     * 开始排序
     */
    async startSort() {
        if (this.isSorting) return;
        
        this.isSorting = true;
        this.isPaused = false;
        this.comparisons = 0;
        this.swaps = 0;
        this.updateStats();
        
        // 重置颜色
        this.displayBars.forEach((_, i) => this.setBarColor(i, 'default'));
        
        const algo = this.algorithms[this.currentAlgorithm];
        this.showGuide(`🚀 开始 ${algo.name}（${algo.complexity}）`);
        
        switch (this.currentAlgorithm) {
            case 'bubble':
                await this.bubbleSort();
                break;
            case 'selection':
                await this.selectionSort();
                break;
            case 'insertion':
                await this.insertionSort();
                break;
            case 'quick':
                await this.quickSort();
                break;
            case 'merge':
                await this.mergeSort();
                break;
        }
        
        if (this.isSorting) {
            this.showGuide(`✅ ${algo.name} 完成！比较 ${this.comparisons} 次，交换 ${this.swaps} 次`);
        }
        
        this.isSorting = false;
    }

    /**
     * 暂停/继续
     */
    togglePause() {
        this.isPaused = !this.isPaused;
        return this.isPaused;
    }

    /**
     * 停止排序
     */
    stopSort() {
        this.isSorting = false;
        this.isPaused = false;
    }

    /**
     * 重置
     */
    reset() {
        this.stopSort();
        this.generateArray();
        this.createBars();
        this.comparisons = 0;
        this.swaps = 0;
        this.updateStats();
    }

    /**
     * 创建信息面板
     */
    createInfoPanel() {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        const panel = document.createElement('div');
        panel.id = 'sorting-info-panel';
        panel.className = 'sorting-info-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <i class="fas fa-chart-bar"></i>
                <span>排序算法可视化</span>
            </div>
            <div class="algo-info">
                <div class="algo-name" id="algo-name">冒泡排序</div>
                <div class="algo-complexity" id="algo-complexity">O(n²)</div>
            </div>
            <div class="stats-row">
                <div class="stat">
                    <span class="stat-label">比较次数</span>
                    <span class="stat-value" id="stat-comparisons">0</span>
                </div>
                <div class="stat">
                    <span class="stat-label">交换次数</span>
                    <span class="stat-value" id="stat-swaps">0</span>
                </div>
            </div>
            <div class="color-legend">
                <div class="legend-item"><span class="dot" style="background:#4fc3f7"></span>待排序</div>
                <div class="legend-item"><span class="dot" style="background:#ffeb3b"></span>比较中</div>
                <div class="legend-item"><span class="dot" style="background:#ff5722"></span>交换中</div>
                <div class="legend-item"><span class="dot" style="background:#4caf50"></span>已排序</div>
            </div>
        `;
        container.appendChild(panel);
    }

    /**
     * 更新统计信息
     */
    updateStats() {
        const compEl = document.getElementById('stat-comparisons');
        const swapEl = document.getElementById('stat-swaps');
        
        if (compEl) compEl.textContent = this.comparisons;
        if (swapEl) swapEl.textContent = this.swaps;
    }

    /**
     * 更新算法信息显示
     */
    updateAlgoInfo() {
        const algo = this.algorithms[this.currentAlgorithm];
        const nameEl = document.getElementById('algo-name');
        const compEl = document.getElementById('algo-complexity');
        
        if (nameEl) nameEl.textContent = algo.name;
        if (compEl) compEl.textContent = algo.complexity;
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="sorting-controls">
                <div class="control-group">
                    <label>选择算法</label>
                    <select id="algo-select" class="algo-select">
                        <option value="bubble">冒泡排序 O(n²)</option>
                        <option value="selection">选择排序 O(n²)</option>
                        <option value="insertion">插入排序 O(n²)</option>
                        <option value="quick">快速排序 O(n log n)</option>
                        <option value="merge">归并排序 O(n log n)</option>
                    </select>
                </div>
                <div class="control-group">
                    <label>速度</label>
                    <div class="speed-control">
                        <input type="range" id="speed-slider" min="20" max="500" value="100">
                        <span id="speed-value">100ms</span>
                    </div>
                </div>
                <div class="control-group buttons">
                    <button class="action-btn primary" id="btn-start">
                        <i class="fas fa-play"></i> 开始
                    </button>
                    <button class="action-btn" id="btn-pause">
                        <i class="fas fa-pause"></i> 暂停
                    </button>
                    <button class="action-btn" id="btn-reset">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.getElementById('algo-select')?.addEventListener('change', (e) => {
            this.currentAlgorithm = e.target.value;
            this.updateAlgoInfo();
            this.reset();
        });
        
        document.getElementById('speed-slider')?.addEventListener('input', (e) => {
            this.sortSpeed = 520 - parseInt(e.target.value); // 反转，滑块向右更快
            document.getElementById('speed-value').textContent = `${this.sortSpeed}ms`;
        });
        
        document.getElementById('btn-start')?.addEventListener('click', () => {
            this.startSort();
        });
        
        document.getElementById('btn-pause')?.addEventListener('click', (e) => {
            const paused = this.togglePause();
            e.target.innerHTML = paused 
                ? '<i class="fas fa-play"></i> 继续' 
                : '<i class="fas fa-pause"></i> 暂停';
        });
        
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.reset();
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
        }, 3000);
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        setTimeout(() => {
            this.showGuide('📊 排序算法可视化：观察不同算法的效率差异！');
        }, 500);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        // 粒子旋转
        if (this.particles) {
            this.particles.rotation.y = time * 0.02;
        }
        
        // 柱子微微发光脉动
        this.displayBars.forEach((bar, i) => {
            const mesh = bar.userData.mesh;
            if (mesh && mesh.material.emissiveIntensity !== undefined) {
                const base = mesh.material.color.getHex() === this.colors.sorted ? 0.4 : 0.2;
                mesh.material.emissiveIntensity = base + Math.sin(time * 3 + i * 0.3) * 0.1;
            }
        });
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return this.displayBars.map(bar => bar.userData.mesh).filter(Boolean);
    }

    /**
     * 清理
     */
    dispose() {
        this.stopSort();
        
        const panel = document.getElementById('sorting-info-panel');
        if (panel) panel.remove();
    }
}

// 注册到全局
window.SortingScene = SortingScene;
