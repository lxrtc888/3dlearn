/**
 * LLM 原理场景 - Transformer 架构可视化 (增强交互版)
 * ============================================
 * 核心原理：
 * - 自注意力机制：每个词同时关注所有其他词
 * - 多头注意力：多个"头"关注不同的语义关系
 * - 位置编码：让模型理解词的顺序
 * ============================================
 */
window.LLMScene = class LLMScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.llmGroup = null;
        this.tokenNodes = [];
        this.attentionLines = [];
        this.bgParticles = null;
        this.selectedToken = null;
        this.interactables = [];
        this.layerGroups = [];
    }

    init() {
        this.camera.position.set(0, 5, 40);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x0a0a15);
        this.scene.fog = new THREE.FogExp2(0x0a0a15, 0.015);

        // 灯光
        const ambient = new THREE.AmbientLight(0x334466, 0.5);
        this.scene.add(ambient);

        const point = new THREE.PointLight(0x3b82f6, 2, 60);
        point.position.set(0, 20, 20);
        this.scene.add(point);

        this.setupScene();
        this.setupBackground();
        this.setupUI();
    }

    setupScene() {
        this.llmGroup = new THREE.Group();
        this.scene.add(this.llmGroup);

        // 输入句子
        const sentence = ["我", "爱", "学习", "人工", "智能", "技术"];

        // 创建三层结构：输入层 -> 注意力层 -> 输出层
        const layers = [
            { name: '输入嵌入层', y: -8, color: 0x22c55e },
            { name: '注意力层', y: 0, color: 0x3b82f6 },
            { name: '输出层', y: 8, color: 0xf59e0b }
        ];

        layers.forEach((layer, layerIdx) => {
            const layerGroup = new THREE.Group();
            layerGroup.position.y = layer.y;

            // 层标签背景
            const labelBg = new THREE.Mesh(
                new THREE.PlaneGeometry(8, 1.5),
                new THREE.MeshBasicMaterial({ 
                    color: layer.color, 
                    transparent: true, 
                    opacity: 0.2,
                    side: THREE.DoubleSide
                })
            );
            labelBg.position.set(-15, 0, 0);
            labelBg.userData = { name: layer.name, desc: this.getLayerDesc(layerIdx) };
            labelBg.userData.onClick = () => this.showLayerInfo(layerIdx);
            layerGroup.add(labelBg);
            this.interactables.push(labelBg);

            // 创建该层的Token节点
            sentence.forEach((word, i) => {
                const x = (i - sentence.length / 2 + 0.5) * 5;

                // 节点球体
                const nodeGeo = new THREE.SphereGeometry(0.8, 32, 32);
                const nodeMat = new THREE.MeshStandardMaterial({
                    color: layer.color,
                    emissive: layer.color,
                    emissiveIntensity: 0.3,
                    metalness: 0.5,
                    roughness: 0.3
                });
                const node = new THREE.Mesh(nodeGeo, nodeMat);
                node.position.set(x, 0, 0);

                // 外圈光环
                const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 16, 32);
                const ringMat = new THREE.MeshBasicMaterial({ 
                    color: layer.color, 
                    transparent: true, 
                    opacity: 0.4 
                });
                const ring = new THREE.Mesh(ringGeo, ringMat);
                ring.rotation.x = Math.PI / 2;
                node.add(ring);

                // 数据属性
                node.userData = {
                    id: i,
                    word: word,
                    layer: layerIdx,
                    layerName: layer.name,
                    ring: ring,
                    originalColor: layer.color
                };
                node.userData.onClick = () => this.highlightTokenAndAttention(node);

                layerGroup.add(node);
                
                if (layerIdx === 1) {
                    this.tokenNodes.push(node);
                }
                this.interactables.push(node);
            });

            this.llmGroup.add(layerGroup);
            this.layerGroups.push(layerGroup);
        });

        // 创建层间连接线
        this.createLayerConnections(sentence.length);

        // 创建注意力层内部的连接
        this.createAttentionConnections();
    }

    getLayerDesc(idx) {
        const descs = [
            '将文字转换为高维向量（词嵌入），每个词变成一串数字，包含语义信息。',
            '核心！每个词"看"其他所有词，计算相关性权重，理解上下文关系。',
            '汇总注意力信息，预测下一个最可能的词，输出概率分布。'
        ];
        return descs[idx];
    }

    createLayerConnections(tokenCount) {
        // 输入层到注意力层的连接
        const lineMat = new THREE.LineBasicMaterial({
            color: 0x334455,
            transparent: true,
            opacity: 0.3
        });

        for (let i = 0; i < tokenCount; i++) {
            const x = (i - tokenCount / 2 + 0.5) * 5;

            // 输入 -> 注意力
            const points1 = [
                new THREE.Vector3(x, -8, 0),
                new THREE.Vector3(x, 0, 0)
            ];
            const line1 = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points1),
                lineMat.clone()
            );
            this.llmGroup.add(line1);

            // 注意力 -> 输出
            const points2 = [
                new THREE.Vector3(x, 0, 0),
                new THREE.Vector3(x, 8, 0)
            ];
            const line2 = new THREE.Line(
                new THREE.BufferGeometry().setFromPoints(points2),
                lineMat.clone()
            );
            this.llmGroup.add(line2);
        }
    }

    createAttentionConnections() {
        // 注意力层内部的连接 - 贝塞尔曲线
        this.tokenNodes.forEach((sourceNode, sourceIdx) => {
            this.tokenNodes.forEach((targetNode, targetIdx) => {
                if (sourceIdx === targetIdx) return;

                // 生成随机权重
                const weight = Math.random();
                if (weight < 0.3) return; // 只显示较强的连接

                const curve = new THREE.QuadraticBezierCurve3(
                    sourceNode.position.clone(),
                    new THREE.Vector3(
                        (sourceNode.position.x + targetNode.position.x) / 2,
                        3, // 上凸
                        0
                    ),
                    targetNode.position.clone()
                );

                const points = curve.getPoints(30);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0xff33cc,
                    transparent: true,
                    opacity: 0,
                    blending: THREE.AdditiveBlending
                });

                const line = new THREE.Line(geometry, material);
                line.userData = { 
                    source: sourceIdx, 
                    target: targetIdx, 
                    weight: weight 
                };
                this.layerGroups[1].add(line);
                this.attentionLines.push(line);
            });
        });
    }

    setupBackground() {
        // 数字雨背景粒子
        const count = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];

        for (let i = 0; i < count; i++) {
            positions.push(
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 40 - 20
            );
            const c = new THREE.Color().setHSL(0.6, 0.8, 0.3 + Math.random() * 0.2);
            colors.push(c.r, c.g, c.b);
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.4,
            vertexColors: true,
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });

        this.bgParticles = new THREE.Points(geometry, material);
        this.scene.add(this.bgParticles);
    }

    showLayerInfo(layerIdx) {
        const layers = [
            { name: '输入嵌入层 (Input Embedding)', icon: 'fa-keyboard' },
            { name: '自注意力层 (Self-Attention)', icon: 'fa-brain' },
            { name: '输出层 (Output)', icon: 'fa-comment' }
        ];

        const info = document.getElementById('info-content');
        if (info) {
            info.innerHTML = `
                <div class="mb-4">
                    <div class="text-2xl font-bold text-white mb-2">
                        <i class="fas ${layers[layerIdx].icon} mr-2"></i>${layers[layerIdx].name}
                    </div>
                    <div class="text-gray-300 text-sm leading-relaxed">${this.getLayerDesc(layerIdx)}</div>
                </div>
                <div class="bg-gradient-to-r from-blue-900/30 to-purple-900/30 p-4 rounded-lg border border-blue-500/30">
                    <div class="text-xs text-gray-400 mb-2">技术细节</div>
                    ${this.getLayerTechDetails(layerIdx)}
                </div>
                <p class="mt-4 text-xs text-gray-500">
                    💡 点击中间层的Token节点，查看注意力连接！
                </p>
            `;
        }
    }

    getLayerTechDetails(idx) {
        const details = [
            `<div class="font-mono text-sm text-green-400">
                embedding = Embed(token) + PositionalEncoding<br>
                维度: 768 / 1024 / 4096...
            </div>`,
            `<div class="font-mono text-sm text-blue-400">
                Q = W_q × X, K = W_k × X, V = W_v × X<br>
                Attention = softmax(Q·K^T / √d) × V
            </div>`,
            `<div class="font-mono text-sm text-yellow-400">
                logits = Linear(hidden_state)<br>
                probs = softmax(logits / temperature)
            </div>`
        ];
        return details[idx];
    }

    highlightTokenAndAttention(clickedNode) {
        this.selectedToken = clickedNode;
        const selectedId = clickedNode.userData.id;

        // 重置所有节点
        this.tokenNodes.forEach(node => {
            node.material.emissiveIntensity = 0.3;
            node.scale.setScalar(1);
            node.userData.ring.material.opacity = 0.4;
        });
        this.attentionLines.forEach(line => line.material.opacity = 0);

        // 高亮选中节点
        clickedNode.material.emissiveIntensity = 1;
        clickedNode.scale.setScalar(1.3);
        clickedNode.userData.ring.material.opacity = 1;

        // 激活相关连接
        let connections = [];
        this.attentionLines.forEach(line => {
            if (line.userData.source === selectedId) {
                line.material.opacity = line.userData.weight * 0.8;
                const targetNode = this.tokenNodes[line.userData.target];
                targetNode.material.emissiveIntensity = 0.7;
                targetNode.scale.setScalar(1.15);
                connections.push({
                    word: targetNode.userData.word,
                    weight: line.userData.weight
                });
            }
        });

        // 按权重排序
        connections.sort((a, b) => b.weight - a.weight);

        // 更新信息面板
        const info = document.getElementById('info-content');
        if (info) {
            info.innerHTML = `
                <div class="text-center mb-4">
                    <div class="text-4xl font-bold text-white mb-1">"${clickedNode.userData.word}"</div>
                    <div class="text-purple-400 font-mono text-xs">Token ID: ${selectedId} | Layer: ${clickedNode.userData.layerName}</div>
                </div>
                <div class="bg-black/40 p-3 rounded-lg mb-4">
                    <div class="text-xs text-gray-400 mb-2">词嵌入向量 (部分)</div>
                    <div class="font-mono text-xs text-cyan-400 break-all">
                        [${Array(8).fill(0).map(() => (Math.random() * 2 - 1).toFixed(3)).join(', ')}...]
                    </div>
                </div>
                <div class="bg-black/40 p-3 rounded-lg">
                    <div class="flex justify-between text-xs text-gray-400 mb-2">
                        <span>注意力目标</span>
                        <span>权重</span>
                    </div>
                    ${connections.slice(0, 5).map(c => `
                        <div class="flex justify-between text-sm border-b border-gray-700/50 py-1.5">
                            <span class="text-blue-300">"${c.word}"</span>
                            <span class="text-green-400 font-mono">${c.weight.toFixed(3)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        }
    }

    setupUI() {
        const infoTitle = document.getElementById('info-title');
        if (infoTitle) infoTitle.innerText = "Transformer 神经网络";

        const infoContent = document.getElementById('info-content');
        if (infoContent) {
            infoContent.innerHTML = `
                <div class="p-4 bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-lg border border-blue-500/30 mb-4">
                    <div class="font-bold text-blue-300 text-lg mb-2">
                        <i class="fas fa-brain mr-2"></i>Self-Attention Mechanism
                    </div>
                    <div class="text-sm text-gray-300 leading-relaxed">
                        大语言模型的核心！让每个词都能"看到"句子中的所有其他词，理解上下文关系。
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
                    <div class="bg-green-900/30 p-2 rounded border border-green-500/30">
                        <div class="text-green-400">输入层</div>
                    </div>
                    <div class="bg-blue-900/30 p-2 rounded border border-blue-500/30">
                        <div class="text-blue-400">注意力层</div>
                    </div>
                    <div class="bg-yellow-900/30 p-2 rounded border border-yellow-500/30">
                        <div class="text-yellow-400">输出层</div>
                    </div>
                </div>
                <div class="text-sm text-gray-400">
                    <i class="fas fa-mouse-pointer text-blue-500"></i> 点击中间层节点查看注意力连接
                </div>
            `;
        }
        document.getElementById('info-panel').classList.add('visible');

        // 底部提示
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'flex';
            controlsDiv.innerHTML = `
                <div class="tip-pill"><i class="fas fa-cube"></i> 拖动旋转查看结构</div>
                <div class="tip-pill"><i class="fas fa-mouse-pointer"></i> 点击节点查看注意力</div>
            `;
        }
    }

    animate(time, delta) {
        // 整体缓慢旋转
        this.llmGroup.rotation.y = Math.sin(time * 0.1) * 0.15;

        // 节点呼吸动画
        this.tokenNodes.forEach((node, i) => {
            const breathe = 1 + Math.sin(time * 2 + i * 0.5) * 0.05;
            if (node !== this.selectedToken) {
                node.scale.setScalar(breathe);
            }
            node.userData.ring.rotation.z += 0.01;
        });

        // 注意力线流动效果
        if (this.selectedToken) {
            this.attentionLines.forEach(line => {
                if (line.material.opacity > 0) {
                    line.material.opacity = line.userData.weight * (0.5 + Math.sin(time * 5) * 0.3);
                }
            });
        }

        // 背景粒子飘动
        if (this.bgParticles) {
            const positions = this.bgParticles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] -= 0.02;
                if (positions[i + 1] < -30) {
                    positions[i + 1] = 30;
                }
            }
            this.bgParticles.geometry.attributes.position.needsUpdate = true;
        }
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        this.scene.remove(this.llmGroup);
        this.scene.remove(this.bgParticles);
        if (this.scene.fog) this.scene.fog = null;
    }
}
