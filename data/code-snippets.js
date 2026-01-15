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
