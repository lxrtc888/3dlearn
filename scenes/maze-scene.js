/**
 * 迷宫寻路算法可视化 3D教学场景 v2.0
 * ============================================
 * 四个机器人同时从四角出发，比赛到达中心终点
 * 
 * 算法列表：
 * 1. 右手法则 (Wall Following) - 最简单
 * 2. 深度优先搜索 (DFS) - 一条路走到黑
 * 3. 广度优先搜索 (BFS) - 水淹算法
 * 4. A* 算法 - 启发式搜索
 * 5. Dijkstra算法 - 最短路径经典
 * 6. 贪婪最佳优先 (Greedy) - 只看启发值
 * 7. 双向BFS - 两端同时搜索
 * 
 * 目标：直观对比不同算法的效率差异
 * ============================================
 */

class MazeScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'MazeScene';
        this.mainGroup = null;
        
        // 迷宫配置 - 大幅增加复杂度
        this.mazeSize = 41; // 41x41 迷宫
        this.cellSize = 0.5;
        this.maze = [];
        
        // 中心终点，四角入口
        this.center = { x: 20, z: 20 };
        this.corners = [
            { x: 1, z: 1, color: 0xff6b6b, name: '左上' },      // 红
            { x: 39, z: 1, color: 0x4ecdc4, name: '右上' },     // 青
            { x: 1, z: 39, color: 0x95e1d3, name: '左下' },     // 绿
            { x: 39, z: 39, color: 0xdda0dd, name: '右下' }     // 紫
        ];
        
        // 四个机器人
        this.robots = [];
        this.robotPaths = [[], [], [], []];
        this.robotStats = [{}, {}, {}, {}];
        
        // 可视化元素
        this.cells = [];
        this.pathLines = [];
        
        // 状态
        this.isRunning = false;
        this.isPaused = false;
        this.animationSpeed = 15; // 默认15ms，更快
        this.raceFinished = [false, false, false, false];
        
        // 算法配置
        this.algorithms = {
            righthand: { name: '右手法则', icon: '✋', complexity: 'O(n)', desc: '沿右墙走' },
            dfs: { name: 'DFS深度优先', icon: '🔍', complexity: 'O(V+E)', desc: '一路到黑' },
            bfs: { name: 'BFS水淹', icon: '🌊', complexity: 'O(V+E)', desc: '同时扩散' },
            astar: { name: 'A*算法', icon: '⭐', complexity: 'O(E log V)', desc: '启发搜索' },
            dijkstra: { name: 'Dijkstra', icon: '📍', complexity: 'O(V²)', desc: '最短路径' },
            greedy: { name: '贪婪优先', icon: '🎯', complexity: 'O(V log V)', desc: '只看距离' },
            bidirectional: { name: '双向BFS', icon: '↔️', complexity: 'O(b^(d/2))', desc: '两端搜索' }
        };
        
        // 每个角落当前选择的算法
        this.cornerAlgorithms = ['bfs', 'astar', 'dfs', 'greedy'];
        
        // 颜色配置
        this.colors = {
            wall: 0x1a2530,
            floor: 0x0d1520,
            center: 0xf1c40f,
            explored: [0xff6b6b, 0x4ecdc4, 0x95e1d3, 0xdda0dd],
            path: [0xff0000, 0x00ffff, 0x00ff00, 0xff00ff]
        };
    }

    init() {
        this.scene.background = new THREE.Color(0x050a10);
        this.scene.fog = new THREE.FogExp2(0x050a10, 0.02);
        
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        this.setupEnvironment();
        this.setupLighting();
        this.generateMaze();
        this.createMazeVisualization();
        this.createRobots();
        this.createInfoPanel();
        
        if (this.camera) {
            this.camera.position.set(0, 30, 25);
            this.camera.lookAt(0, 0, 0);
        }
        
        this.setupUI();
        console.log('MazeScene v2.0 initialized - 41x41 maze with 4 robots');
    }

    setupEnvironment() {
        const groundGeo = new THREE.PlaneGeometry(50, 50);
        const groundMat = new THREE.MeshStandardMaterial({ color: 0x050810, roughness: 0.95 });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        this.mainGroup.add(ground);
    }

    setupLighting() {
        const ambient = new THREE.AmbientLight(0x303050, 0.4);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
        mainLight.position.set(20, 40, 20);
        this.scene.add(mainLight);
        
        // 中心终点金色光
        const centerLight = new THREE.PointLight(0xf1c40f, 2, 15);
        centerLight.position.set(0, 3, 0);
        this.centerLight = centerLight;
        this.mainGroup.add(centerLight);
        
        // 四角起点光
        this.corners.forEach((corner, i) => {
            const light = new THREE.PointLight(corner.color, 0.8, 8);
            const offset = this.mazeSize / 2;
            light.position.set(
                (corner.x - offset) * this.cellSize,
                2,
                (corner.z - offset) * this.cellSize
            );
            this.mainGroup.add(light);
        });
    }

    /**
     * 生成复杂迷宫（递归分割法 + 保证四角到中心连通）
     */
    generateMaze() {
        const size = this.mazeSize;
        
        // 初始化全是墙
        this.maze = Array(size).fill(null).map(() => Array(size).fill(1));
        
        // 递归回溯法生成
        const carve = (x, z) => {
            this.maze[z][x] = 0;
            
            const directions = [
                { dx: 0, dz: -2 },
                { dx: 2, dz: 0 },
                { dx: 0, dz: 2 },
                { dx: -2, dz: 0 }
            ].sort(() => Math.random() - 0.5);
            
            for (const { dx, dz } of directions) {
                const nx = x + dx;
                const nz = z + dz;
                
                if (nx > 0 && nx < size - 1 && nz > 0 && nz < size - 1 && this.maze[nz][nx] === 1) {
                    this.maze[z + dz / 2][x + dx / 2] = 0;
                    carve(nx, nz);
                }
            }
        };
        
        carve(1, 1);
        
        // 确保四角和中心是通路
        const center = Math.floor(size / 2);
        this.maze[center][center] = 0;
        
        // 打通中心周围
        for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
                const x = center + dx;
                const z = center + dz;
                if (x > 0 && x < size - 1 && z > 0 && z < size - 1) {
                    if (Math.abs(dx) + Math.abs(dz) <= 2) {
                        this.maze[z][x] = 0;
                    }
                }
            }
        }
        
        // 确保四角是通路
        this.corners.forEach(corner => {
            this.maze[corner.z][corner.x] = 0;
            // 打通周围一格
            if (corner.x + 1 < size) this.maze[corner.z][corner.x + 1] = 0;
            if (corner.z + 1 < size) this.maze[corner.z + 1][corner.x] = 0;
        });
        
        // 增加一些随机通道使迷宫更复杂但有多解
        for (let i = 0; i < size * 2; i++) {
            const x = Math.floor(Math.random() * (size - 2)) + 1;
            const z = Math.floor(Math.random() * (size - 2)) + 1;
            if (this.maze[z][x] === 1 && Math.random() < 0.3) {
                // 检查周围有通路才打通
                const neighbors = [
                    this.maze[z - 1]?.[x] || 1,
                    this.maze[z + 1]?.[x] || 1,
                    this.maze[z]?.[x - 1] || 1,
                    this.maze[z]?.[x + 1] || 1
                ];
                if (neighbors.filter(n => n === 0).length >= 2) {
                    this.maze[z][x] = 0;
                }
            }
        }
        
        this.center = { x: center, z: center };
    }

    createMazeVisualization() {
        this.cells = [];
        const offset = this.mazeSize / 2;
        const size = this.mazeSize;
        
        // 合并墙壁几何体以提高性能
        const wallGeo = new THREE.BoxGeometry(this.cellSize, 0.8, this.cellSize);
        const wallMat = new THREE.MeshPhongMaterial({
            color: this.colors.wall,
            emissive: 0x0a1015,
            emissiveIntensity: 0.3
        });
        
        const floorGeo = new THREE.BoxGeometry(this.cellSize * 0.92, 0.05, this.cellSize * 0.92);
        
        for (let z = 0; z < size; z++) {
            this.cells[z] = [];
            for (let x = 0; x < size; x++) {
                const posX = (x - offset) * this.cellSize;
                const posZ = (z - offset) * this.cellSize;
                
                if (this.maze[z][x] === 1) {
                    const wall = new THREE.Mesh(wallGeo, wallMat);
                    wall.position.set(posX, 0.4, posZ);
                    this.mainGroup.add(wall);
                    this.cells[z][x] = { type: 'wall', mesh: wall };
                } else {
                    // 地板
                    let floorColor = this.colors.floor;
                    let emissiveIntensity = 0.1;
                    
                    // 中心终点
                    if (x === this.center.x && z === this.center.z) {
                        floorColor = this.colors.center;
                        emissiveIntensity = 0.6;
                    }
                    
                    // 四角起点
                    const cornerIdx = this.corners.findIndex(c => c.x === x && c.z === z);
                    if (cornerIdx >= 0) {
                        floorColor = this.corners[cornerIdx].color;
                        emissiveIntensity = 0.5;
                    }
                    
                    const floorMat = new THREE.MeshPhongMaterial({
                        color: floorColor,
                        emissive: floorColor,
                        emissiveIntensity: emissiveIntensity
                    });
                    
                    const floor = new THREE.Mesh(floorGeo, floorMat);
                    floor.position.set(posX, 0.025, posZ);
                    this.mainGroup.add(floor);
                    
                    this.cells[z][x] = {
                        type: 'floor',
                        mesh: floor,
                        originalColor: floorColor,
                        robotVisited: [-1, -1, -1, -1] // 记录哪个机器人访问过
                    };
                }
            }
        }
        
        // 中心终点标记
        const centerMarker = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 0.3, 32),
            new THREE.MeshPhongMaterial({
                color: 0xf1c40f,
                emissive: 0xf1c40f,
                emissiveIntensity: 0.8
            })
        );
        centerMarker.position.set(0, 0.2, 0);
        this.mainGroup.add(centerMarker);
        this.centerMarker = centerMarker;
    }

    createRobots() {
        this.robots = [];
        const offset = this.mazeSize / 2;
        
        this.corners.forEach((corner, i) => {
            const robotGroup = new THREE.Group();
            
            // 机器人身体
            const bodyGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.3, 12);
            const bodyMat = new THREE.MeshPhongMaterial({
                color: corner.color,
                emissive: corner.color,
                emissiveIntensity: 0.6
            });
            const body = new THREE.Mesh(bodyGeo, bodyMat);
            body.position.y = 0.2;
            robotGroup.add(body);
            
            // 头部光点
            const headGeo = new THREE.SphereGeometry(0.1, 12, 12);
            const headMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
            const head = new THREE.Mesh(headGeo, headMat);
            head.position.y = 0.4;
            robotGroup.add(head);
            
            // 光晕
            const glowGeo = new THREE.RingGeometry(0.25, 0.35, 24);
            const glowMat = new THREE.MeshBasicMaterial({
                color: corner.color,
                transparent: true,
                opacity: 0.4,
                side: THREE.DoubleSide
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.rotation.x = -Math.PI / 2;
            glow.position.y = 0.05;
            robotGroup.add(glow);
            
            robotGroup.position.set(
                (corner.x - offset) * this.cellSize,
                0,
                (corner.z - offset) * this.cellSize
            );
            
            robotGroup.userData = {
                cornerIndex: i,
                currentX: corner.x,
                currentZ: corner.z,
                glow: glow
            };
            
            this.robots.push(robotGroup);
            this.mainGroup.add(robotGroup);
        });
    }

    /**
     * 设置格子颜色（带机器人索引）
     */
    setCellColor(x, z, robotIndex, colorType) {
        const cell = this.cells[z]?.[x];
        if (!cell || cell.type === 'wall') return;
        
        // 不改变终点和起点颜色
        if (x === this.center.x && z === this.center.z) return;
        if (this.corners.some(c => c.x === x && c.z === z)) return;
        
        const baseColor = this.corners[robotIndex].color;
        let color = baseColor;
        let intensity = 0.3;
        
        if (colorType === 'exploring') {
            intensity = 0.5;
        } else if (colorType === 'path') {
            color = this.colors.path[robotIndex];
            intensity = 0.7;
        }
        
        // 只有当这个机器人是第一个访问时才改色
        if (cell.robotVisited[robotIndex] === -1) {
            cell.robotVisited[robotIndex] = 1;
            
            // 混合颜色：如果多个机器人访问过
            const visitCount = cell.robotVisited.filter(v => v === 1).length;
            if (visitCount === 1) {
                cell.mesh.material.color.setHex(color);
                cell.mesh.material.emissive.setHex(color);
                cell.mesh.material.emissiveIntensity = intensity * 0.5;
            }
        }
    }

    /**
     * 高亮最终路径
     */
    highlightPath(robotIndex, path) {
        const pathColor = this.colors.path[robotIndex];
        
        path.forEach((pos, i) => {
            const cell = this.cells[pos.z]?.[pos.x];
            if (cell && cell.type === 'floor') {
                setTimeout(() => {
                    cell.mesh.material.color.setHex(pathColor);
                    cell.mesh.material.emissive.setHex(pathColor);
                    cell.mesh.material.emissiveIntensity = 0.8;
                    
                    gsap.to(cell.mesh.position, {
                        y: 0.08,
                        duration: 0.15
                    });
                }, i * 10);
            }
        });
    }

    /**
     * 移动机器人
     */
    moveRobot(robotIndex, x, z) {
        const robot = this.robots[robotIndex];
        const offset = this.mazeSize / 2;
        
        gsap.to(robot.position, {
            x: (x - offset) * this.cellSize,
            z: (z - offset) * this.cellSize,
            duration: this.animationSpeed / 1000,
            ease: 'none'
        });
        
        robot.userData.currentX = x;
        robot.userData.currentZ = z;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms || this.animationSpeed));
    }

    // ==================== 算法实现 ====================

    /**
     * 右手法则
     */
    async runRightHand(robotIndex) {
        const corner = this.corners[robotIndex];
        let x = corner.x, z = corner.z;
        let dir = robotIndex < 2 ? 2 : 0; // 初始方向朝向中心
        
        const directions = [
            { dx: 0, dz: -1 }, { dx: 1, dz: 0 },
            { dx: 0, dz: 1 }, { dx: -1, dz: 0 }
        ];
        
        const visited = new Set();
        const path = [];
        let steps = 0;
        
        while (!(x === this.center.x && z === this.center.z)) {
            if (!this.isRunning || this.raceFinished[robotIndex]) return null;
            while (this.isPaused) await this.delay(50);
            
            const key = `${x},${z}`;
            if (!visited.has(key)) {
                visited.add(key);
                this.setCellColor(x, z, robotIndex, 'exploring');
            }
            path.push({ x, z });
            steps++;
            
            this.moveRobot(robotIndex, x, z);
            await this.delay();
            
            const tryOrder = [(dir + 1) % 4, dir, (dir + 3) % 4, (dir + 2) % 4];
            let moved = false;
            
            for (const newDir of tryOrder) {
                const nx = x + directions[newDir].dx;
                const nz = z + directions[newDir].dz;
                
                if (this.isValidCell(nx, nz)) {
                    dir = newDir;
                    x = nx;
                    z = nz;
                    moved = true;
                    break;
                }
            }
            
            if (!moved) break;
            this.updateRobotStats(robotIndex, visited.size, steps);
        }
        
        path.push({ x: this.center.x, z: this.center.z });
        this.moveRobot(robotIndex, this.center.x, this.center.z);
        return { path, explored: visited.size, steps };
    }

    /**
     * DFS深度优先
     */
    async runDFS(robotIndex) {
        const corner = this.corners[robotIndex];
        const visited = new Set();
        let steps = 0;
        let foundPath = null;
        
        const search = async (x, z, path) => {
            if (!this.isRunning || this.raceFinished[robotIndex] || foundPath) return false;
            while (this.isPaused) await this.delay(50);
            
            const key = `${x},${z}`;
            if (visited.has(key)) return false;
            
            visited.add(key);
            steps++;
            this.setCellColor(x, z, robotIndex, 'exploring');
            this.moveRobot(robotIndex, x, z);
            await this.delay();
            this.updateRobotStats(robotIndex, visited.size, steps);
            
            if (x === this.center.x && z === this.center.z) {
                foundPath = [...path, { x, z }];
                return true;
            }
            
            const directions = [
                { dx: 0, dz: -1 }, { dx: 1, dz: 0 },
                { dx: 0, dz: 1 }, { dx: -1, dz: 0 }
            ];
            
            for (const { dx, dz } of directions) {
                const nx = x + dx, nz = z + dz;
                if (this.isValidCell(nx, nz) && !visited.has(`${nx},${nz}`)) {
                    if (await search(nx, nz, [...path, { x, z }])) return true;
                }
            }
            return false;
        };
        
        await search(corner.x, corner.z, []);
        return foundPath ? { path: foundPath, explored: visited.size, steps } : null;
    }

    /**
     * BFS水淹算法
     */
    async runBFS(robotIndex) {
        const corner = this.corners[robotIndex];
        const queue = [{ x: corner.x, z: corner.z, path: [] }];
        const visited = new Set([`${corner.x},${corner.z}`]);
        let steps = 0;
        
        const directions = [
            { dx: 0, dz: -1 }, { dx: 1, dz: 0 },
            { dx: 0, dz: 1 }, { dx: -1, dz: 0 }
        ];
        
        while (queue.length > 0) {
            if (!this.isRunning || this.raceFinished[robotIndex]) return null;
            while (this.isPaused) await this.delay(50);
            
            // 批量处理一层
            const levelSize = Math.min(queue.length, 5);
            for (let i = 0; i < levelSize && queue.length > 0; i++) {
                const { x, z, path } = queue.shift();
                steps++;
                
                this.setCellColor(x, z, robotIndex, 'exploring');
                this.moveRobot(robotIndex, x, z);
                
                if (x === this.center.x && z === this.center.z) {
                    return { path: [...path, { x, z }], explored: visited.size, steps };
                }
                
                for (const { dx, dz } of directions) {
                    const nx = x + dx, nz = z + dz;
                    const key = `${nx},${nz}`;
                    
                    if (this.isValidCell(nx, nz) && !visited.has(key)) {
                        visited.add(key);
                        queue.push({ x: nx, z: nz, path: [...path, { x, z }] });
                    }
                }
            }
            
            await this.delay();
            this.updateRobotStats(robotIndex, visited.size, steps);
        }
        return null;
    }

    /**
     * A*算法
     */
    async runAStar(robotIndex) {
        const corner = this.corners[robotIndex];
        const heuristic = (x, z) => Math.abs(x - this.center.x) + Math.abs(z - this.center.z);
        
        const openSet = [{ 
            x: corner.x, z: corner.z, 
            g: 0, f: heuristic(corner.x, corner.z), 
            path: [] 
        }];
        const closedSet = new Set();
        const gScores = { [`${corner.x},${corner.z}`]: 0 };
        let steps = 0;
        
        const directions = [
            { dx: 0, dz: -1 }, { dx: 1, dz: 0 },
            { dx: 0, dz: 1 }, { dx: -1, dz: 0 }
        ];
        
        while (openSet.length > 0) {
            if (!this.isRunning || this.raceFinished[robotIndex]) return null;
            while (this.isPaused) await this.delay(50);
            
            openSet.sort((a, b) => a.f - b.f);
            const current = openSet.shift();
            const { x, z, g, path } = current;
            const key = `${x},${z}`;
            
            if (closedSet.has(key)) continue;
            closedSet.add(key);
            steps++;
            
            this.setCellColor(x, z, robotIndex, 'exploring');
            this.moveRobot(robotIndex, x, z);
            await this.delay();
            this.updateRobotStats(robotIndex, closedSet.size, steps);
            
            if (x === this.center.x && z === this.center.z) {
                return { path: [...path, { x, z }], explored: closedSet.size, steps };
            }
            
            for (const { dx, dz } of directions) {
                const nx = x + dx, nz = z + dz;
                const nkey = `${nx},${nz}`;
                
                if (this.isValidCell(nx, nz) && !closedSet.has(nkey)) {
                    const newG = g + 1;
                    if (gScores[nkey] === undefined || newG < gScores[nkey]) {
                        gScores[nkey] = newG;
                        openSet.push({ 
                            x: nx, z: nz, 
                            g: newG, f: newG + heuristic(nx, nz), 
                            path: [...path, { x, z }] 
                        });
                    }
                }
            }
        }
        return null;
    }

    /**
     * Dijkstra算法
     */
    async runDijkstra(robotIndex) {
        const corner = this.corners[robotIndex];
        const dist = {};
        const prev = {};
        const unvisited = new Set();
        let steps = 0;
        
        // 初始化
        for (let z = 0; z < this.mazeSize; z++) {
            for (let x = 0; x < this.mazeSize; x++) {
                if (this.maze[z][x] === 0) {
                    const key = `${x},${z}`;
                    dist[key] = Infinity;
                    unvisited.add(key);
                }
            }
        }
        dist[`${corner.x},${corner.z}`] = 0;
        
        const directions = [
            { dx: 0, dz: -1 }, { dx: 1, dz: 0 },
            { dx: 0, dz: 1 }, { dx: -1, dz: 0 }
        ];
        
        while (unvisited.size > 0) {
            if (!this.isRunning || this.raceFinished[robotIndex]) return null;
            while (this.isPaused) await this.delay(50);
            
            // 找最小距离节点
            let minDist = Infinity, minKey = null;
            for (const key of unvisited) {
                if (dist[key] < minDist) {
                    minDist = dist[key];
                    minKey = key;
                }
            }
            
            if (!minKey || minDist === Infinity) break;
            
            const [x, z] = minKey.split(',').map(Number);
            unvisited.delete(minKey);
            steps++;
            
            this.setCellColor(x, z, robotIndex, 'exploring');
            this.moveRobot(robotIndex, x, z);
            
            if (steps % 3 === 0) {
                await this.delay();
                this.updateRobotStats(robotIndex, steps, steps);
            }
            
            if (x === this.center.x && z === this.center.z) {
                // 回溯路径
                const path = [];
                let curr = minKey;
                while (curr) {
                    const [cx, cz] = curr.split(',').map(Number);
                    path.unshift({ x: cx, z: cz });
                    curr = prev[curr];
                }
                return { path, explored: steps, steps };
            }
            
            for (const { dx, dz } of directions) {
                const nx = x + dx, nz = z + dz;
                const nkey = `${nx},${nz}`;
                
                if (unvisited.has(nkey)) {
                    const alt = dist[minKey] + 1;
                    if (alt < dist[nkey]) {
                        dist[nkey] = alt;
                        prev[nkey] = minKey;
                    }
                }
            }
        }
        return null;
    }

    /**
     * 贪婪最佳优先搜索
     */
    async runGreedy(robotIndex) {
        const corner = this.corners[robotIndex];
        const heuristic = (x, z) => Math.abs(x - this.center.x) + Math.abs(z - this.center.z);
        
        const openSet = [{ x: corner.x, z: corner.z, h: heuristic(corner.x, corner.z), path: [] }];
        const visited = new Set([`${corner.x},${corner.z}`]);
        let steps = 0;
        
        const directions = [
            { dx: 0, dz: -1 }, { dx: 1, dz: 0 },
            { dx: 0, dz: 1 }, { dx: -1, dz: 0 }
        ];
        
        while (openSet.length > 0) {
            if (!this.isRunning || this.raceFinished[robotIndex]) return null;
            while (this.isPaused) await this.delay(50);
            
            openSet.sort((a, b) => a.h - b.h);
            const current = openSet.shift();
            const { x, z, path } = current;
            steps++;
            
            this.setCellColor(x, z, robotIndex, 'exploring');
            this.moveRobot(robotIndex, x, z);
            await this.delay();
            this.updateRobotStats(robotIndex, visited.size, steps);
            
            if (x === this.center.x && z === this.center.z) {
                return { path: [...path, { x, z }], explored: visited.size, steps };
            }
            
            for (const { dx, dz } of directions) {
                const nx = x + dx, nz = z + dz;
                const key = `${nx},${nz}`;
                
                if (this.isValidCell(nx, nz) && !visited.has(key)) {
                    visited.add(key);
                    openSet.push({ x: nx, z: nz, h: heuristic(nx, nz), path: [...path, { x, z }] });
                }
            }
        }
        return null;
    }

    /**
     * 双向BFS
     */
    async runBidirectional(robotIndex) {
        const corner = this.corners[robotIndex];
        
        const frontQueue = [{ x: corner.x, z: corner.z, path: [{ x: corner.x, z: corner.z }] }];
        const backQueue = [{ x: this.center.x, z: this.center.z, path: [{ x: this.center.x, z: this.center.z }] }];
        
        const frontVisited = new Map([[`${corner.x},${corner.z}`, [{ x: corner.x, z: corner.z }]]]);
        const backVisited = new Map([[`${this.center.x},${this.center.z}`, [{ x: this.center.x, z: this.center.z }]]]);
        
        let steps = 0;
        const directions = [
            { dx: 0, dz: -1 }, { dx: 1, dz: 0 },
            { dx: 0, dz: 1 }, { dx: -1, dz: 0 }
        ];
        
        while (frontQueue.length > 0 || backQueue.length > 0) {
            if (!this.isRunning || this.raceFinished[robotIndex]) return null;
            while (this.isPaused) await this.delay(50);
            
            // 前向扩展
            if (frontQueue.length > 0) {
                const { x, z, path } = frontQueue.shift();
                steps++;
                this.setCellColor(x, z, robotIndex, 'exploring');
                
                for (const { dx, dz } of directions) {
                    const nx = x + dx, nz = z + dz;
                    const key = `${nx},${nz}`;
                    
                    if (this.isValidCell(nx, nz) && !frontVisited.has(key)) {
                        const newPath = [...path, { x: nx, z: nz }];
                        frontVisited.set(key, newPath);
                        frontQueue.push({ x: nx, z: nz, path: newPath });
                        
                        // 检查是否相遇
                        if (backVisited.has(key)) {
                            const backPath = backVisited.get(key);
                            const fullPath = [...newPath, ...backPath.slice(1).reverse()];
                            return { path: fullPath, explored: frontVisited.size + backVisited.size, steps };
                        }
                    }
                }
            }
            
            // 后向扩展
            if (backQueue.length > 0) {
                const { x, z, path } = backQueue.shift();
                steps++;
                
                for (const { dx, dz } of directions) {
                    const nx = x + dx, nz = z + dz;
                    const key = `${nx},${nz}`;
                    
                    if (this.isValidCell(nx, nz) && !backVisited.has(key)) {
                        const newPath = [...path, { x: nx, z: nz }];
                        backVisited.set(key, newPath);
                        backQueue.push({ x: nx, z: nz, path: newPath });
                        
                        if (frontVisited.has(key)) {
                            const frontPath = frontVisited.get(key);
                            const fullPath = [...frontPath, ...newPath.slice(1).reverse()];
                            return { path: fullPath, explored: frontVisited.size + backVisited.size, steps };
                        }
                    }
                }
            }
            
            this.moveRobot(robotIndex, frontQueue[0]?.x || corner.x, frontQueue[0]?.z || corner.z);
            await this.delay();
            this.updateRobotStats(robotIndex, frontVisited.size + backVisited.size, steps);
        }
        return null;
    }

    isValidCell(x, z) {
        return x >= 0 && x < this.mazeSize && z >= 0 && z < this.mazeSize && this.maze[z][x] === 0;
    }

    updateRobotStats(robotIndex, explored, steps) {
        this.robotStats[robotIndex] = { explored, steps };
        this.updateInfoPanel();
    }

    /**
     * 开始比赛
     */
    async startRace() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.raceFinished = [false, false, false, false];
        this.robotStats = [{}, {}, {}, {}];
        
        // 重置
        this.resetVisualization();
        
        this.showGuide('🏁 比赛开始！四个机器人同时出发！');
        
        // 同时启动四个算法
        const races = this.corners.map((corner, i) => {
            const algo = this.cornerAlgorithms[i];
            return this.runAlgorithm(i, algo);
        });
        
        const results = await Promise.all(races);
        
        // 显示结果
        let winner = -1;
        let minPath = Infinity;
        results.forEach((result, i) => {
            if (result && result.path.length < minPath) {
                minPath = result.path.length;
                winner = i;
            }
            if (result) {
                this.highlightPath(i, result.path);
            }
        });
        
        if (winner >= 0) {
            const algoName = this.algorithms[this.cornerAlgorithms[winner]].name;
            this.showGuide(`🏆 ${this.corners[winner].name} (${algoName}) 获胜！路径长度: ${minPath}`);
        }
        
        this.isRunning = false;
    }

    async runAlgorithm(robotIndex, algoName) {
        switch (algoName) {
            case 'righthand': return await this.runRightHand(robotIndex);
            case 'dfs': return await this.runDFS(robotIndex);
            case 'bfs': return await this.runBFS(robotIndex);
            case 'astar': return await this.runAStar(robotIndex);
            case 'dijkstra': return await this.runDijkstra(robotIndex);
            case 'greedy': return await this.runGreedy(robotIndex);
            case 'bidirectional': return await this.runBidirectional(robotIndex);
            default: return await this.runBFS(robotIndex);
        }
    }

    resetVisualization() {
        // 重置机器人位置
        const offset = this.mazeSize / 2;
        this.corners.forEach((corner, i) => {
            this.robots[i].position.set(
                (corner.x - offset) * this.cellSize,
                0,
                (corner.z - offset) * this.cellSize
            );
        });
        
        // 重置格子颜色
        for (let z = 0; z < this.mazeSize; z++) {
            for (let x = 0; x < this.mazeSize; x++) {
                const cell = this.cells[z]?.[x];
                if (cell && cell.type === 'floor') {
                    cell.robotVisited = [-1, -1, -1, -1];
                    
                    if (x === this.center.x && z === this.center.z) {
                        cell.mesh.material.color.setHex(this.colors.center);
                        cell.mesh.material.emissive.setHex(this.colors.center);
                    } else if (this.corners.some(c => c.x === x && c.z === z)) {
                        const corner = this.corners.find(c => c.x === x && c.z === z);
                        cell.mesh.material.color.setHex(corner.color);
                        cell.mesh.material.emissive.setHex(corner.color);
                    } else {
                        cell.mesh.material.color.setHex(this.colors.floor);
                        cell.mesh.material.emissive.setHex(this.colors.floor);
                        cell.mesh.material.emissiveIntensity = 0.1;
                    }
                    cell.mesh.position.y = 0.025;
                }
            }
        }
    }

    regenerateMaze() {
        this.isRunning = false;
        
        // 清除旧迷宫
        this.cells.flat().forEach(cell => {
            if (cell && cell.mesh) this.mainGroup.remove(cell.mesh);
        });
        if (this.centerMarker) this.mainGroup.remove(this.centerMarker);
        
        this.generateMaze();
        this.createMazeVisualization();
        this.resetVisualization();
        this.robotStats = [{}, {}, {}, {}];
        this.updateInfoPanel();
    }

    createInfoPanel() {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        const panel = document.createElement('div');
        panel.id = 'maze-info-panel';
        panel.className = 'maze-info-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <i class="fas fa-route"></i>
                <span>迷宫寻路比赛</span>
                <button class="panel-close-btn" id="maze-panel-close" title="关闭">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="race-grid">
                ${this.corners.map((corner, i) => `
                    <div class="racer-card" style="border-color: #${corner.color.toString(16).padStart(6, '0')}">
                        <div class="racer-header">
                            <span class="racer-color" style="background: #${corner.color.toString(16).padStart(6, '0')}"></span>
                            <span class="racer-name">${corner.name}</span>
                        </div>
                        <div class="racer-algo" id="racer-algo-${i}">${this.algorithms[this.cornerAlgorithms[i]].icon} ${this.algorithms[this.cornerAlgorithms[i]].name}</div>
                        <div class="racer-stats">
                            <span>探索: <b id="racer-explored-${i}">0</b></span>
                            <span>步数: <b id="racer-steps-${i}">0</b></span>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="legend-compact">
                <span>🟡 终点(中心)</span>
                <span>🔴🔵🟢🟣 四角起点</span>
            </div>
        `;
        container.appendChild(panel);
        
        // 绑定关闭按钮事件
        document.getElementById('maze-panel-close')?.addEventListener('click', () => {
            panel.style.display = 'none';
        });
    }

    updateInfoPanel() {
        this.robotStats.forEach((stats, i) => {
            const exploredEl = document.getElementById(`racer-explored-${i}`);
            const stepsEl = document.getElementById(`racer-steps-${i}`);
            if (exploredEl) exploredEl.textContent = stats.explored || 0;
            if (stepsEl) stepsEl.textContent = stats.steps || 0;
        });
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="maze-controls">
                <div class="control-group algo-selectors">
                    <label>四角算法选择</label>
                    <div class="corner-algos">
                        ${this.corners.map((corner, i) => `
                            <div class="corner-algo-select">
                                <span class="corner-dot" style="background: #${corner.color.toString(16).padStart(6, '0')}"></span>
                                <select id="algo-select-${i}" class="algo-select-mini">
                                    ${Object.entries(this.algorithms).map(([key, algo]) => 
                                        `<option value="${key}" ${this.cornerAlgorithms[i] === key ? 'selected' : ''}>${algo.icon} ${algo.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="control-group">
                    <label>速度</label>
                    <div class="speed-control">
                        <input type="range" id="maze-speed" min="5" max="100" value="${this.animationSpeed}">
                        <span id="maze-speed-display">${this.animationSpeed}ms</span>
                    </div>
                </div>
                <div class="control-group buttons">
                    <button class="action-btn primary" id="btn-start-race">
                        <i class="fas fa-flag-checkered"></i> 开始比赛
                    </button>
                    <button class="action-btn" id="btn-new-maze">
                        <i class="fas fa-sync"></i> 新迷宫
                    </button>
                </div>
            </div>
        `;
        
        // 绑定算法选择
        this.corners.forEach((_, i) => {
            document.getElementById(`algo-select-${i}`)?.addEventListener('change', (e) => {
                this.cornerAlgorithms[i] = e.target.value;
                const algo = this.algorithms[e.target.value];
                document.getElementById(`racer-algo-${i}`).textContent = `${algo.icon} ${algo.name}`;
            });
        });
        
        // 速度控制
        document.getElementById('maze-speed')?.addEventListener('input', (e) => {
            this.animationSpeed = parseInt(e.target.value);
            document.getElementById('maze-speed-display').textContent = `${this.animationSpeed}ms`;
        });
        
        document.getElementById('btn-start-race')?.addEventListener('click', () => {
            this.startRace();
        });
        
        document.getElementById('btn-new-maze')?.addEventListener('click', () => {
            this.regenerateMaze();
        });
    }

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
        }, 3500);
    }

    startAutoPlay() {
        setTimeout(() => {
            this.showGuide('🗺️ 41×41迷宫！四个机器人比赛到达中心！');
        }, 500);
    }

    animate(time, delta) {
        // 中心终点脉动
        if (this.centerLight) {
            this.centerLight.intensity = 1.5 + Math.sin(time * 4) * 0.5;
        }
        if (this.centerMarker) {
            this.centerMarker.rotation.y = time;
        }
        
        // 机器人光晕旋转
        this.robots.forEach(robot => {
            if (robot.userData.glow) {
                robot.userData.glow.rotation.z = time * 3;
            }
        });
    }

    getInteractables() {
        return this.cells.flat().filter(c => c && c.mesh).map(c => c.mesh);
    }

    dispose() {
        this.isRunning = false;
        const panel = document.getElementById('maze-info-panel');
        if (panel) panel.remove();
    }
}

window.MazeScene = MazeScene;
