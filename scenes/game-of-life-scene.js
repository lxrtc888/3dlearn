/**
 * 生命游戏（元胞自动机）场景 - Conway's Game of Life
 * ============================================
 * "4条简单规则，创造生命的复杂性"
 * 
 * 核心规则（John Conway 1970年发明）：
 * 1. 孤独死：活细胞邻居 < 2 → 死亡
 * 2. 拥挤死：活细胞邻居 > 3 → 死亡
 * 3. 繁殖：死细胞邻居 = 3 → 复活
 * 4. 存活：活细胞邻居 = 2或3 → 存活
 * 
 * 经典图案：滑翔机、振荡器、静止图案
 * 图灵完备！可以用它构建计算机！
 * ============================================
 */
window.GameOfLifeScene = class GameOfLifeScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 网格参数
        this.params = {
            gridSize: 40,        // 网格尺寸
            cellSize: 0.8,       // 细胞大小
            gap: 0.1,            // 间隙
            speed: 300,          // 更新间隔(ms)
        };

        // 状态
        this.grid = [];          // 当前状态
        this.nextGrid = [];      // 下一状态
        this.cells = [];         // 3D细胞对象
        this.isPlaying = false;
        this.generation = 0;
        this.lastUpdate = 0;

        // 颜色
        this.colors = {
            background: 0x0a0a18,
            alive: 0x00ff88,
            aliveGlow: 0x00ffaa,
            dead: 0x1a1a2e,
            grid: 0x222244,
            newBorn: 0xffff00,
            dying: 0xff4444
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 35, z: 35 };
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

        // 背景
        this.scene.background = new THREE.Color(this.colors.background);
        this.scene.fog = new THREE.FogExp2(this.colors.background, 0.015);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();

        // 初始化网格
        this.initGrid();

        // 放置初始图案（滑翔机）
        this.placeGlider(10, 10);
        this.placeGlider(25, 25);
    }

    /**
     * 设置光照
     */
    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.6);
        directional.position.set(10, 30, 10);
        this.scene.add(directional);

        // 点光源增强发光效果
        const pointLight = new THREE.PointLight(0x00ff88, 0.5, 50);
        pointLight.position.set(0, 15, 0);
        this.scene.add(pointLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建底部网格
        this.createBaseGrid();

        // 创建细胞网格
        this.createCellGrid();

        // 创建信息面板
        this.createInfoDisplay();
    }

    /**
     * 创建底部网格
     */
    createBaseGrid() {
        const size = this.params.gridSize * (this.params.cellSize + this.params.gap);
        const grid = new THREE.GridHelper(size, this.params.gridSize, this.colors.grid, this.colors.grid);
        grid.position.y = -0.5;
        grid.material.opacity = 0.3;
        grid.material.transparent = true;
        this.mainGroup.add(grid);

        // 边框
        const borderGeom = new THREE.BoxGeometry(size, 0.1, size);
        const borderMat = new THREE.MeshBasicMaterial({
            color: this.colors.grid,
            transparent: true,
            opacity: 0.2
        });
        const border = new THREE.Mesh(borderGeom, borderMat);
        border.position.y = -0.55;
        this.mainGroup.add(border);
    }

    /**
     * 创建细胞网格
     */
    createCellGrid() {
        const { gridSize, cellSize, gap } = this.params;
        const offset = (gridSize * (cellSize + gap)) / 2 - (cellSize + gap) / 2;

        // 共享几何体
        const geometry = new THREE.BoxGeometry(cellSize, cellSize * 0.5, cellSize);

        for (let x = 0; x < gridSize; x++) {
            this.cells[x] = [];
            for (let z = 0; z < gridSize; z++) {
                const material = new THREE.MeshStandardMaterial({
                    color: this.colors.dead,
                    emissive: 0x000000,
                    emissiveIntensity: 0
                });

                const cell = new THREE.Mesh(geometry, material);
                cell.position.set(
                    x * (cellSize + gap) - offset,
                    0,
                    z * (cellSize + gap) - offset
                );
                cell.scale.y = 0.1;  // 初始扁平（死亡状态）
                cell.visible = true;

                // 存储坐标
                cell.userData = { x, z, isAlive: false };

                this.mainGroup.add(cell);
                this.cells[x][z] = cell;
            }
        }
    }

    /**
     * 创建信息显示
     */
    createInfoDisplay() {
        // 将在updateInfoDisplay中动态创建
    }

    /**
     * 初始化网格状态
     */
    initGrid() {
        const { gridSize } = this.params;
        this.grid = [];
        this.nextGrid = [];

        for (let x = 0; x < gridSize; x++) {
            this.grid[x] = [];
            this.nextGrid[x] = [];
            for (let z = 0; z < gridSize; z++) {
                this.grid[x][z] = 0;
                this.nextGrid[x][z] = 0;
            }
        }

        this.generation = 0;
    }

    /**
     * 设置细胞状态
     */
    setCell(x, z, alive) {
        if (x < 0 || x >= this.params.gridSize || z < 0 || z >= this.params.gridSize) return;
        
        this.grid[x][z] = alive ? 1 : 0;
        this.updateCellVisual(x, z, alive);
    }

    /**
     * 更新细胞视觉
     */
    updateCellVisual(x, z, alive, isNewBorn = false, isDying = false) {
        const cell = this.cells[x]?.[z];
        if (!cell) return;

        cell.userData.isAlive = alive;

        if (typeof gsap !== 'undefined') {
            // 动画过渡
            gsap.to(cell.scale, {
                y: alive ? 1 : 0.1,
                duration: 0.15,
                ease: 'power2.out'
            });

            let targetColor = alive ? this.colors.alive : this.colors.dead;
            if (isNewBorn) targetColor = this.colors.newBorn;
            if (isDying) targetColor = this.colors.dying;

            const color = new THREE.Color(targetColor);
            gsap.to(cell.material.color, {
                r: color.r,
                g: color.g,
                b: color.b,
                duration: 0.15
            });

            cell.material.emissive.setHex(alive ? this.colors.aliveGlow : 0x000000);
            cell.material.emissiveIntensity = alive ? 0.3 : 0;
        } else {
            cell.scale.y = alive ? 1 : 0.1;
            cell.material.color.setHex(alive ? this.colors.alive : this.colors.dead);
            cell.material.emissive.setHex(alive ? this.colors.aliveGlow : 0x000000);
            cell.material.emissiveIntensity = alive ? 0.3 : 0;
        }
    }

    /**
     * 放置滑翔机
     */
    placeGlider(startX, startZ) {
        const pattern = [
            [0, 1, 0],
            [0, 0, 1],
            [1, 1, 1]
        ];

        for (let dx = 0; dx < 3; dx++) {
            for (let dz = 0; dz < 3; dz++) {
                if (pattern[dz][dx]) {
                    this.setCell(startX + dx, startZ + dz, true);
                }
            }
        }
    }

    /**
     * 放置振荡器（闪烁器）
     */
    placeBlinker(startX, startZ) {
        this.setCell(startX, startZ, true);
        this.setCell(startX + 1, startZ, true);
        this.setCell(startX + 2, startZ, true);
    }

    /**
     * 放置脉冲星
     */
    placePulsar(centerX, centerZ) {
        const pattern = [
            [-6,-4],[-6,-3],[-6,-2],[-4,-6],[-3,-6],[-2,-6],
            [-6,2],[-6,3],[-6,4],[-4,6],[-3,6],[-2,6],
            [6,-4],[6,-3],[6,-2],[4,-6],[3,-6],[2,-6],
            [6,2],[6,3],[6,4],[4,6],[3,6],[2,6],
            [-1,-4],[-1,-3],[-1,-2],[1,-4],[1,-3],[1,-2],
            [-1,4],[-1,3],[-1,2],[1,4],[1,3],[1,2],
            [-4,-1],[-3,-1],[-2,-1],[-4,1],[-3,1],[-2,1],
            [4,-1],[3,-1],[2,-1],[4,1],[3,1],[2,1]
        ];

        pattern.forEach(([dx, dz]) => {
            this.setCell(centerX + dx, centerZ + dz, true);
        });
    }

    /**
     * 计算邻居数
     */
    countNeighbors(x, z) {
        let count = 0;
        const { gridSize } = this.params;

        for (let dx = -1; dx <= 1; dx++) {
            for (let dz = -1; dz <= 1; dz++) {
                if (dx === 0 && dz === 0) continue;

                const nx = (x + dx + gridSize) % gridSize;  // 环绕边界
                const nz = (z + dz + gridSize) % gridSize;

                count += this.grid[nx][nz];
            }
        }

        return count;
    }

    /**
     * 执行一步演化
     */
    step() {
        const { gridSize } = this.params;
        let changes = [];

        // 计算下一状态
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                const neighbors = this.countNeighbors(x, z);
                const alive = this.grid[x][z];

                if (alive) {
                    // 活细胞规则
                    if (neighbors < 2 || neighbors > 3) {
                        this.nextGrid[x][z] = 0;  // 死亡
                        changes.push({ x, z, alive: false, dying: true });
                    } else {
                        this.nextGrid[x][z] = 1;  // 存活
                    }
                } else {
                    // 死细胞规则
                    if (neighbors === 3) {
                        this.nextGrid[x][z] = 1;  // 繁殖
                        changes.push({ x, z, alive: true, newBorn: true });
                    } else {
                        this.nextGrid[x][z] = 0;
                    }
                }
            }
        }

        // 应用变化
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                this.grid[x][z] = this.nextGrid[x][z];
            }
        }

        // 更新视觉
        changes.forEach(({ x, z, alive, newBorn, dying }) => {
            this.updateCellVisual(x, z, alive, newBorn, dying);
        });

        // 延迟恢复正常颜色
        setTimeout(() => {
            changes.forEach(({ x, z, alive }) => {
                if (alive) {
                    this.updateCellVisual(x, z, true, false, false);
                }
            });
        }, 100);

        this.generation++;
        this.updateInfoDisplay();
    }

    /**
     * 更新信息显示
     */
    updateInfoDisplay() {
        let panel = document.getElementById('gol-info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'gol-info-panel';
            panel.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(10, 10, 30, 0.9);
                border: 1px solid #00ff88;
                border-radius: 8px;
                padding: 16px;
                color: #fff;
                font-size: 14px;
                z-index: 100;
            `;
            document.getElementById('scene-canvas-container')?.appendChild(panel);
        }

        // 统计活细胞数
        let aliveCount = 0;
        for (let x = 0; x < this.params.gridSize; x++) {
            for (let z = 0; z < this.params.gridSize; z++) {
                aliveCount += this.grid[x][z];
            }
        }

        panel.innerHTML = `
            <div style="color: #00ff88; font-size: 18px; margin-bottom: 8px;">
                <i class="fas fa-dna"></i> 生命游戏
            </div>
            <div style="display: flex; gap: 20px;">
                <div>
                    <div style="color: #666; font-size: 12px;">代数</div>
                    <div style="font-size: 20px; color: #4ecdc4;">${this.generation}</div>
                </div>
                <div>
                    <div style="color: #666; font-size: 12px;">存活细胞</div>
                    <div style="font-size: 20px; color: #00ff88;">${aliveCount}</div>
                </div>
            </div>
        `;
    }

    /**
     * 设置UI控制按钮
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-toggle-play">
                <i class="fas fa-play"></i> 开始
            </button>
            <button class="control-btn" id="btn-step">
                <i class="fas fa-step-forward"></i> 单步
            </button>
            <button class="control-btn" id="btn-pattern">
                <i class="fas fa-shapes"></i> 预设图案
            </button>
            <button class="control-btn" id="btn-random">
                <i class="fas fa-random"></i> 随机
            </button>
            <button class="control-btn" id="btn-clear">
                <i class="fas fa-eraser"></i> 清空
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        document.getElementById('btn-toggle-play').onclick = () => this.togglePlay();
        document.getElementById('btn-step').onclick = () => this.step();
        document.getElementById('btn-pattern').onclick = () => this.showPatternMenu();
        document.getElementById('btn-random').onclick = () => this.randomize();
        document.getElementById('btn-clear').onclick = () => this.clear();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    /**
     * 切换播放/暂停
     */
    togglePlay() {
        this.isPlaying = !this.isPlaying;
        const btn = document.getElementById('btn-toggle-play');
        btn.innerHTML = this.isPlaying
            ? '<i class="fas fa-pause"></i> 暂停'
            : '<i class="fas fa-play"></i> 开始';
    }

    /**
     * 显示图案菜单
     */
    showPatternMenu() {
        let menu = document.getElementById('pattern-menu');
        if (menu) {
            menu.remove();
            return;
        }

        menu = document.createElement('div');
        menu.id = 'pattern-menu';
        menu.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(10, 10, 30, 0.95);
            border: 1px solid #00ff88;
            border-radius: 12px;
            padding: 24px;
            z-index: 1000;
            min-width: 280px;
        `;

        menu.innerHTML = `
            <h3 style="color: #00ff88; margin-bottom: 20px;">
                <i class="fas fa-shapes"></i> 选择图案
            </h3>
            <div style="display: flex; flex-direction: column; gap: 10px;">
                <button class="pattern-btn" data-pattern="glider" style="padding: 12px; background: #1a3a2a; 
                    border: 1px solid #00ff88; color: #fff; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-paper-plane"></i> 滑翔机 (Glider)
                </button>
                <button class="pattern-btn" data-pattern="blinker" style="padding: 12px; background: #1a3a2a;
                    border: 1px solid #00ff88; color: #fff; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-minus"></i> 闪烁器 (Blinker)
                </button>
                <button class="pattern-btn" data-pattern="pulsar" style="padding: 12px; background: #1a3a2a;
                    border: 1px solid #00ff88; color: #fff; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-star"></i> 脉冲星 (Pulsar)
                </button>
                <button class="pattern-btn" data-pattern="glider-gun" style="padding: 12px; background: #1a3a2a;
                    border: 1px solid #00ff88; color: #fff; border-radius: 6px; cursor: pointer;">
                    <i class="fas fa-rocket"></i> 滑翔机枪 (Gosper Gun)
                </button>
            </div>
            <button id="pattern-close" style="width: 100%; margin-top: 15px; padding: 10px; 
                background: #333; border: none; color: #fff; border-radius: 6px; cursor: pointer;">
                关闭
            </button>
        `;

        document.body.appendChild(menu);

        // 绑定事件
        menu.querySelectorAll('.pattern-btn').forEach(btn => {
            btn.onclick = () => {
                this.clear();
                const pattern = btn.dataset.pattern;
                const center = Math.floor(this.params.gridSize / 2);

                switch (pattern) {
                    case 'glider':
                        this.placeGlider(center - 5, center - 5);
                        this.placeGlider(center + 5, center + 5);
                        break;
                    case 'blinker':
                        this.placeBlinker(center - 1, center);
                        this.placeBlinker(center + 5, center);
                        this.placeBlinker(center, center + 5);
                        break;
                    case 'pulsar':
                        this.placePulsar(center, center);
                        break;
                    case 'glider-gun':
                        this.placeGosperGun(5, center - 10);
                        break;
                }

                menu.remove();
                this.showGuide(`✨ 已放置 ${btn.textContent.trim()}`);
            };
        });

        document.getElementById('pattern-close').onclick = () => menu.remove();
    }

    /**
     * 放置Gosper滑翔机枪
     */
    placeGosperGun(startX, startZ) {
        const pattern = [
            [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
            [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3], [0, 4], [1, 4], [10, 4],
            [16, 4], [20, 4], [21, 4], [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5],
            [22, 5], [24, 5], [10, 6], [16, 6], [24, 6], [11, 7], [15, 7], [12, 8], [13, 8]
        ];

        pattern.forEach(([dx, dz]) => {
            this.setCell(startX + dx, startZ + dz, true);
        });
    }

    /**
     * 随机填充
     */
    randomize() {
        this.clear();
        const { gridSize } = this.params;
        const density = 0.25;  // 25%填充率

        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                if (Math.random() < density) {
                    this.setCell(x, z, true);
                }
            }
        }

        this.showGuide('🎲 已随机生成初始状态');
    }

    /**
     * 清空
     */
    clear() {
        const { gridSize } = this.params;
        for (let x = 0; x < gridSize; x++) {
            for (let z = 0; z < gridSize; z++) {
                this.setCell(x, z, false);
            }
        }
        this.generation = 0;
        this.updateInfoDisplay();
    }

    /**
     * 重置视角
     */
    resetView() {
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera.position, {
                x: this.defaultCameraPos.x,
                y: this.defaultCameraPos.y,
                z: this.defaultCameraPos.z,
                duration: 0.8,
                ease: 'power2.out'
            });
        } else {
            this.camera.position.set(
                this.defaultCameraPos.x,
                this.defaultCameraPos.y,
                this.defaultCameraPos.z
            );
        }
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 显示引导消息
     */
    showGuide(message) {
        const container = document.getElementById('scene-canvas-container');
        if (!container) return;

        const oldGuide = container.querySelector('.scene-guide-message');
        if (oldGuide) oldGuide.remove();

        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        guide.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 136, 0.15);
            border: 1px solid rgba(0, 255, 136, 0.3);
            padding: 12px 24px;
            border-radius: 8px;
            color: #00ff88;
            font-size: 14px;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s;
        `;
        container.appendChild(guide);

        setTimeout(() => guide.style.opacity = '1', 100);
        setTimeout(() => {
            guide.style.opacity = '0';
            setTimeout(() => guide.remove(), 300);
        }, 3000);
    }

    /**
     * 初始引导
     */
    showInitialGuide() {
        setTimeout(() => {
            this.showGuide('🎮 Conway生命游戏：4条简单规则创造生命');
        }, 1000);
        setTimeout(() => {
            this.showGuide('💡 点击"开始"观察细胞演化，或点击"预设图案"选择经典图形');
        }, 5000);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        if (!this.isPlaying) return;

        // 控制更新频率
        if (time - this.lastUpdate < this.params.speed) return;
        this.lastUpdate = time;

        this.step();
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return this.interactables;
    }

    /**
     * 清理场景
     */
    dispose() {
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
        }

        // 移除UI元素
        const infoPanel = document.getElementById('gol-info-panel');
        if (infoPanel) infoPanel.remove();

        const patternMenu = document.getElementById('pattern-menu');
        if (patternMenu) patternMenu.remove();
    }

    /**
     * 背景点击处理
     */
    onBackgroundClick() {
        const patternMenu = document.getElementById('pattern-menu');
        if (patternMenu) patternMenu.remove();
    }
};
