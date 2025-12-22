/**
 * 代码演示片段数据
 * 用于打字机效果展示
 */
export const codeSnippets = {
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
    
    llm: `class TransformerNetwork extends InteractiveScene {
    init() {
        // 1. 创建 Token 嵌入层可视化
        this.tokens = this.createTokenNodes(inputText);
        
        // 2. 构建多头注意力机制连接
        this.attentionHeads.forEach(head => {
            head.calculateWeights(this.tokens);
            this.drawConnections(head.weights);
        });

        // 3. 启用光线投射交互
        this.raycaster.on('click', (intersectedToken) => {
            // 高亮相关的注意力连接
            this.highlightAttention(intersectedToken);
            // 显示 Token 信息面板
            this.ui.showTooltip(intersectedToken.data);
        });
    }
}`,
    
    ppt: `// PPT课件生成逻辑
function renderSlide(index) {
    const slide = slides[index];
    
    // 动态渲染幻灯片内容
    container.innerHTML = \`
        <div class="slide-content">
            <div class="slide-header">
                <h1>\${slide.title}</h1>
                <p>\${slide.subtitle}</p>
            </div>
            <div class="slide-body">
                \${slide.content}
            </div>
        </div>
    \`;
    
    // 应用过渡动画
    gsap.from('.slide-content', {
        opacity: 0,
        y: 20,
        duration: 0.5
    });
}`
};

