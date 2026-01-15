/**
 * 注意力机制原理场景 - Transformer Self-Attention可视化
 * ============================================
 * 核心原理：
 * - Query-Key-Value：每个词产生三个向量用于计算注意力
 * - 注意力权重：通过点积计算词与词之间的相关性
 * - 加权求和：根据权重聚合信息生成新表示
 * ============================================
 */
window.AttentionScene = class AttentionScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 场景元素
        this.tokenNodes = [];
        this.qkvNodes = [];
        this.attentionLines = [];
        this.weightLabels = [];
        this.bgParticles = null;
        
        this.params = {
            selectedToken: null,
            showQKV: false,
            animationSpeed: 1
        };
        
        // 输入句子
        this.sentence = ['我', '爱', '学习', '人工', '智能'];
        
        // 自动播放状态
        this.isAutoPlaying = false;
        this.autoPlayStep = 0;
    }

    init() {
        // 相机位置
        this.camera.position.set(0, 10, 35);
        this.camera.lookAt(0, 0, 0);
        
        // 背景
        this.scene.background = new THREE.Color(0x0a0a18);
        this.scene.fog = new THREE.FogExp2(0x0a0a18, 0.012);
        
        // 光照
        this.setupLights();
        
        // 地面网格
        const grid = new THREE.GridHelper(60, 60, 0x333366, 0x1a1a2e);
        grid.position.y = -8;
        this.scene.add(grid);
        
        // 场景内容
        this.setupScene();
        
        // 背景粒子
        this.setupBackground();
        
        // UI
        this.setupUI();
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(15, 25, 15);
        this.scene.add(mainLight);
        
        const blueLight = new THREE.PointLight(0x3b82f6, 2, 40);
        blueLight.position.set(-10, 10, 10);
        this.scene.add(blueLight);
        
        const purpleLight = new THREE.PointLight(0x8b5cf6, 2, 40);
        purpleLight.position.set(10, 10, -10);
        this.scene.add(purpleLight);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // === 创建Token节点 ===
        this.createTokenNodes();
        
        // === 创建Q-K-V展示区 ===
        this.createQKVDisplay();
        
        // === 创建注意力连线 ===
        this.createAttentionLines();
        
        // === 创建输出层 ===
        this.createOutputLayer();
        
        // === 创建装饰元素 ===
        this.createDecorations();
    }

    createTokenNodes() {
        const startX = -((this.sentence.length - 1) * 5) / 2;
        
        this.sentence.forEach((word, i) => {
            const group = new THREE.Group();
            group.position.set(startX + i * 5, 0, 0);
            
            // 主球体
            const sphereGeo = new THREE.SphereGeometry(1.2, 32, 32);
            const sphereMat = new THREE.MeshStandardMaterial({
                color: 0x3b82f6,
                emissive: 0x1a3a6e,
                emissiveIntensity: 0.4,
                metalness: 0.3,
                roughness: 0.4
            });
            const sphere = new THREE.Mesh(sphereGeo, sphereMat);
            group.add(sphere);
            
            // 外圈光环
            const ringGeo = new THREE.TorusGeometry(1.6, 0.08, 16, 48);
            const ringMat = new THREE.MeshBasicMaterial({
                color: 0x00aaff,
                transparent: true,
                opacity: 0.6
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.rotation.x = Math.PI / 2;
            group.add(ring);
            
            // 文字精灵
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(word, 64, 42);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({ 
                map: texture, 
                transparent: true 
            });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(3, 1.5, 1);
            sprite.position.y = 2.5;
            group.add(sprite);
            
            // 交互配置
            sphere.userData = {
                // 悬停提示
                hoverTitle: `词元 "${word}"`,
                hoverDesc: '点击查看注意力关系',
                hoverIcon: 'fa-font',
                // 点击详情
                name: `词元: "${word}"`,
                tokenIndex: i,
                description: `
                    <p class="text-lg font-bold text-blue-400 mb-3">📝 Token #${i + 1}: ${word}</p>
                    <p class="text-gray-300 mb-3">在Transformer中，每个词被转换为向量表示（词嵌入）。</p>
                    <div class="bg-gray-800 rounded p-3 mb-3">
                        <p class="text-sm text-gray-400">向量维度: 512维</p>
                        <p class="text-sm text-gray-400">位置编码: 已添加</p>
                    </div>
                    <p class="text-sm text-purple-400">💡 点击可查看该词与其他词的注意力关系</p>
                `,
                onClick: (target) => {
                    this.highlightObject(target);
                    this.showInfoPanel(target);
                    this.activateAttention(i);
                }
            };
            
            this.interactables.push(sphere);
            this.tokenNodes.push({ group, sphere, ring, index: i });
            this.mainGroup.add(group);
        });
    }

    createQKVDisplay() {
        // Q-K-V 标签和节点
        const qkvLabels = [
            { name: 'Query (查询)', desc: '用于查询其他词的信息', color: 0xef4444, x: -12 },
            { name: 'Key (键)', desc: '用于被其他词查询', color: 0x10b981, x: 0 },
            { name: 'Value (值)', desc: '包含实际信息内容', color: 0xf59e0b, x: 12 }
        ];
        
        qkvLabels.forEach((item, idx) => {
            const group = new THREE.Group();
            group.position.set(item.x, 8, -8);
            
            // 立方体
            const boxGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
            const boxMat = new THREE.MeshStandardMaterial({
                color: item.color,
                emissive: item.color,
                emissiveIntensity: 0.3,
                metalness: 0.4,
                roughness: 0.3,
                transparent: true,
                opacity: 0.9
            });
            const box = new THREE.Mesh(boxGeo, boxMat);
            group.add(box);
            
            // 边框
            const edges = new THREE.EdgesGeometry(boxGeo);
            const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5 });
            const wireframe = new THREE.LineSegments(edges, lineMat);
            group.add(wireframe);
            
            // 标签
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 64;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.name, 128, 40);
            
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
            const sprite = new THREE.Sprite(spriteMat);
            sprite.scale.set(6, 1.5, 1);
            sprite.position.y = 2.5;
            group.add(sprite);
            
            // 交互
            box.userData = {
                // 悬停提示
                hoverTitle: item.name,
                hoverDesc: item.desc,
                hoverIcon: ['fa-search', 'fa-key', 'fa-database'][idx],
                // 点击详情
                name: item.name,
                description: `
                    <p class="text-lg font-bold mb-3" style="color: #${item.color.toString(16)}">${item.name}</p>
                    <p class="text-gray-300 mb-3">${item.desc}</p>
                    <div class="bg-gray-800 rounded p-3 mb-3">
                        <p class="text-sm text-gray-400">计算方式: X × W${['q', 'k', 'v'][idx]}</p>
                        <p class="text-sm text-gray-400">矩阵维度: [seq_len, d_model]</p>
                    </div>
                    <p class="text-sm text-blue-400">💡 每个Token都会产生自己的Q、K、V向量</p>
                `,
                onClick: (target) => {
                    this.highlightObject(target);
                    this.showInfoPanel(target);
                }
            };
            
            this.interactables.push(box);
            this.qkvNodes.push({ group, box, type: ['Q', 'K', 'V'][idx] });
            this.mainGroup.add(group);
        });
    }

    createAttentionLines() {
        // 创建注意力连接线（初始隐藏）
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x00ffff,
            transparent: true,
            opacity: 0
        });
        
        this.sentence.forEach((_, i) => {
            const lines = [];
            this.sentence.forEach((_, j) => {
                const startX = -((this.sentence.length - 1) * 5) / 2 + i * 5;
                const endX = -((this.sentence.length - 1) * 5) / 2 + j * 5;
                
                const curve = new THREE.QuadraticBezierCurve3(
                    new THREE.Vector3(startX, 0, 0),
                    new THREE.Vector3((startX + endX) / 2, 4 + Math.abs(i - j) * 0.8, -2),
                    new THREE.Vector3(endX, 0, 0)
                );
                
                const points = curve.getPoints(20);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, lineMat.clone());
                line.userData.fromToken = i;
                line.userData.toToken = j;
                line.userData.weight = Math.random() * 0.5 + 0.1; // 模拟权重
                
                this.mainGroup.add(line);
                lines.push(line);
            });
            this.attentionLines.push(lines);
        });
    }

    createOutputLayer() {
        // 输出层标识
        const outputGroup = new THREE.Group();
        outputGroup.position.set(0, -5, 0);
        
        // 底座
        const baseGeo = new THREE.CylinderGeometry(8, 10, 1, 32);
        const baseMat = new THREE.MeshStandardMaterial({
            color: 0x1a1a3e,
            emissive: 0x0a0a1e,
            emissiveIntensity: 0.5,
            metalness: 0.5,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        outputGroup.add(base);
        
        // 标签
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#8b5cf6';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('输出层 (加权求和)', 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(8, 2, 1);
        sprite.position.y = 1.5;
        outputGroup.add(sprite);
        
        base.userData = {
            hoverTitle: '输出层',
            hoverDesc: '加权求和生成新表示',
            hoverIcon: 'fa-layer-group',
            name: '输出层',
            description: `
                <p class="text-lg font-bold text-purple-400 mb-3">📤 注意力输出</p>
                <p class="text-gray-300 mb-3">将所有Value向量按注意力权重加权求和，得到新的表示。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">公式: Output = Σ(attention_weight × V)</p>
                    <p class="text-sm text-gray-400">含义: 聚合相关词的信息</p>
                </div>
                <p class="text-sm text-green-400">✨ 这就是"注意力"的核心：选择性关注</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        
        this.interactables.push(base);
        this.mainGroup.add(outputGroup);
    }

    createDecorations() {
        // Softmax 计算符号
        const softmaxGroup = new THREE.Group();
        softmaxGroup.position.set(20, 5, 0);
        
        const sphereGeo = new THREE.SphereGeometry(1.5, 32, 32);
        const sphereMat = new THREE.MeshStandardMaterial({
            color: 0xff6b6b,
            emissive: 0x661a1a,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 0.4
        });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        softmaxGroup.add(sphere);
        
        // 标签
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Softmax', 64, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.scale.set(4, 2, 1);
        sprite.position.y = 2.5;
        softmaxGroup.add(sprite);
        
        sphere.userData = {
            hoverTitle: 'Softmax',
            hoverDesc: '将分数归一化为概率',
            hoverIcon: 'fa-percentage',
            name: 'Softmax 归一化',
            description: `
                <p class="text-lg font-bold text-red-400 mb-3">🔢 Softmax 函数</p>
                <p class="text-gray-300 mb-3">将注意力分数转换为概率分布，所有权重之和为1。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">公式: softmax(x_i) = e^(x_i) / Σe^(x_j)</p>
                    <p class="text-sm text-gray-400">作用: 归一化注意力权重</p>
                </div>
                <p class="text-sm text-yellow-400">⚡ 使得模型可以"软性"选择关注的内容</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        
        this.interactables.push(sphere);
        this.mainGroup.add(softmaxGroup);
        
        // 点积计算符号
        const dotProductGroup = new THREE.Group();
        dotProductGroup.position.set(-20, 5, 0);
        
        const torusGeo = new THREE.TorusKnotGeometry(1, 0.3, 64, 16);
        const torusMat = new THREE.MeshStandardMaterial({
            color: 0x22c55e,
            emissive: 0x0a3a1a,
            emissiveIntensity: 0.4,
            metalness: 0.3,
            roughness: 0.4
        });
        const torus = new THREE.Mesh(torusGeo, torusMat);
        dotProductGroup.add(torus);
        
        const canvas2 = document.createElement('canvas');
        canvas2.width = 128;
        canvas2.height = 64;
        const ctx2 = canvas2.getContext('2d');
        ctx2.fillStyle = '#22c55e';
        ctx2.font = 'bold 18px Arial';
        ctx2.textAlign = 'center';
        ctx2.fillText('Q·K 点积', 64, 40);
        
        const texture2 = new THREE.CanvasTexture(canvas2);
        const spriteMat2 = new THREE.SpriteMaterial({ map: texture2, transparent: true });
        const sprite2 = new THREE.Sprite(spriteMat2);
        sprite2.scale.set(4, 2, 1);
        sprite2.position.y = 2.5;
        dotProductGroup.add(sprite2);
        
        torus.userData = {
            hoverTitle: 'Q·K 点积',
            hoverDesc: '计算词之间的相似度',
            hoverIcon: 'fa-times',
            name: 'Q·K 点积计算',
            description: `
                <p class="text-lg font-bold text-green-400 mb-3">✖️ 点积运算</p>
                <p class="text-gray-300 mb-3">通过Query和Key的点积计算两个词之间的相似度。</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-gray-400">公式: score = Q · K^T / √d_k</p>
                    <p class="text-sm text-gray-400">√d_k: 缩放因子，防止梯度消失</p>
                </div>
                <p class="text-sm text-blue-400">💡 点积越大，表示两个词的相关性越强</p>
            `,
            onClick: (target) => {
                this.highlightObject(target);
                this.showInfoPanel(target);
            }
        };
        
        this.interactables.push(torus);
        this.mainGroup.add(dotProductGroup);
    }

    setupBackground() {
        // 背景粒子
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 60;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: 0x6688ff,
            size: 0.3,
            transparent: true,
            opacity: 0.6
        });
        
        this.bgParticles = new THREE.Points(geometry, material);
        this.scene.add(this.bgParticles);
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn active" id="btn-step1">
                <i class="fas fa-1"></i> 词嵌入
            </button>
            <button class="control-btn" id="btn-step2">
                <i class="fas fa-2"></i> Q·K计算
            </button>
            <button class="control-btn" id="btn-step3">
                <i class="fas fa-3"></i> 注意力权重
            </button>
            <button class="control-btn" id="btn-animate">
                <i class="fas fa-play"></i> 完整演示
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        // 教学步骤按钮
        document.getElementById('btn-step1').onclick = () => this.showStep(1);
        document.getElementById('btn-step2').onclick = () => this.showStep(2);
        document.getElementById('btn-step3').onclick = () => this.showStep(3);
        document.getElementById('btn-animate').onclick = () => this.playFullAnimation();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
        
        // 默认显示步骤1
        this.currentStep = 1;
    }
    
    // 重置视角
    resetView() {
        gsap.to(this.camera.position, {
            x: 0, y: 10, z: 35,
            duration: 0.8,
            ease: 'power2.out'
        });
        this.camera.lookAt(0, 0, 0);
    }
    
    // 教学步骤展示
    showStep(step) {
        this.currentStep = step;
        
        // 更新按钮状态
        document.querySelectorAll('#scene-controls .control-btn').forEach((btn, i) => {
            if (i < 3) btn.classList.toggle('active', i === step - 1);
        });
        
        // 隐藏所有注意力线
        this.attentionLines.forEach(lines => {
            lines.forEach(line => {
                gsap.to(line.material, { opacity: 0, duration: 0.3 });
            });
        });
        
        const container = document.getElementById('scene-canvas-container');
        
        if (step === 1) {
            // 步骤1：词嵌入 - 高亮Token节点
            this.highlightTokens();
            this.showStepGuide('📝 每个词被转换为向量（词嵌入）', container);
        } else if (step === 2) {
            // 步骤2：Q·K计算 - 高亮QKV和点积
            this.highlightQKV();
            this.showStepGuide('🔢 计算Query与Key的点积得到相似度', container);
        } else if (step === 3) {
            // 步骤3：注意力权重 - 显示注意力线
            this.toggleAllAttention();
            this.showStepGuide('🔗 注意力权重决定信息聚合比例', container);
        }
    }
    
    showStepGuide(message, container) {
        // 移除旧提示
        const old = container.querySelector('.scene-guide-message');
        if (old) old.remove();
        
        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        container.appendChild(guide);
        
        setTimeout(() => guide.classList.add('visible'), 100);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 300);
        }, 4000);
    }
    
    highlightTokens() {
        // 高亮所有Token节点
        this.tokenNodes.forEach((node, i) => {
            gsap.to(node.sphere.scale, {
                x: 1.3, y: 1.3, z: 1.3,
                duration: 0.3,
                delay: i * 0.1,
                yoyo: true,
                repeat: 1
            });
        });
    }
    
    highlightQKV() {
        // 高亮QKV节点
        this.qkvNodes.forEach((node, i) => {
            gsap.to(node.box.scale, {
                x: 1.2, y: 1.2, z: 1.2,
                duration: 0.3,
                delay: i * 0.15,
                yoyo: true,
                repeat: 1
            });
        });
    }
    
    playFullAnimation() {
        // 完整动画演示
        this.showStep(1);
        setTimeout(() => this.showStep(2), 3000);
        setTimeout(() => this.showStep(3), 6000);
    }
    
    // 开始自动播放（模态框关闭后调用）
    startAutoPlay() {
        this.isAutoPlaying = true;
        // 延迟启动，让用户先看到场景
        setTimeout(() => {
            if (this.isAutoPlaying) {
                this.playFullAnimation();
            }
        }, 500);
    }
    
    // 暂停/恢复自动播放
    toggleAutoPlay() {
        this.isAutoPlaying = !this.isAutoPlaying;
        const btn = document.getElementById('btn-animate');
        if (btn) {
            btn.innerHTML = this.isAutoPlaying 
                ? '<i class="fas fa-pause"></i> 暂停' 
                : '<i class="fas fa-play"></i> 完整演示';
        }
    }

    activateAttention(tokenIndex) {
        // 重置所有线条
        this.attentionLines.forEach(lines => {
            lines.forEach(line => {
                line.material.opacity = 0;
            });
        });
        
        // 显示选中Token的注意力线
        if (this.attentionLines[tokenIndex]) {
            this.attentionLines[tokenIndex].forEach((line, j) => {
                const weight = line.userData.weight;
                gsap.to(line.material, {
                    opacity: weight,
                    duration: 0.5,
                    delay: j * 0.1
                });
                
                // 线条粗细根据权重
                line.material.linewidth = weight * 3;
            });
        }
        
        this.params.selectedToken = tokenIndex;
    }

    toggleAllAttention() {
        const showAll = !this.params.showQKV;
        this.params.showQKV = showAll;
        
        this.attentionLines.forEach((lines, i) => {
            lines.forEach((line, j) => {
                const weight = line.userData.weight;
                gsap.to(line.material, {
                    opacity: showAll ? weight * 0.5 : 0,
                    duration: 0.5
                });
            });
        });
    }

    playAnimation() {
        // 依次激活每个Token的注意力
        let delay = 0;
        this.sentence.forEach((_, i) => {
            setTimeout(() => {
                this.activateAttention(i);
                
                // 高亮当前Token
                if (this.tokenNodes[i]) {
                    gsap.to(this.tokenNodes[i].sphere.scale, {
                        x: 1.3, y: 1.3, z: 1.3,
                        duration: 0.3
                    });
                    gsap.to(this.tokenNodes[i].sphere.scale, {
                        x: 1, y: 1, z: 1,
                        duration: 0.3,
                        delay: 0.5
                    });
                }
            }, delay);
            delay += 1000;
        });
    }

    highlightObject(target) {
        // 重置之前高亮
        if (this.highlighted && this.highlighted.material && this.highlighted.material.emissive) {
            this.highlighted.material.emissive.setHex(
                this.highlighted.userData.originalEmissive || 0
            );
        }
        
        // 新高亮
        if (target.material && target.material.emissive) {
            target.userData.originalEmissive = target.material.emissive.getHex();
            target.material.emissive.setHex(0x00ffff);
        }
        this.highlighted = target;
        
        // 缩放动画
        gsap.to(target.scale, { x: 1.2, y: 1.2, z: 1.2, duration: 0.2 });
        gsap.to(target.scale, { x: 1, y: 1, z: 1, duration: 0.2, delay: 0.2 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');
        
        title.innerHTML = `<i class="fas fa-info-circle mr-2"></i>${target.userData.name}`;
        content.innerHTML = target.userData.description;
        
        panel.classList.add('visible');
    }

    createLabels(manager) {
        manager.createLabel('输入词元', new THREE.Vector3(0, 3, 5), 'keyboard');
        manager.createLabel('Q-K-V变换', new THREE.Vector3(0, 11, -8), 'exchange-alt');
    }

    animate(time, delta) {
        // Token光环旋转
        this.tokenNodes.forEach((node, i) => {
            node.ring.rotation.z = time * 0.5 + i * 0.5;
        });
        
        // QKV立方体缓慢旋转
        this.qkvNodes.forEach((node, i) => {
            node.group.rotation.y = Math.sin(time * 0.3 + i) * 0.2;
        });
        
        // 背景粒子
        if (this.bgParticles) {
            this.bgParticles.rotation.y = time * 0.02;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        if (this.bgParticles) this.scene.remove(this.bgParticles);
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
        
        if (this.highlighted && this.highlighted.material && this.highlighted.material.emissive) {
            this.highlighted.material.emissive.setHex(
                this.highlighted.userData.originalEmissive || 0
            );
            this.highlighted = null;
        }
        
        // 隐藏注意力线
        this.attentionLines.forEach(lines => {
            lines.forEach(line => {
                gsap.to(line.material, { opacity: 0, duration: 0.3 });
            });
        });
    }
};
