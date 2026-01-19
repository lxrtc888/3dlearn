/**
 * 神经元信号传递 3D教学场景
 * ============================================
 * 可视化电信号如何在神经网络中传播
 * 
 * 教学内容：
 * 1. 神经元的基本结构（树突、胞体、轴突、突触）
 * 2. 动作电位的产生与传导
 * 3. 突触传递与神经递质
 * 4. 与AI神经网络的类比
 * 
 * 目标学生：初中-高中
 * ============================================
 */

class NeuronSignalScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'NeuronSignalScene';
        this.mainGroup = null;
        
        // 场景元素
        this.neurons = [];              // 神经元数组
        this.synapses = [];             // 突触连接
        this.actionPotentials = [];     // 动作电位脉冲
        this.neurotransmitters = [];    // 神经递质粒子
        
        // 动画状态
        this.isPlaying = false;
        this.animationTime = 0;
        this.currentStep = 0;
        
        // 教学步骤
        this.steps = [
            { name: '神经元结构', desc: '认识神经元的各个组成部分' },
            { name: '静息电位', desc: '了解神经元的"待机状态" -70mV' },
            { name: '动作电位', desc: '电信号如何沿轴突传导' },
            { name: '突触传递', desc: '神经递质如何传递信息' },
            { name: '信号整合', desc: '多个信号如何汇聚处理' }
        ];
        
        // 颜色配置
        this.colors = {
            soma: 0x4fc3f7,         // 胞体 - 浅蓝
            dendrite: 0x81d4fa,     // 树突 - 更浅蓝
            axon: 0x29b6f6,         // 轴突 - 亮蓝
            axonActive: 0x00ff88,   // 轴突激活 - 亮绿
            myelin: 0xffffff,       // 髓鞘 - 白色
            synapse: 0xab47bc,      // 突触 - 紫色
            pulse: 0xffeb3b,        // 动作电位 - 黄色
            neurotransmitter: 0xff5722, // 神经递质 - 橙色
            receptor: 0x4caf50      // 受体 - 绿色
        };
        
        // 电流效果
        this.electricParticles = [];
        this.axonSegments = [];      // 轴突分段（用于波浪式激活）
        this.waveEffects = [];       // 波浪效果
    }

    init() {
        // 设置场景背景和雾效（Blender风格）
        this.scene.background = new THREE.Color(0x0a1020);
        this.scene.fog = new THREE.FogExp2(0x0a1020, 0.015);
        
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建Blender风格环境
        this.setupEnvironment();
        
        // 创建神经元网络
        this.createNeuronNetwork();
        
        // 创建信息面板
        this.createInfoPanel();
        
        // 设置相机（斜上方视角）
        if (this.camera) {
            this.camera.position.set(15, 10, 18);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 设置灯光
        this.setupLighting();
        
        // 创建UI控制
        this.setupUI();
        
        // 默认自动演示
        this.startAutoSignal();
        
        console.log('NeuronSignalScene initialized');
    }

    /**
     * 设置Blender风格环境
     */
    setupEnvironment() {
        // 网格地面（Blender风格）
        const grid = new THREE.GridHelper(50, 50, 0x4fc3f7, 0x1a2a3a);
        grid.position.y = -8;
        grid.material.opacity = 0.4;
        grid.material.transparent = true;
        this.scene.add(grid);
        
        // 细胞外液粒子效果
        const particleCount = 300;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 20 + 2;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 30;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.1,
            color: 0x4fc3f7,
            transparent: true,
            opacity: 0.3
        });
        
        this.bgParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.mainGroup.add(this.bgParticles);
    }
    
    /**
     * 启动自动信号传递
     */
    startAutoSignal() {
        this.autoSignalInterval = setInterval(() => {
            if (this.neurons.length > 0 && !this.isPlaying) {
                // 随机选择一个输入神经元发送信号
                const inputNeurons = this.neurons.filter(n => 
                    n.userData.id === 'input1' || n.userData.id === 'input2' || n.userData.id === 'pre'
                );
                if (inputNeurons.length > 0) {
                    const randomNeuron = inputNeurons[Math.floor(Math.random() * inputNeurons.length)];
                    this.createActionPotential(randomNeuron);
                }
            }
        }, 3000); // 每3秒发送一次信号
    }

    /**
     * 创建神经元网络
     */
    createNeuronNetwork() {
        // 所有神经元抬高到网格上方
        const baseY = 2;
        
        // 创建主神经元（突触前神经元）
        const preNeuron = this.createNeuron(-6, baseY, 0, 'pre');
        this.neurons.push(preNeuron);
        
        // 创建突触后神经元
        const postNeuron = this.createNeuron(6, baseY, 0, 'post');
        this.neurons.push(postNeuron);
        
        // 创建突触连接
        this.createSynapticConnection(preNeuron, postNeuron);
        
        // 创建额外的输入神经元（用于信号整合演示）
        const inputNeuron1 = this.createNeuron(-12, baseY + 3, -3, 'input1', 0.7);
        const inputNeuron2 = this.createNeuron(-12, baseY - 3, -3, 'input2', 0.7);
        this.neurons.push(inputNeuron1, inputNeuron2);
        
        // 连接到突触前神经元
        this.createDendriteConnection(inputNeuron1, preNeuron);
        this.createDendriteConnection(inputNeuron2, preNeuron);
    }

    /**
     * 创建单个神经元
     */
    createNeuron(x, y, z, id, scale = 1) {
        const neuronGroup = new THREE.Group();
        neuronGroup.position.set(x, y, z);
        neuronGroup.scale.setScalar(scale);
        
        // === 1. 胞体 (Soma) ===
        const somaGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const somaMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.soma,
            emissive: this.colors.soma,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.9
        });
        const soma = new THREE.Mesh(somaGeometry, somaMaterial);
        soma.userData = {
            name: '胞体 (Soma)',
            info: `<b>胞体 / 细胞体</b><br><br>
                神经元的"指挥中心"，包含细胞核。<br><br>
                <b>功能</b>：<br>
                • 整合来自树突的信号<br>
                • 决定是否产生动作电位<br>
                • 维持细胞生命活动<br><br>
                <span style="color:#4fc3f7">💡 类似AI网络中的"激活函数"</span>`,
            isInteractive: true,
            part: 'soma'
        };
        neuronGroup.add(soma);
        
        // 细胞核
        const nucleusGeometry = new THREE.SphereGeometry(0.5, 16, 16);
        const nucleusMaterial = new THREE.MeshPhongMaterial({
            color: 0x1565c0,
            transparent: true,
            opacity: 0.8
        });
        const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        soma.add(nucleus);
        
        // === 2. 树突 (Dendrites) ===
        const dendriteCount = 5;
        for (let i = 0; i < dendriteCount; i++) {
            const angle = (i / dendriteCount) * Math.PI * 2;
            const dendrite = this.createDendrite(angle);
            dendrite.userData = {
                name: '树突 (Dendrite)',
                info: `<b>树突</b><br><br>
                    神经元的"接收天线"。<br><br>
                    <b>功能</b>：<br>
                    • 接收其他神经元的信号<br>
                    • 表面有大量受体蛋白<br>
                    • 将信号传向胞体<br><br>
                    <span style="color:#81d4fa">📡 类似AI网络的"输入层"</span>`,
                isInteractive: true,
                part: 'dendrite'
            };
            neuronGroup.add(dendrite);
        }
        
        // === 3. 轴突 (Axon) ===
        if (id === 'pre' || id === 'input1' || id === 'input2') {
            const axon = this.createAxon();
            axon.userData = {
                name: '轴突 (Axon)',
                info: `<b>轴突</b><br><br>
                    神经元的"信号高速公路"。<br><br>
                    <b>特点</b>：<br>
                    • 可长达1米（如脊髓运动神经元）<br>
                    • 髓鞘包裹，加速传导<br>
                    • 动作电位沿轴突单向传导<br><br>
                    <b>传导速度</b>：1-100 m/s<br><br>
                    <span style="color:#29b6f6">⚡ 类似AI网络的"权重连接"</span>`,
                isInteractive: true,
                part: 'axon'
            };
            neuronGroup.add(axon);
            neuronGroup.userData.axon = axon;
        }
        
        // === 4. 轴突末梢 (Axon Terminal) ===
        if (id === 'pre') {
            const terminal = this.createAxonTerminal();
            terminal.position.set(6, 0, 0);
            terminal.userData = {
                name: '轴突末梢 (Axon Terminal)',
                info: `<b>轴突末梢 / 突触小体</b><br><br>
                    神经信号的"发射站"。<br><br>
                    <b>内部结构</b>：<br>
                    • 突触小泡（含神经递质）<br>
                    • 线粒体（提供能量）<br>
                    • 钙离子通道<br><br>
                    <b>工作流程</b>：<br>
                    动作电位到达 → Ca²⁺内流 → 小泡融合 → 释放递质`,
                isInteractive: true,
                part: 'terminal'
            };
            neuronGroup.add(terminal);
            neuronGroup.userData.terminal = terminal;
        }
        
        neuronGroup.userData.id = id;
        neuronGroup.userData.soma = soma;
        this.mainGroup.add(neuronGroup);
        
        return neuronGroup;
    }

    /**
     * 创建树突分支
     */
    createDendrite(angle) {
        const group = new THREE.Group();
        
        const length = 2 + Math.random();
        const curve = new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(
                Math.cos(angle) * length * 0.5,
                Math.sin(angle) * length * 0.5 + (Math.random() - 0.5),
                (Math.random() - 0.5) * 0.5
            ),
            new THREE.Vector3(
                Math.cos(angle) * length,
                Math.sin(angle) * length,
                (Math.random() - 0.5)
            )
        );
        
        const tubeGeometry = new THREE.TubeGeometry(curve, 20, 0.08, 8, false);
        const tubeMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.dendrite,
            emissive: this.colors.dendrite,
            emissiveIntensity: 0.1
        });
        const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
        group.add(tube);
        
        // 添加小分支
        const branchCount = 2 + Math.floor(Math.random() * 2);
        for (let i = 0; i < branchCount; i++) {
            const t = 0.4 + Math.random() * 0.5;
            const point = curve.getPoint(t);
            const branchAngle = angle + (Math.random() - 0.5) * 0.8;
            const branchLength = 0.5 + Math.random() * 0.5;
            
            const branchCurve = new THREE.LineCurve3(
                point,
                new THREE.Vector3(
                    point.x + Math.cos(branchAngle) * branchLength,
                    point.y + Math.sin(branchAngle) * branchLength,
                    point.z + (Math.random() - 0.5) * 0.3
                )
            );
            
            const branchGeo = new THREE.TubeGeometry(branchCurve, 5, 0.04, 6, false);
            const branch = new THREE.Mesh(branchGeo, tubeMaterial);
            group.add(branch);
        }
        
        return group;
    }

    /**
     * 创建轴突 - 分段设计，支持波浪式激活
     */
    createAxon() {
        const group = new THREE.Group();
        
        // 轴突曲线路径
        const axonCurve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(1.2, 0, 0),
            new THREE.Vector3(2, -0.15, 0),
            new THREE.Vector3(3, 0.1, 0),
            new THREE.Vector3(4, -0.1, 0),
            new THREE.Vector3(5, 0.05, 0),
            new THREE.Vector3(6, 0, 0)
        ]);
        
        // 分段创建轴突（用于波浪式激活效果）
        const segmentCount = 30;
        const segments = [];
        
        for (let i = 0; i < segmentCount; i++) {
            const t1 = i / segmentCount;
            const t2 = (i + 1) / segmentCount;
            
            const p1 = axonCurve.getPoint(t1);
            const p2 = axonCurve.getPoint(t2);
            
            // 创建分段圆柱
            const segCurve = new THREE.LineCurve3(p1, p2);
            const segGeo = new THREE.TubeGeometry(segCurve, 4, 0.1, 8, false);
            const segMat = new THREE.MeshPhongMaterial({
                color: this.colors.axon,
                emissive: this.colors.axon,
                emissiveIntensity: 0.1,
                transparent: true,
                opacity: 0.9
            });
            const segMesh = new THREE.Mesh(segGeo, segMat);
            segMesh.userData.segmentIndex = i;
            segMesh.userData.activated = false;
            group.add(segMesh);
            segments.push(segMesh);
        }
        
        group.userData.segments = segments;
        this.axonSegments = segments;
        
        // 髓鞘节段 (郎飞结) - 跳跃传导的关键
        const myelinPositions = [1.6, 2.4, 3.2, 4.0, 4.8, 5.6];
        const nodePositions = []; // 郎飞结位置
        
        myelinPositions.forEach((pos, i) => {
            // 髓鞘（白色绝缘层）
            const myelinGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.6, 16);
            const myelinMat = new THREE.MeshPhongMaterial({
                color: this.colors.myelin,
                transparent: true,
                opacity: 0.6,
                emissive: 0x444444,
                emissiveIntensity: 0.1
            });
            const myelin = new THREE.Mesh(myelinGeo, myelinMat);
            myelin.rotation.z = Math.PI / 2;
            myelin.position.set(pos, 0, 0);
            myelin.userData = {
                name: '髓鞘 (Myelin Sheath)',
                info: `<b>髓鞘</b><br><br>
                    包裹轴突的"绝缘层"。<br><br>
                    <b>功能</b>：<br>
                    • 加速信号传导（跳跃传导）<br>
                    • 保护轴突<br><br>
                    <b>郎飞结</b>：髓鞘间隙，离子通道集中处<br><br>
                    <span style="color:#ffffff">⚡ 使传导速度提高100倍！</span>`,
                isInteractive: true,
                part: 'myelin',
                index: i
            };
            group.add(myelin);
            
            // 郎飞结标记（信号跳跃点）
            if (i < myelinPositions.length - 1) {
                const nodePos = (pos + myelinPositions[i + 1]) / 2;
                nodePositions.push(nodePos);
                
                const nodeGeo = new THREE.TorusGeometry(0.18, 0.04, 8, 16);
                const nodeMat = new THREE.MeshPhongMaterial({
                    color: 0x00ff88,
                    emissive: 0x00ff88,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.8
                });
                const node = new THREE.Mesh(nodeGeo, nodeMat);
                node.rotation.y = Math.PI / 2;
                node.position.set(nodePos, 0, 0);
                node.userData = {
                    name: '郎飞结 (Node of Ranvier)',
                    info: `<b>郎飞结</b><br><br>
                        髓鞘之间的间隙，离子通道密集。<br><br>
                        <b>跳跃传导</b>：<br>
                        动作电位从一个郎飞结"跳"到下一个，<br>
                        速度比无髓鞘轴突快100倍！<br><br>
                        <span style="color:#00ff88">⚡ 信号在此处"充电"后继续传递</span>`,
                    isInteractive: true,
                    part: 'node'
                };
                group.add(node);
            }
        });
        
        group.userData.curve = axonCurve;
        group.userData.nodePositions = nodePositions;
        return group;
    }

    /**
     * 创建轴突末梢
     */
    createAxonTerminal() {
        const group = new THREE.Group();
        
        // 突触小体
        const terminalGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const terminalMat = new THREE.MeshPhongMaterial({
            color: this.colors.synapse,
            emissive: this.colors.synapse,
            emissiveIntensity: 0.3
        });
        const terminal = new THREE.Mesh(terminalGeo, terminalMat);
        group.add(terminal);
        
        // 突触小泡（神经递质容器）
        const vesicleCount = 8;
        for (let i = 0; i < vesicleCount; i++) {
            const vesicleGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const vesicleMat = new THREE.MeshPhongMaterial({
                color: this.colors.neurotransmitter,
                emissive: this.colors.neurotransmitter,
                emissiveIntensity: 0.5
            });
            const vesicle = new THREE.Mesh(vesicleGeo, vesicleMat);
            
            const angle = Math.random() * Math.PI * 2;
            const radius = 0.15 + Math.random() * 0.1;
            vesicle.position.set(
                Math.cos(angle) * radius,
                (Math.random() - 0.5) * 0.2,
                Math.sin(angle) * radius
            );
            group.add(vesicle);
        }
        
        return group;
    }

    /**
     * 创建突触连接
     */
    createSynapticConnection(preNeuron, postNeuron) {
        const synapseGroup = new THREE.Group();
        
        // 突触间隙
        const gapGeometry = new THREE.BoxGeometry(0.3, 1, 1);
        const gapMaterial = new THREE.MeshBasicMaterial({
            color: 0x000033,
            transparent: true,
            opacity: 0.5
        });
        const gap = new THREE.Mesh(gapGeometry, gapMaterial);
        gap.position.set(-1.5, 0, 0);
        gap.userData = {
            name: '突触间隙 (Synaptic Cleft)',
            info: `<b>突触间隙</b><br><br>
                两个神经元之间的微小间隙（约20nm）。<br><br>
                <b>过程</b>：<br>
                1. 神经递质从突触前释放<br>
                2. 穿越间隙（扩散）<br>
                3. 与突触后受体结合<br><br>
                <span style="color:#ab47bc">🔗 这就是"突触"名称的由来！</span>`,
            isInteractive: true,
            part: 'cleft'
        };
        synapseGroup.add(gap);
        
        // 突触后膜受体
        const receptorCount = 5;
        for (let i = 0; i < receptorCount; i++) {
            const receptorGeo = new THREE.ConeGeometry(0.1, 0.2, 8);
            const receptorMat = new THREE.MeshPhongMaterial({
                color: this.colors.receptor,
                emissive: this.colors.receptor,
                emissiveIntensity: 0.3
            });
            const receptor = new THREE.Mesh(receptorGeo, receptorMat);
            receptor.position.set(-1.2, (i - 2) * 0.25, 0);
            receptor.rotation.z = Math.PI / 2;
            receptor.userData = {
                name: '受体蛋白 (Receptor)',
                info: `<b>受体蛋白</b><br><br>
                    位于突触后膜的"接收器"。<br><br>
                    <b>类型</b>：<br>
                    • 离子通道型（快速）<br>
                    • 代谢型（慢速持久）<br><br>
                    <b>工作原理</b>：<br>
                    神经递质结合 → 通道打开 → 离子流入 → 产生电位变化`,
                isInteractive: true,
                part: 'receptor'
            };
            synapseGroup.add(receptor);
        }
        
        // 放置在两个神经元之间
        synapseGroup.position.set(0, 2, 0);
        this.mainGroup.add(synapseGroup);
        this.synapses.push(synapseGroup);
    }

    /**
     * 创建树突连接
     */
    createDendriteConnection(fromNeuron, toNeuron) {
        const start = fromNeuron.position.clone();
        const end = toNeuron.position.clone();
        
        const mid = start.clone().lerp(end, 0.5);
        mid.y += (Math.random() - 0.5) * 2;
        
        const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
        const geometry = new THREE.TubeGeometry(curve, 20, 0.05, 8, false);
        const material = new THREE.MeshPhongMaterial({
            color: 0x555588,
            transparent: true,
            opacity: 0.5
        });
        
        const connection = new THREE.Mesh(geometry, material);
        this.mainGroup.add(connection);
    }

    /**
     * 创建动作电位脉冲
     */
    createActionPotential(neuron) {
        const pulseGroup = new THREE.Group();
        
        // 核心亮点 - 更大更亮
        const coreGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const coreMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });
        const core = new THREE.Mesh(coreGeo, coreMat);
        pulseGroup.add(core);
        
        // 内层光晕
        const innerGlowGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const innerGlowMat = new THREE.MeshBasicMaterial({
            color: 0x00ff88,
            transparent: true,
            opacity: 0.8
        });
        const innerGlow = new THREE.Mesh(innerGlowGeo, innerGlowMat);
        pulseGroup.add(innerGlow);
        
        // 脉冲光环
        const pulseGeo = new THREE.TorusGeometry(0.5, 0.1, 8, 24);
        const pulseMat = new THREE.MeshBasicMaterial({
            color: this.colors.pulse,
            transparent: true,
            opacity: 0.9
        });
        const pulse = new THREE.Mesh(pulseGeo, pulseMat);
        pulse.rotation.y = Math.PI / 2;
        pulseGroup.add(pulse);
        
        // 外部光晕
        const glowGeo = new THREE.SphereGeometry(0.7, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.colors.pulse,
            transparent: true,
            opacity: 0.3,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        pulseGroup.add(glow);
        
        // 设置初始位置 - 在胞体位置
        pulseGroup.position.copy(neuron.position);
        pulseGroup.position.x += 1.2 * neuron.scale.x;
        
        // 创建跟随脉冲的电流粒子流
        const particleTrail = this.createElectricTrail(neuron);
        
        pulseGroup.userData = {
            neuron: neuron,
            progress: 0,
            speed: 0.012,  // 稍慢，更容易观察
            particleTrail: particleTrail,
            activatedSegments: 0
        };
        
        this.mainGroup.add(pulseGroup);
        this.actionPotentials.push(pulseGroup);
        
        // 胞体激活闪烁
        this.flashSoma(neuron);
        
        // 显示引导
        this.showGuide('⚡ 动作电位发放！观察电信号沿轴突传导...');
        
        return pulseGroup;
    }
    
    /**
     * 胞体激活闪烁效果
     */
    flashSoma(neuron) {
        if (!neuron.userData.soma) return;
        
        const soma = neuron.userData.soma;
        const originalColor = soma.material.emissive.getHex();
        const originalIntensity = soma.material.emissiveIntensity;
        
        // 闪烁动画
        let flash = 0;
        const flashAnim = () => {
            flash++;
            if (flash < 10) {
                soma.material.emissive.setHex(flash % 2 === 0 ? 0x00ff88 : originalColor);
                soma.material.emissiveIntensity = flash % 2 === 0 ? 0.8 : originalIntensity;
                requestAnimationFrame(flashAnim);
            } else {
                soma.material.emissive.setHex(originalColor);
                soma.material.emissiveIntensity = originalIntensity;
            }
        };
        flashAnim();
    }
    
    /**
     * 创建电流粒子尾迹
     */
    createElectricTrail(neuron) {
        const trail = new THREE.Group();
        const particleCount = 50;
        
        for (let i = 0; i < particleCount; i++) {
            const size = 0.05 + Math.random() * 0.05;
            const particleGeo = new THREE.SphereGeometry(size, 6, 6);
            const particleMat = new THREE.MeshBasicMaterial({
                color: i % 3 === 0 ? 0x00ff88 : (i % 3 === 1 ? 0xffeb3b : 0x4fc3f7),
                transparent: true,
                opacity: 0
            });
            const particle = new THREE.Mesh(particleGeo, particleMat);
            
            particle.userData = {
                offset: i / particleCount,
                speed: 0.8 + Math.random() * 0.4,
                radius: 0.1 + Math.random() * 0.15
            };
            
            trail.add(particle);
        }
        
        trail.position.copy(neuron.position);
        this.mainGroup.add(trail);
        
        return trail;
    }
    
    /**
     * 更新电流粒子尾迹
     */
    updateElectricTrail(trail, progress, neuron, time) {
        if (!trail || !neuron.userData.axon) return;
        
        const curve = neuron.userData.axon.userData.curve;
        if (!curve) return;
        
        trail.children.forEach((particle, i) => {
            const particleProgress = progress - particle.userData.offset * 0.3;
            
            if (particleProgress > 0 && particleProgress < 1) {
                const point = curve.getPoint(Math.max(0, Math.min(1, particleProgress)));
                
                // 螺旋运动
                const angle = time * 10 + i * 0.5;
                const radius = particle.userData.radius;
                
                particle.position.set(
                    point.x * neuron.scale.x + Math.cos(angle) * radius,
                    point.y * neuron.scale.y + Math.sin(angle) * radius,
                    point.z * neuron.scale.z + Math.sin(angle * 0.7) * radius * 0.5
                );
                
                // 透明度随位置变化
                const fadeIn = Math.min(1, particleProgress * 5);
                const fadeOut = Math.max(0, 1 - (particleProgress - 0.7) * 3);
                particle.material.opacity = fadeIn * fadeOut * 0.8;
                
                // 大小脉动
                const pulse = 1 + Math.sin(time * 15 + i) * 0.3;
                particle.scale.setScalar(pulse);
            } else {
                particle.material.opacity = 0;
            }
        });
    }
    
    /**
     * 激活轴突段（波浪式）
     */
    activateAxonSegment(neuron, progress) {
        if (!neuron.userData.axon) return;
        
        const segments = neuron.userData.axon.userData.segments;
        if (!segments) return;
        
        const activeIndex = Math.floor(progress * segments.length);
        
        segments.forEach((seg, i) => {
            if (i <= activeIndex && i >= activeIndex - 5) {
                // 激活状态 - 绿色发光
                const intensity = 1 - (activeIndex - i) * 0.2;
                seg.material.color.setHex(0x00ff88);
                seg.material.emissive.setHex(0x00ff88);
                seg.material.emissiveIntensity = 0.6 * Math.max(0, intensity);
            } else if (i < activeIndex - 5) {
                // 已传过 - 恢复但略亮
                seg.material.color.setHex(this.colors.axon);
                seg.material.emissive.setHex(this.colors.axon);
                seg.material.emissiveIntensity = 0.2;
            } else {
                // 未激活
                seg.material.color.setHex(this.colors.axon);
                seg.material.emissive.setHex(this.colors.axon);
                seg.material.emissiveIntensity = 0.1;
            }
        });
    }

    /**
     * 释放神经递质
     */
    releaseNeurotransmitters() {
        // 突触前神经元末梢位置（相对于场景中心）
        const baseY = 2; // 与神经元相同的基础高度
        const startPos = new THREE.Vector3(-0.5, baseY, 0);  // 突触前
        const endPos = new THREE.Vector3(0.5, baseY, 0);     // 突触后
        
        for (let i = 0; i < 20; i++) {
            const ntGeo = new THREE.SphereGeometry(0.08, 8, 8);
            const ntMat = new THREE.MeshStandardMaterial({
                color: this.colors.neurotransmitter,
                emissive: this.colors.neurotransmitter,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 1
            });
            const nt = new THREE.Mesh(ntGeo, ntMat);
            
            // 随机偏移起始位置
            nt.position.copy(startPos);
            nt.position.y += (Math.random() - 0.5) * 0.6;
            nt.position.z += (Math.random() - 0.5) * 0.6;
            
            nt.userData = {
                startPos: nt.position.clone(),
                endPos: endPos.clone().add(new THREE.Vector3(
                    0,
                    (Math.random() - 0.5) * 0.6,
                    (Math.random() - 0.5) * 0.6
                )),
                progress: 0,
                speed: 0.015 + Math.random() * 0.01,
                delay: this.animationTime + i * 0.08
            };
            
            this.mainGroup.add(nt);
            this.neurotransmitters.push(nt);
        }
    }

    /**
     * 创建信息面板
     */
    createInfoPanel() {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        const panel = document.createElement('div');
        panel.id = 'neuron-info-panel';
        panel.className = 'neuron-info-panel';
        panel.innerHTML = `
            <div class="panel-header">
                <i class="fas fa-brain"></i>
                <span>神经元信号传递</span>
            </div>
            <div class="voltage-display">
                <div class="voltage-label">膜电位</div>
                <div class="voltage-value" id="membrane-voltage">-70 mV</div>
                <div class="voltage-bar">
                    <div class="voltage-fill" id="voltage-fill"></div>
                    <div class="voltage-threshold"></div>
                </div>
                <div class="voltage-labels">
                    <span>-90mV</span>
                    <span>阈值 -55mV</span>
                    <span>+40mV</span>
                </div>
            </div>
            <div class="step-indicator">
                <span class="step-name" id="current-step-name">神经元结构</span>
            </div>
        `;
        container.appendChild(panel);
    }

    /**
     * 更新电压显示
     */
    updateVoltageDisplay(voltage) {
        const voltageEl = document.getElementById('membrane-voltage');
        const fillEl = document.getElementById('voltage-fill');
        
        if (voltageEl) {
            voltageEl.textContent = `${voltage.toFixed(0)} mV`;
            
            // 颜色变化
            if (voltage > -55) {
                voltageEl.style.color = '#ffeb3b';
            } else {
                voltageEl.style.color = '#4fc3f7';
            }
        }
        
        if (fillEl) {
            // 映射 -90mV ~ +40mV 到 0% ~ 100%
            const percent = ((voltage + 90) / 130) * 100;
            fillEl.style.width = `${Math.max(0, Math.min(100, percent))}%`;
            
            // 超过阈值变色
            if (voltage > -55) {
                fillEl.style.background = 'linear-gradient(90deg, #4fc3f7, #ffeb3b)';
            } else {
                fillEl.style.background = '#4fc3f7';
            }
        }
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404060, 0.4);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
        mainLight.position.set(5, 10, 5);
        this.scene.add(mainLight);
        
        const blueLight = new THREE.PointLight(0x4fc3f7, 0.5, 20);
        blueLight.position.set(-5, 0, 5);
        this.scene.add(blueLight);
        
        const purpleLight = new THREE.PointLight(0xab47bc, 0.3, 15);
        purpleLight.position.set(5, 0, 5);
        this.scene.add(purpleLight);
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="neuron-controls">
                <div class="control-group">
                    <label>教学步骤</label>
                    <div class="step-nav">
                        <button class="step-btn" id="btn-prev-step"><i class="fas fa-chevron-left"></i></button>
                        <div class="step-indicators">
                            ${this.steps.map((s, i) => `
                                <div class="step-dot ${i === 0 ? 'active' : ''}" data-step="${i}" title="${s.name}">
                                    ${i + 1}
                                </div>
                            `).join('')}
                        </div>
                        <button class="step-btn" id="btn-next-step"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </div>
                <div class="step-info">
                    <div class="step-title" id="step-title">${this.steps[0].name}</div>
                    <div class="step-desc" id="step-desc">${this.steps[0].desc}</div>
                </div>
                <div class="control-group buttons">
                    <button class="action-btn" id="btn-fire">
                        <i class="fas fa-bolt"></i> 发放信号
                    </button>
                    <button class="action-btn" id="btn-auto-neuron">
                        <i class="fas fa-play"></i> 自动演示
                    </button>
                    <button class="action-btn" id="btn-reset-neuron">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.getElementById('btn-prev-step')?.addEventListener('click', () => {
            this.goToStep(this.currentStep - 1);
        });
        
        document.getElementById('btn-next-step')?.addEventListener('click', () => {
            this.goToStep(this.currentStep + 1);
        });
        
        document.querySelectorAll('.step-dot').forEach(dot => {
            dot.addEventListener('click', (e) => {
                const step = parseInt(e.target.dataset.step);
                this.goToStep(step);
            });
        });
        
        document.getElementById('btn-fire')?.addEventListener('click', () => {
            this.fireSignal();
        });
        
        document.getElementById('btn-auto-neuron')?.addEventListener('click', (e) => {
            this.isPlaying = !this.isPlaying;
            e.target.innerHTML = this.isPlaying 
                ? '<i class="fas fa-pause"></i> 暂停'
                : '<i class="fas fa-play"></i> 自动演示';
            
            if (this.isPlaying) {
                this.startAutoDemo();
            }
        });
        
        document.getElementById('btn-reset-neuron')?.addEventListener('click', () => {
            this.resetScene();
        });
    }

    /**
     * 跳转到指定步骤
     */
    goToStep(step) {
        if (step < 0 || step >= this.steps.length) return;
        
        this.currentStep = step;
        
        // 更新UI
        document.querySelectorAll('.step-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === step);
            dot.classList.toggle('completed', i < step);
        });
        
        document.getElementById('step-title').textContent = this.steps[step].name;
        document.getElementById('step-desc').textContent = this.steps[step].desc;
        document.getElementById('current-step-name').textContent = this.steps[step].name;
        
        // 执行步骤动作
        this.executeStep(step);
    }

    /**
     * 执行教学步骤
     */
    executeStep(step) {
        switch(step) {
            case 0: // 神经元结构
                this.highlightStructure();
                this.updateVoltageDisplay(-70);
                break;
            case 1: // 静息电位
                this.showRestingPotential();
                break;
            case 2: // 动作电位
                this.demonstrateActionPotential();
                break;
            case 3: // 突触传递
                this.demonstrateSynapticTransmission();
                break;
            case 4: // 信号整合
                this.demonstrateSignalIntegration();
                break;
        }
    }

    /**
     * 高亮结构
     */
    highlightStructure() {
        this.showGuide('👆 点击神经元的各个部分了解详情');
    }

    /**
     * 展示静息电位
     */
    showRestingPotential() {
        this.updateVoltageDisplay(-70);
        this.showGuide('⚡ 静息状态：膜电位维持在 -70mV');
    }

    /**
     * 演示动作电位
     */
    demonstrateActionPotential() {
        // 电压变化动画
        let voltage = -70;
        const animate = () => {
            if (voltage < 40) {
                voltage += 5;
                this.updateVoltageDisplay(voltage);
                requestAnimationFrame(animate);
            } else {
                // 复极化
                setTimeout(() => {
                    const repolarize = () => {
                        if (voltage > -70) {
                            voltage -= 3;
                            this.updateVoltageDisplay(voltage);
                            requestAnimationFrame(repolarize);
                        }
                    };
                    repolarize();
                }, 200);
            }
        };
        animate();
        
        // 创建动作电位脉冲
        const preNeuron = this.neurons[0];
        this.createActionPotential(preNeuron);
        
        this.showGuide('⚡ 动作电位：快速去极化 → 复极化');
    }

    /**
     * 演示突触传递
     */
    demonstrateSynapticTransmission() {
        this.releaseNeurotransmitters();
        this.showGuide('🔵 神经递质穿越突触间隙，与受体结合');
    }

    /**
     * 演示信号整合
     */
    demonstrateSignalIntegration() {
        // 从多个输入神经元发送信号
        this.neurons.slice(2).forEach((neuron, i) => {
            setTimeout(() => {
                this.createActionPotential(neuron);
            }, i * 500);
        });
        
        this.showGuide('🧠 多个信号汇聚到胞体，进行整合');
    }

    /**
     * 发放信号
     */
    fireSignal() {
        const preNeuron = this.neurons[0];
        this.createActionPotential(preNeuron);
        
        // 电压变化
        let voltage = -70;
        const animate = () => {
            if (voltage < 40) {
                voltage += 8;
                this.updateVoltageDisplay(voltage);
                requestAnimationFrame(animate);
            } else {
                setTimeout(() => {
                    const repolarize = () => {
                        if (voltage > -70) {
                            voltage -= 5;
                            this.updateVoltageDisplay(voltage);
                            requestAnimationFrame(repolarize);
                        }
                    };
                    repolarize();
                }, 100);
            }
        };
        animate();
    }

    /**
     * 开始自动演示
     */
    startAutoDemo() {
        this.goToStep(0);
        
        const autoAdvance = () => {
            if (!this.isPlaying) return;
            
            setTimeout(() => {
                if (this.currentStep < this.steps.length - 1) {
                    this.goToStep(this.currentStep + 1);
                    autoAdvance();
                } else {
                    this.isPlaying = false;
                    const btn = document.getElementById('btn-auto-neuron');
                    if (btn) btn.innerHTML = '<i class="fas fa-play"></i> 自动演示';
                }
            }, 4000);
        };
        
        autoAdvance();
    }

    /**
     * 重置场景
     */
    resetScene() {
        // 清除动作电位
        this.actionPotentials.forEach(ap => {
            this.mainGroup.remove(ap);
        });
        this.actionPotentials = [];
        
        // 清除神经递质
        this.neurotransmitters.forEach(nt => {
            this.mainGroup.remove(nt);
        });
        this.neurotransmitters = [];
        
        // 重置状态
        this.currentStep = 0;
        this.isPlaying = false;
        this.updateVoltageDisplay(-70);
        
        // 更新UI
        document.querySelectorAll('.step-dot').forEach((dot, i) => {
            dot.classList.toggle('active', i === 0);
            dot.classList.remove('completed');
        });
        
        document.getElementById('step-title').textContent = this.steps[0].name;
        document.getElementById('step-desc').textContent = this.steps[0].desc;
        
        const btn = document.getElementById('btn-auto-neuron');
        if (btn) btn.innerHTML = '<i class="fas fa-play"></i> 自动演示';
        
        this.showGuide('🔄 场景已重置');
    }

    /**
     * 显示引导消息
     */
    showGuide(message) {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        // 移除旧消息
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
            this.showGuide('🧠 神经元信号传递：探索大脑的"电话线"');
        }, 500);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        this.animationTime = time;
        
        // 背景粒子漂浮和旋转
        if (this.bgParticles) {
            this.bgParticles.rotation.y = time * 0.02;
            const positions = this.bgParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.sin(time * 0.3 + i * 0.05) * 0.002;
            }
            this.bgParticles.geometry.attributes.position.needsUpdate = true;
        }
        
        // 更新动作电位脉冲
        for (let i = this.actionPotentials.length - 1; i >= 0; i--) {
            const ap = this.actionPotentials[i];
            ap.userData.progress += ap.userData.speed;
            const progress = ap.userData.progress;
            const neuron = ap.userData.neuron;
            
            if (progress <= 1) {
                // 沿轴突传导
                const axon = neuron.userData.axon;
                if (axon && axon.userData.curve) {
                    const point = axon.userData.curve.getPoint(progress);
                    ap.position.set(
                        neuron.position.x + point.x * neuron.scale.x,
                        neuron.position.y + point.y * neuron.scale.y,
                        neuron.position.z + point.z * neuron.scale.z
                    );
                    
                    // 波浪式激活轴突段
                    this.activateAxonSegment(neuron, progress);
                }
                
                // 更新电流粒子尾迹
                if (ap.userData.particleTrail) {
                    this.updateElectricTrail(ap.userData.particleTrail, progress, neuron, time);
                }
                
                // 脉冲核心效果
                const scale = 1 + Math.sin(time * 12) * 0.25;
                ap.scale.setScalar(scale);
                
                // 脉冲旋转
                ap.rotation.x = time * 5;
                
                // 子元素发光变化
                ap.children.forEach((child, idx) => {
                    if (child.material && child.material.opacity !== undefined) {
                        const phase = time * 15 + idx * 0.5;
                        child.material.opacity = 0.5 + Math.sin(phase) * 0.4;
                    }
                });
                
                // 更新电压显示（模拟去极化）
                if (progress < 0.3) {
                    const voltage = -70 + progress * 300; // 快速去极化
                    this.updateVoltageDisplay(Math.min(40, voltage));
                } else if (progress < 0.5) {
                    const voltage = 40 - (progress - 0.3) * 500; // 复极化
                    this.updateVoltageDisplay(Math.max(-70, voltage));
                }
                
            } else if (progress > 1.0 && progress <= 1.5) {
                // 到达末梢，释放神经递质
                if (!ap.userData.released && neuron.userData.id === 'pre') {
                    ap.userData.released = true;
                    this.releaseNeurotransmitters();
                    this.showGuide('🔵 神经递质释放！穿越突触间隙...');
                }
                
                // 淡出
                ap.children.forEach(child => {
                    if (child.material && child.material.opacity !== undefined) {
                        child.material.opacity *= 0.95;
                    }
                });
            }
            
            if (progress > 1.8) {
                // 清理粒子尾迹
                if (ap.userData.particleTrail) {
                    this.mainGroup.remove(ap.userData.particleTrail);
                }
                // 重置轴突颜色
                this.resetAxonColor(neuron);
                this.mainGroup.remove(ap);
                this.actionPotentials.splice(i, 1);
            }
        }
        
        // 更新神经递质
        for (let i = this.neurotransmitters.length - 1; i >= 0; i--) {
            const nt = this.neurotransmitters[i];
            if (this.animationTime > nt.userData.delay) {
                nt.userData.progress += nt.userData.speed;
                
                if (nt.userData.progress <= 1) {
                    // 抛物线运动
                    const p = nt.userData.progress;
                    const arcHeight = Math.sin(p * Math.PI) * 0.3;
                    
                    nt.position.lerpVectors(
                        nt.userData.startPos,
                        nt.userData.endPos,
                        p
                    );
                    nt.position.y += arcHeight;
                    
                    // 旋转
                    nt.rotation.x = time * 5;
                    nt.rotation.y = time * 3;
                    
                    // 到达受体时闪烁
                    if (p > 0.7) {
                        const flash = Math.sin(time * 30) * 0.5 + 0.5;
                        nt.material.emissiveIntensity = 0.3 + flash * 0.7;
                        nt.scale.setScalar(1 + flash * 0.3);
                    }
                } else {
                    this.mainGroup.remove(nt);
                    this.neurotransmitters.splice(i, 1);
                }
            }
        }
        
        // 神经元呼吸效果 + 发光
        this.neurons.forEach((neuron, idx) => {
            if (neuron.userData.soma) {
                const pulse = 1 + Math.sin(time * 1.5 + idx) * 0.04;
                neuron.userData.soma.scale.setScalar(pulse);
                
                // 胞体发光强度
                if (neuron.userData.soma.material.emissiveIntensity !== undefined) {
                    neuron.userData.soma.material.emissiveIntensity = 0.15 + Math.sin(time * 2 + idx) * 0.1;
                }
            }
        });
        
        // 突触区域脉动
        this.synapses.forEach(synapse => {
            synapse.rotation.y = Math.sin(time * 0.3) * 0.03;
        });
    }
    
    /**
     * 重置轴突颜色
     */
    resetAxonColor(neuron) {
        if (!neuron.userData.axon) return;
        
        const segments = neuron.userData.axon.userData.segments;
        if (!segments) return;
        
        segments.forEach(seg => {
            seg.material.color.setHex(this.colors.axon);
            seg.material.emissive.setHex(this.colors.axon);
            seg.material.emissiveIntensity = 0.1;
        });
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        const interactables = [];
        
        this.neurons.forEach(neuron => {
            neuron.traverse(child => {
                if (child.userData && child.userData.isInteractive) {
                    interactables.push(child);
                }
            });
        });
        
        this.synapses.forEach(synapse => {
            synapse.traverse(child => {
                if (child.userData && child.userData.isInteractive) {
                    interactables.push(child);
                }
            });
        });
        
        return interactables;
    }

    /**
     * 清理
     */
    dispose() {
        this.isPlaying = false;
        
        // 清除自动信号定时器
        if (this.autoSignalInterval) {
            clearInterval(this.autoSignalInterval);
            this.autoSignalInterval = null;
        }
        
        // 清理动作电位和粒子尾迹
        this.actionPotentials.forEach(ap => {
            if (ap.userData.particleTrail) {
                this.mainGroup.remove(ap.userData.particleTrail);
            }
            this.mainGroup.remove(ap);
        });
        this.actionPotentials = [];
        
        // 清理神经递质
        this.neurotransmitters.forEach(nt => {
            this.mainGroup.remove(nt);
        });
        this.neurotransmitters = [];
        
        // 移除信息面板
        const panel = document.getElementById('neuron-info-panel');
        if (panel) panel.remove();
    }
}

// 注册到全局
window.NeuronSignalScene = NeuronSignalScene;
