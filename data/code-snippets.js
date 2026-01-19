/**
 * 代码片段数据
 * ============================================
 * 用于"后台代码"视图的演示代码
 * 每个key对应 cases-config.js 中的案例 id
 * ============================================
 */

window.CodeSnippets = {
    attention: `class SelfAttention {
    /**
     * 自注意力机制计算
     * Attention(Q, K, V) = softmax(QK^T / √d_k) × V
     */
    forward(inputEmbedding) {
        // 1. 线性变换生成 Q, K, V
        const Q = inputEmbedding.matmul(this.Wq); // Query
        const K = inputEmbedding.matmul(this.Wk); // Key  
        const V = inputEmbedding.matmul(this.Wv); // Value

        // 2. 计算注意力分数
        const d_k = K.shape[-1];
        const scores = Q.matmul(K.T) / Math.sqrt(d_k);
        
        // 3. Softmax 归一化
        const weights = softmax(scores); // 每行和为1
        
        // 4. 加权求和
        const output = weights.matmul(V);
        
        return output; // 融合了上下文信息的新表示
    }
}`,

    engine: `class CyberEngine extends HolographicScene {
    init() {
        // 1. 初始化 V6 气缸矩阵
        const block = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 3), 
            Materials.CyberMetal
        );
        
        // 2. 注入等离子燃烧模拟
        this.pistons.forEach(p => {
            p.add(new PlasmaGlow({ color: 0xff3366 }));
        });

        // 3. 启动曲轴物理约束
        this.physics.addConstraint(crankshaft, connectingRod);
        
        console.log("Engine Started. RPM: 8000");
    }
}`,

    quantum: `function simulateDoubleSlit() {
    // 双缝干涉 - 观察者效应模拟
    
    // 1. 粒子源
    const emitter = new ElectronGun({ rate: 100 });
    
    // 2. 坍缩逻辑 (The Aha Moment)
    if (observer.isActive) {
        // 观察者存在 -> 波函数坍缩 -> 粒子性
        particles.trajectory = Trajectory.LINEAR;
        screen.pattern = Patterns.TWO_BANDS;
    } else {
        // 无观察者 -> 波动性 -> 干涉条纹
        particles.trajectory = Trajectory.WAVE;
        screen.pattern = Patterns.INTERFERENCE;
    }
    
    renderer.render(scene, camera);
}`,

    hydraulic: `function initHydraulicScene() {
    // 帕斯卡定律可视化
    
    // F1/A1 = F2/A2
    const forceInput = new Vector3(0, -10, 0);
    const pressure = forceInput.length() / areaSmall;
    
    // 实时流体动力学
    fluid.updateMesh(pressure);
    
    // 机械传动反馈
    largePiston.position.y += (smallPiston.deltaY / ratio);
}`,

    pendulum: `function pendulumPeriod(length, gravity = 9.8) {
    // 单摆周期：T = 2π√(L/g)
    return 2 * Math.PI * Math.sqrt(length / gravity);
}

// 小角度近似下的角位移
function pendulumAngle(theta0, time, length) {
    const omega = Math.sqrt(9.8 / length);
    return theta0 * Math.cos(omega * time);
}`,

    electromagnetic: `function inducedEMF(fluxNow, fluxPrev, dt) {
    // 法拉第定律：ε = -dΦ/dt
    return -(fluxNow - fluxPrev) / dt;
}

function lenzDirection(deltaFlux) {
    // 楞次定律：阻碍磁通量变化
    return deltaFlux > 0 ? '产生反向磁场' : '产生同向磁场';
}`,

    cell: `class CellOrganelle {
    constructor(name, role) {
        this.name = name;
        this.role = role;
    }
}

const mitochondria = new CellOrganelle('线粒体', '能量工厂');
const nucleus = new CellOrganelle('细胞核', '遗传信息中心');`,

    dna: `const basePairs = {
    A: 'T',
    T: 'A',
    G: 'C',
    C: 'G'
};

function pairBase(base) {
    return basePairs[base];
}`,

    vector3d: `function dot(a, b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

function cross(a, b) {
    return {
        x: a.y * b.z - a.z * b.y,
        y: a.z * b.x - a.x * b.z,
        z: a.x * b.y - a.y * b.x
    };
}`,

    conic: `function conicType(eccentricity) {
    if (eccentricity === 0) return 'circle';
    if (eccentricity < 1) return 'ellipse';
    if (eccentricity === 1) return 'parabola';
    return 'hyperbola';
}`,

    drumflower: `// 击鼓传花 - 周期性问题
function findHolder(passCount, totalChildren = 8) {
    // 题目1: 传了N次，花在几号手里？
    // 从1号开始，传N次后位置 = N % 总人数 + 1
    return (passCount % totalChildren) + 1;
}

function countPasses(passCount, childNumber = 1, total = 8) {
    // 题目2: 传了N次，X号传过几次花？
    // X号传花次数 = floor(N / 总人数) + 1
    return Math.floor(passCount / total) + 1;
}

// 示例：传42次，花在 findHolder(42) = 3 号手里
// 示例：传69次，1号传过 countPasses(69) = 9 次`,

    flagellar: `// 细菌鞭毛马达 - 生物纳米机器
class FlagellarMotor {
    constructor() {
        // 马达结构
        this.stators = 8;         // 定子单元数
        this.protonGradient = 0;  // 质子梯度
        this.rotationSpeed = 0;   // 转速 (RPM)
        this.direction = 'CCW';   // 旋转方向
    }
    
    // 质子动力驱动
    driveRotation(protonFlow) {
        // 质子流过定子通道产生扭矩
        const torque = protonFlow * this.stators;
        this.rotationSpeed = torque * 1000; // 可达100,000 RPM
        return this.rotationSpeed;
    }
    
    // 切换旋转方向 (趋化反应)
    switchDirection() {
        // C环开关复合体控制方向
        this.direction = this.direction === 'CCW' ? 'CW' : 'CCW';
        // CCW = 游泳前进, CW = 翻滚改变方向
    }
}

// 鞭毛马达效率接近100%，远超人造马达！`,

    gravity: `/**
 * 万有引力与时空弯曲模拟器
 * 从牛顿到爱因斯坦的引力理论可视化
 */
class GravitySimulator {
    // 牛顿万有引力定律
    static newtonGravity(m1, m2, r) {
        const G = 6.674e-11; // 万有引力常数
        return G * m1 * m2 / (r * r);
    }
    
    // 爱因斯坦时空弯曲 - 网格变形算法
    deformSpacetime(gridVertex, masses) {
        let totalCurvature = 0;
        for (const mass of masses) {
            const distance = gridVertex.distanceTo(mass.position);
            // 高斯函数模拟质量导致的时空下沉
            const sigma = mass.schwarzschildRadius * 2;
            totalCurvature += mass.value * 
                Math.exp(-distance² / (2 * sigma²));
        }
        return totalCurvature;
    }
    
    // 引力波传播
    gravitationalWave(position, time) {
        const wavelength = 3.0;
        const speed = 299792458; // 光速
        const distance = position.length();
        const phase = distance / wavelength - time * speed;
        return Math.sin(phase * 2 * Math.PI);
    }
    
    // 史瓦西半径（事件视界）
    schwarzschildRadius(mass) {
        const G = 6.674e-11;
        const c = 299792458;
        return 2 * G * mass / (c * c);
    }
    
    // 霍金辐射温度
    hawkingTemperature(mass) {
        const h = 6.626e-34; // 普朗克常数
        const c = 299792458;
        const k = 1.381e-23; // 玻尔兹曼常数
        const G = 6.674e-11;
        return (h * c³) / (8 * Math.PI * G * mass * k);
    }
}

// "质量告诉时空如何弯曲，时空告诉物质如何运动" - 爱因斯坦`,

    nuclearfission: `/**
 * 核裂变链式反应模拟
 * 从一个中子到原子弹的连锁反应
 */
class NuclearFissionSimulator {
    // 铀-235 原子核参数
    static U235 = {
        protons: 92,
        neutrons: 143,
        bindingEnergy: 7.59, // MeV/核子
        fissionEnergy: 200   // MeV/次裂变
    };
    
    // 中子撞击触发裂变
    triggerFission(nucleus, neutron) {
        // 检查是否为可裂变同位素
        if (!nucleus.isFissile) return null;
        
        // 裂变产物（多种可能组合之一）
        const products = {
            fragment1: { name: 'Ba-141', Z: 56, N: 85 },
            fragment2: { name: 'Kr-92', Z: 36, N: 56 },
            newNeutrons: 2 + Math.floor(Math.random() * 2), // 2-3个
            energyMeV: 200 // E = Δm × c²
        };
        
        return products;
    }
    
    // 链式反应模拟
    chainReaction(initialNuclei, generations) {
        let activeNeutrons = 1;
        let totalFissions = 0;
        
        for (let gen = 0; gen < generations; gen++) {
            const fissions = activeNeutrons * this.fissionProbability;
            activeNeutrons = fissions * 2.5; // 平均释放2.5个中子
            totalFissions += fissions;
            
            // 指数增长！
            console.log(\`第\${gen}代: \${fissions}次裂变, \${activeNeutrons}个中子\`);
        }
        
        return totalFissions;
    }
    
    // 临界质量计算
    static criticalMass(enrichment) {
        // U-235 临界质量约 52kg (球形, 无反射层)
        return 52 / enrichment;
    }
}

// 1克铀-235完全裂变 ≈ 20吨TNT当量
// E = mc² 的终极证明`,

    migdal: `/**
 * 米格达尔效应模拟器
 * 2026年1月15日中国科学院首次直接证实
 * 发表于《自然》期刊
 */
class MigdalEffectSimulator {
    // 原子模型参数
    static atom = {
        nucleusMass: 1836, // 相对于电子质量
        electronMass: 1,
        bindingEnergy: 13.6 // eV (氢原子)
    };
    
    // 1. 中子-原子核碰撞（弹性散射）
    neutronCollision(neutronEnergy, nucleusMass) {
        // 能量守恒 + 动量守恒
        const m_n = 1; // 中子质量（单位质量）
        const M = nucleusMass;
        
        // 最大能量转移（正碰）
        const maxTransfer = 4 * m_n * M / Math.pow(m_n + M, 2);
        const recoilEnergy = neutronEnergy * maxTransfer;
        
        return {
            nucleusRecoilEnergy: recoilEnergy,
            scatteredNeutronEnergy: neutronEnergy - recoilEnergy
        };
    }
    
    // 2. 米格达尔效应核心：电场剧变导致电子激发
    migdalEffect(nucleusRecoilVelocity, electronBindingEnergy) {
        /**
         * 🔑 关键物理过程：
         * 当原子核突然加速时，核外电子"来不及"跟上
         * 原子内部电场发生剧变
         * 这种突然变化将能量传递给电子
         */
        
        // 米格达尔概率（简化模型）
        const v_nucleus = nucleusRecoilVelocity;
        const v_electron = 2.19e6; // 玻尔速度 m/s
        
        // 绝热参数
        const adiabaticParam = v_nucleus / v_electron;
        
        // 电子激发/电离概率
        const ionizationProb = Math.pow(adiabaticParam, 2) * 0.1;
        
        return {
            probability: ionizationProb,
            electronEnergy: this.sampleElectronEnergy(adiabaticParam)
        };
    }
    
    // 3. 共顶点轨迹特征
    generateTracks(collisionPoint, recoilDir, electronDir) {
        return {
            vertex: collisionPoint,  // 共同顶点
            nucleusTrack: {
                direction: recoilDir,
                length: 'short',      // 核反冲径迹较短
                ionization: 'high'    // 电离密度高
            },
            electronTrack: {
                direction: electronDir,
                length: 'long',       // 电子径迹较长
                ionization: 'low'     // 电离密度低
            }
        };
    }
}

// 米格达尔效应的意义：
// 突破轻暗物质探测的能量阈值瓶颈！
// 80年理论预言，2026年首次直接证实 🎉`,

    schrodinger: `/**
 * 薛定谔的猫 - 量子叠加态模拟器
 * 量子力学最著名的思想实验
 */
class SchrodingerCatSimulator {
    // 实验设置
    static setup = {
        radioactiveAtom: '铀-235',
        decayProbability: 0.5, // 50%概率衰变
        timeWindow: '1小时',
        poison: '氰化物'
    };
    
    // 叠加态表示
    // |ψ⟩ = α|活⟩ + β|死⟩
    // 其中 |α|² + |β|² = 1
    
    constructor() {
        // 初始叠加态：活和死的概率各50%
        this.alpha = Math.sqrt(0.5); // 活的概率幅
        this.beta = Math.sqrt(0.5);  // 死的概率幅
        this.isCollapsed = false;
        this.state = 'superposition';
    }
    
    // 观测（波函数坍缩）
    observe() {
        if (this.isCollapsed) return this.state;
        
        // 随机坍缩到一个确定态
        const random = Math.random();
        const aliveProb = this.alpha * this.alpha;
        
        this.isCollapsed = true;
        this.state = random < aliveProb ? 'alive' : 'dead';
        
        // 观测后，概率幅变为确定值
        if (this.state === 'alive') {
            this.alpha = 1;
            this.beta = 0;
        } else {
            this.alpha = 0;
            this.beta = 1;
        }
        
        return this.state;
    }
    
    // 重置实验
    reset() {
        this.alpha = Math.sqrt(0.5);
        this.beta = Math.sqrt(0.5);
        this.isCollapsed = false;
        this.state = 'superposition';
    }
    
    // 获取当前状态描述
    getStateString() {
        if (!this.isCollapsed) {
            return '|ψ⟩ = √½|活⟩ + √½|死⟩';
        }
        return this.state === 'alive' ? '|活⟩ 😺' : '|死⟩ 😿';
    }
}

// "上帝不掷骰子！" - 爱因斯坦
// "别告诉上帝该怎么做！" - 玻尔`,

    tesseract: `/**
 * 四维超立方体 - 维度演化器
 * 从0维点到高维空间的数学之旅
 */
class HypercubeGenerator {
    // 维度数据规律
    // 顶点数 = 2^n
    // 边数 = n × 2^(n-1)
    // 面数 = C(n,2) × 2^(n-2)
    
    // 生成n维超立方体的顶点
    static generateVertices(n) {
        const vertices = [];
        const count = Math.pow(2, n); // 2^n 个顶点
        
        for (let i = 0; i < count; i++) {
            const vertex = [];
            for (let j = 0; j < n; j++) {
                // 使用二进制位确定坐标 (-1 或 +1)
                vertex.push((i >> j) & 1 ? 1 : -1);
            }
            vertices.push(vertex);
        }
        return vertices;
    }
    
    // 4D → 3D 透视投影
    static project4Dto3D(vertex4D, rotationW = 0) {
        let [x, y, z, w] = vertex4D;
        
        // XW平面旋转（4D旋转的核心）
        const cos = Math.cos(rotationW);
        const sin = Math.sin(rotationW);
        const newX = x * cos - w * sin;
        const newW = x * sin + w * cos;
        x = newX;
        w = newW;
        
        // 透视投影：近大远小
        const distance = 4;
        const factor = distance / (distance - w * 0.5);
        
        return {
            x: x * factor,
            y: y * factor,
            z: z * factor
        };
    }
    
    // 维度演化动画
    evolve(fromDim, toDim, progress) {
        // 使用插值实现平滑过渡
        // 新顶点从原顶点"生长"出来
        // 新边逐渐显现
    }
}

// 维度规律表
// 0D: 1顶点, 0边 (点)
// 1D: 2顶点, 1边 (线段)
// 2D: 4顶点, 4边 (正方形)
// 3D: 8顶点, 12边 (立方体)
// 4D: 16顶点, 32边 (超立方体/Tesseract)
// 5D: 32顶点, 80边 (五维超立方体)
// 6D: 64顶点, 192边 (六维超立方体)

// 顶点数 = 2^n，每升一维翻倍！`,

    photosynthesis: `/**
 * 光合作用与呼吸作用模拟器
 * 生命能量转化的核心过程
 */
class PhotosynthesisSimulator {
    // ========== 光合作用 ==========
    // 总反应：6CO₂ + 6H₂O + 光能 → C₆H₁₂O₆ + 6O₂
    
    // 光反应（类囊体膜）
    lightReaction(water, photons) {
        // 1. 光能激发叶绿素
        const excitedElectrons = this.absorbLight(photons);
        
        // 2. 水的光解
        // 2H₂O → 4H⁺ + 4e⁻ + O₂↑
        const { protons, electrons, oxygen } = this.splitWater(water);
        
        // 3. 电子传递链
        const ATP = this.electronTransportChain(electrons);
        const NADPH = this.reduceNADP(electrons, protons);
        
        return { ATP, NADPH, O2: oxygen };
    }
    
    // 暗反应 / 卡尔文循环（基质）
    calvinCycle(CO2, ATP, NADPH) {
        // 1. CO₂固定
        const C3 = this.fixCO2(CO2); // 3-磷酸甘油酸
        
        // 2. 还原
        const G3P = this.reduce(C3, ATP, NADPH);
        
        // 3. 再生RuBP
        this.regenerateRuBP(G3P, ATP);
        
        // 每固定6个CO₂ → 1个葡萄糖
        return this.synthesizeGlucose(G3P);
    }
    
    // ========== 细胞呼吸 ==========
    // 总反应：C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + 38ATP
    
    cellularRespiration(glucose, oxygen) {
        // 1. 糖酵解（细胞质）
        // 葡萄糖 → 2丙酮酸 + 2ATP + 2NADH
        const { pyruvate, atp1, nadh1 } = this.glycolysis(glucose);
        
        // 2. 柠檬酸循环/三羧酸循环（线粒体基质）
        const { atp2, nadh2, fadh2, co2 } = this.citricAcidCycle(pyruvate);
        
        // 3. 氧化磷酸化/电子传递链（线粒体内膜）
        // NADH + FADH2 + O₂ → H₂O + 大量ATP
        const atp3 = this.oxidativePhosphorylation(nadh1 + nadh2, fadh2, oxygen);
        
        // 总计：1葡萄糖 ≈ 38 ATP
        return {
            totalATP: atp1 + atp2 + atp3, // ≈ 38
            CO2: co2,
            H2O: 6
        };
    }
}

// 光合作用 ⇄ 呼吸作用 = 生态系统的能量基础
// 🌱 植物：吸收CO₂，释放O₂
// 🐕 动物：吸收O₂，释放CO₂`,

    maze: `/**
 * 迷宫寻路算法对比
 * 从入门到高级的进化之路
 */

// 1. 右手法则 - 最简单的迷宫算法
// 规则：永远沿着右手边的墙走
function rightHandRule(maze, start, end) {
    let [x, y] = start;
    let direction = 0; // 0=北, 1=东, 2=南, 3=西
    
    while (x !== end[0] || y !== end[1]) {
        // 优先尝试：右转 → 直走 → 左转 → 回头
        const tryOrder = [(direction + 1) % 4, direction, (direction + 3) % 4, (direction + 2) % 4];
        
        for (const dir of tryOrder) {
            const [nx, ny] = move(x, y, dir);
            if (isPassable(maze, nx, ny)) {
                direction = dir;
                [x, y] = [nx, ny];
                break;
            }
        }
    }
}

// 2. 广度优先搜索（水淹算法） - 保证最短路径
// 像水淹迷宫一样，同时向所有方向扩散
function bfs(maze, start, end) {
    const queue = [{ pos: start, path: [start] }];
    const visited = new Set([key(start)]);
    
    while (queue.length > 0) {
        const { pos: [x, y], path } = queue.shift();
        
        if (x === end[0] && y === end[1]) {
            return path; // 找到最短路径！
        }
        
        // 四个方向同时扩散
        for (const [nx, ny] of neighbors(x, y)) {
            if (isPassable(maze, nx, ny) && !visited.has(key([nx, ny]))) {
                visited.add(key([nx, ny]));
                queue.push({ pos: [nx, ny], path: [...path, [nx, ny]] });
            }
        }
    }
}

// 3. A* 算法 - 智能导航
// 使用启发式函数估计到终点的距离
function aStar(maze, start, end) {
    const heuristic = (x, y) => Math.abs(x - end[0]) + Math.abs(y - end[1]); // 曼哈顿距离
    
    const openSet = [{ pos: start, g: 0, f: heuristic(...start), path: [] }];
    
    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f); // 选f值最小的
        const current = openSet.shift();
        
        if (current.pos[0] === end[0] && current.pos[1] === end[1]) {
            return current.path;
        }
        
        // 智能选择方向
        for (const neighbor of neighbors(...current.pos)) {
            const g = current.g + 1;
            const f = g + heuristic(...neighbor); // f = g + h
            openSet.push({ pos: neighbor, g, f, path: [...current.path, current.pos] });
        }
    }
}

// 效率对比（15x15迷宫）：
// 右手法则：可能走100+步 😅
// BFS水淹：探索50+格，找到最短20步路径 💧
// A*算法：只探索30格，同样找到20步路径 ⭐`,

    kmeans: `/**
 * K-Means 聚类算法
 * 无监督学习经典算法 - "物以类聚"
 */
class KMeans {
    constructor(k = 3) {
        this.k = k;          // 聚类数
        this.centroids = []; // 聚类中心
    }

    // 计算两点距离
    distance(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) + 
            Math.pow(p1.y - p2.y, 2)
        );
    }

    // 分配：每个点归属最近的中心
    assignClusters(points) {
        return points.map(point => {
            let minDist = Infinity;
            let cluster = 0;
            
            this.centroids.forEach((centroid, idx) => {
                const dist = this.distance(point, centroid);
                if (dist < minDist) {
                    minDist = dist;
                    cluster = idx;
                }
            });
            
            return { ...point, cluster };
        });
    }

    // 更新：重新计算中心位置
    updateCentroids(points) {
        this.centroids = this.centroids.map((_, idx) => {
            const clusterPoints = points.filter(p => p.cluster === idx);
            
            if (clusterPoints.length === 0) return this.centroids[idx];
            
            return {
                x: clusterPoints.reduce((s, p) => s + p.x, 0) / clusterPoints.length,
                y: clusterPoints.reduce((s, p) => s + p.y, 0) / clusterPoints.length
            };
        });
    }

    // 运行K-Means
    fit(points, maxIterations = 100) {
        // 随机初始化中心
        this.centroids = points
            .sort(() => Math.random() - 0.5)
            .slice(0, this.k)
            .map(p => ({ x: p.x, y: p.y }));

        let iteration = 0;
        let changed = true;

        while (changed && iteration < maxIterations) {
            const labeled = this.assignClusters(points);
            this.updateCentroids(labeled);
            iteration++;
            
            // 检查收敛（简化版）
            changed = /* ... */;
        }

        return this.assignClusters(points);
    }
}

// 使用示例
const kmeans = new KMeans(3);
const clusteredData = kmeans.fit(dataPoints);`,

    sorting: `/**
 * 排序算法合集
 * 从O(n²)到O(n log n)的进化之路
 */

// 1. 冒泡排序 - O(n²) 最直观的排序
function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n - 1; i++) {
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]]; // 交换
            }
        }
    }
    return arr;
}

// 2. 快速排序 - O(n log n) 分治法经典
function quickSort(arr, left = 0, right = arr.length - 1) {
    if (left >= right) return;
    
    const pivot = arr[right]; // 选择基准值
    let i = left - 1;
    
    for (let j = left; j < right; j++) {
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    
    [arr[i + 1], arr[right]] = [arr[right], arr[i + 1]];
    const pivotIdx = i + 1;
    
    quickSort(arr, left, pivotIdx - 1);  // 左半部分
    quickSort(arr, pivotIdx + 1, right); // 右半部分
    
    return arr;
}

// 3. 归并排序 - O(n log n) 稳定的分治
function mergeSort(arr) {
    if (arr.length <= 1) return arr;
    
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    while (left.length && right.length) {
        result.push(left[0] <= right[0] ? left.shift() : right.shift());
    }
    return [...result, ...left, ...right];
}

// 排序1000个元素：
// 冒泡：约500,000次比较 😱
// 快排：约10,000次比较 🚀`,

    neuronsignal: `/**
 * 神经元信号传递模拟器
 * 探索电信号如何在神经网络中传播
 */
class NeuronSimulator {
    // 神经元结构
    static structure = {
        dendrites: '树突 - 接收信号',
        soma: '胞体 - 整合信号',
        axon: '轴突 - 传导信号',
        synapse: '突触 - 传递信号'
    };
    
    // 静息电位
    restingPotential = -70; // mV
    
    // 阈值电位
    threshold = -55; // mV
    
    // 模拟动作电位
    actionPotential(stimulus) {
        let voltage = this.restingPotential;
        
        // 接收刺激
        voltage += stimulus;
        
        // 检查是否达到阈值
        if (voltage >= this.threshold) {
            // 全或无定律！
            console.log('🔥 动作电位发放！');
            
            // 快速去极化
            voltage = +40; // 峰值
            
            // 复极化
            voltage = -80; // 过极化
            
            // 恢复静息
            voltage = this.restingPotential;
            
            return true; // 信号传递成功
        }
        
        return false; // 未达阈值
    }
    
    // 突触传递
    synapticTransmission(actionPotential) {
        if (!actionPotential) return;
        
        // 1. 动作电位到达轴突末梢
        // 2. Ca²⁺ 内流
        const calciumInflux = this.openCalciumChannels();
        
        // 3. 突触小泡与膜融合
        // 4. 释放神经递质
        const neurotransmitters = this.releaseVesicles(calciumInflux);
        
        // 5. 递质穿越突触间隙（20nm）
        // 6. 与突触后受体结合
        const postsynapticResponse = this.bindReceptors(neurotransmitters);
        
        return postsynapticResponse; // EPSP 或 IPSP
    }
}

// 生物神经元 ↔ AI神经网络
// 树突 → 输入层
// 胞体整合 → 激活函数  
// 轴突传导 → 权重连接
// 突触强度 → 学习/权重更新`,

    gradientdescent: `/**
 * 神经网络梯度下降优化器
 * AI 如何通过"下山"找到最优解
 */
class GradientDescentOptimizer {
    constructor(learningRate = 0.01) {
        this.lr = learningRate;  // 学习率 α
        this.history = [];       // 优化轨迹
    }
    
    // 损失函数（以二次函数为例）
    lossFunction(theta) {
        // L(θ) = θ² （碗形函数，最小值在θ=0）
        return theta * theta;
    }
    
    // 计算梯度 ∇L
    computeGradient(theta) {
        // dL/dθ = 2θ
        return 2 * theta;
    }
    
    // 梯度下降核心：θ_new = θ_old - α × ∇L
    step(theta) {
        const gradient = this.computeGradient(theta);
        const newTheta = theta - this.lr * gradient;
        
        this.history.push({
            theta: newTheta,
            loss: this.lossFunction(newTheta),
            gradient: gradient
        });
        
        return newTheta;
    }
    
    // 优化直到收敛
    optimize(initialTheta, tolerance = 1e-6, maxIter = 1000) {
        let theta = initialTheta;
        
        for (let i = 0; i < maxIter; i++) {
            const gradient = this.computeGradient(theta);
            
            // 检查收敛（梯度足够小）
            if (Math.abs(gradient) < tolerance) {
                console.log(\`✅ 收敛！迭代\${i}次，最优解: θ = \${theta.toFixed(6)}\`);
                return theta;
            }
            
            theta = this.step(theta);
        }
        
        console.log('⚠️ 达到最大迭代次数');
        return theta;
    }
}

// 学习率太大 → 震荡发散
// 学习率太小 → 收敛缓慢
// 学习率刚好 → 快速收敛 ✨`,

    'geometry-problem': `/**
 * 几何解题可视化 - 面积最大值问题
 * 动点轨迹 + 面积等量转化
 */
class GeometryProblemSolver {
    constructor() {
        // 圆的参数
        this.circle = { center: {x: 0, y: 0}, radius: 3 };
        
        // 固定点坐标
        this.pointA = {x: -5, y: 0};
        this.pointB = {x: -2, y: 4};
        this.pointD = {x: 4, y: 0};
        
        // 动点C（在圆上）
        this.angleC = Math.PI / 2; // 初始在圆顶
    }
    
    // 点C的坐标（圆的参数方程）
    getPointC() {
        return {
            x: this.circle.radius * Math.cos(this.angleC),
            y: this.circle.radius * Math.sin(this.angleC)
        };
    }
    
    // 计算三角形面积（向量叉积法）
    calculateArea(p1, p2, p3) {
        // S = (1/2) |AB × AC|
        // 二维向量叉积：ax*by - ay*bx
        const v1 = {x: p2.x - p1.x, y: p2.y - p1.y};
        const v2 = {x: p3.x - p1.x, y: p3.y - p1.y};
        
        const cross = v1.x * v2.y - v1.y * v2.x;
        return Math.abs(cross) / 2;
    }
    
    // 计算总面积
    getTotalArea() {
        const C = this.getPointC();
        const O = this.circle.center;
        
        const areaABC = this.calculateArea(this.pointA, this.pointB, C);
        const areaOCD = this.calculateArea(O, C, this.pointD);
        
        return areaABC + areaOCD;
    }
    
    // 🔑 求最大值的关键：
    // 1. 转化为四边形面积问题
    // 2. S = (1/2) × d1 × d2 × sin(θ)
    // 3. 当 θ = 90°（对角线⊥）时，sin(θ) = 1，面积最大！
    
    findMaxArea() {
        let maxArea = 0;
        let maxAngle = 0;
        
        // 遍历所有角度
        for (let angle = 0; angle < 2 * Math.PI; angle += 0.01) {
            this.angleC = angle;
            const area = this.getTotalArea();
            if (area > maxArea) {
                maxArea = area;
                maxAngle = angle;
            }
        }
        
        return { maxArea, maxAngle };
    }
}

// 解题思路：
// Step 1: 观察动点运动，发现两个三角形不同时最大
// Step 2: 构造辅助线，转化问题
// Step 3: 面积等量替换
// Step 4: 对角线⊥时，面积最大！`,

    'solid-geometry': `/**
 * 正方体截面问题
 * 探索截面形状与面积
 */
class CubeSectionSolver {
    constructor(cubeSize = 6) {
        this.cubeSize = cubeSize;
        this.vertices = this.getCubeVertices();
        this.edges = this.getCubeEdges();
    }
    
    // 正方体8个顶点
    getCubeVertices() {
        const s = this.cubeSize / 2;
        return [
            {x: -s, y: -s, z: -s}, // A (0)
            {x:  s, y: -s, z: -s}, // B (1)
            {x:  s, y: -s, z:  s}, // C (2)
            {x: -s, y: -s, z:  s}, // D (3)
            {x: -s, y:  s, z: -s}, // A'(4)
            {x:  s, y:  s, z: -s}, // B'(5)
            {x:  s, y:  s, z:  s}, // C'(6)
            {x: -s, y:  s, z:  s}  // D'(7)
        ];
    }
    
    // 12条棱
    getCubeEdges() {
        return [
            [0,1], [1,2], [2,3], [3,0], // 底面
            [4,5], [5,6], [6,7], [7,4], // 顶面
            [0,4], [1,5], [2,6], [3,7]  // 侧棱
        ];
    }
    
    // 线段与平面交点
    linePlaneIntersection(lineStart, lineEnd, planeNormal, planeD) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const dz = lineEnd.z - lineStart.z;
        
        const denominator = planeNormal.x*dx + planeNormal.y*dy + planeNormal.z*dz;
        if (Math.abs(denominator) < 0.0001) return null;
        
        const t = -(planeNormal.x*lineStart.x + planeNormal.y*lineStart.y + 
                   planeNormal.z*lineStart.z + planeD) / denominator;
        
        if (t < 0 || t > 1) return null;
        
        return {
            x: lineStart.x + t * dx,
            y: lineStart.y + t * dy,
            z: lineStart.z + t * dz
        };
    }
    
    // 计算截面（返回交点数组）
    getCutSection(height, tiltX = 0, tiltY = 0) {
        const points = [];
        const s = this.cubeSize / 2;
        
        // 平面法向量（简化：y方向 + 倾斜）
        const normal = {x: tiltX, y: 1, z: tiltY};
        const d = -normal.y * (height - 0.5) * this.cubeSize;
        
        this.edges.forEach(([i, j]) => {
            const p = this.linePlaneIntersection(
                this.vertices[i], this.vertices[j],
                normal, d
            );
            if (p) points.push(p);
        });
        
        return this.sortPointsClockwise(points);
    }
    
    // 按角度排序形成凸多边形
    sortPointsClockwise(points) {
        if (points.length < 3) return points;
        
        const cx = points.reduce((s,p) => s+p.x, 0) / points.length;
        const cz = points.reduce((s,p) => s+p.z, 0) / points.length;
        
        return points.sort((a, b) => 
            Math.atan2(a.z-cz, a.x-cx) - Math.atan2(b.z-cz, b.x-cx)
        );
    }
    
    // 计算截面面积
    calculateSectionArea(points) {
        if (points.length < 3) return 0;
        
        let area = 0;
        const cx = points.reduce((s,p) => s+p.x, 0) / points.length;
        const cy = points.reduce((s,p) => s+p.y, 0) / points.length;
        const cz = points.reduce((s,p) => s+p.z, 0) / points.length;
        
        for (let i = 0; i < points.length; i++) {
            const p1 = points[i];
            const p2 = points[(i+1) % points.length];
            
            // 向量叉积计算三角形面积
            const v1 = {x: p1.x-cx, y: p1.y-cy, z: p1.z-cz};
            const v2 = {x: p2.x-cx, y: p2.y-cy, z: p2.z-cz};
            
            const cross = {
                x: v1.y*v2.z - v1.z*v2.y,
                y: v1.z*v2.x - v1.x*v2.z,
                z: v1.x*v2.y - v1.y*v2.x
            };
            
            area += Math.sqrt(cross.x**2 + cross.y**2 + cross.z**2) / 2;
        }
        return area;
    }
}

// 截面形状规律：
// 3边 → 三角形（靠近顶点）
// 4边 → 四边形（常见）
// 5边 → 五边形（较少）
// 6边 → 六边形（最多！正方体只有6个面）

// 最大截面：过体对角线中点，⊥体对角线，为正六边形
// 面积 = (3√2/2) × a²`,

    ppt: `// 智能课件系统
class SlideRenderer {
    constructor(slides) {
        this.slides = slides;
        this.currentIndex = 0;
    }
    
    render(index) {
        const slide = this.slides[index];
        return \`
            <div class="slide-content">
                <h1>\${slide.title}</h1>
                <p>\${slide.subtitle}</p>
                \${slide.content}
            </div>
        \`;
    }
    
    next() { this.render(++this.currentIndex); }
    prev() { this.render(--this.currentIndex); }
}`
};
