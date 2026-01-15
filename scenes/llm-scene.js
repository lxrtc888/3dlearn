/**
 * LLM 原理场景 - Transformer 架构可视化 (赛博增强版)
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
    }

    init() {
        this.camera.position.set(0, 0, 35);
        this.scene.fog = new THREE.FogExp2(0x000000, 0.02);

        this.setupScene();
        this.setupBackground();
        this.setupUI();
    }

    setupScene() {
        this.llmGroup = new THREE.Group();
        this.scene.add(this.llmGroup);

        // 模拟句子 (更长一点)
        const sentence = ["The", "AI", "model", "learned", "to", "understand", "context", "by", "analyzing", "huge", "amounts", "of", "data"];

        // 1. 创建 Token 节点 (螺旋排列，更具空间感)
        // 使用 Sprite 材质打造发光节点
        const map = new THREE.TextureLoader().load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/sprites/spark1.png');
        const materialRaw = new THREE.SpriteMaterial({ map: map, color: 0x00ffff, blending: THREE.AdditiveBlending });

        sentence.forEach((word, i) => {
            const angle = (i / sentence.length) * Math.PI * 4; // 两圈
            const radius = 8 + i * 0.5;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            const z = (i - sentence.length / 2) * 2;

            // 核心节点
            const node = new THREE.Sprite(materialRaw.clone());
            node.scale.set(2, 2, 2);
            node.position.set(x, y, z);

            // 外圈环绕环
            const ringGeo = new THREE.TorusGeometry(1.2, 0.05, 16, 32);
            const ringMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6, transparent: true, opacity: 0.3 });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(node.position);
            ring.lookAt(0, 0, 0);
            this.llmGroup.add(ring);

            node.userData = { id: i, word: word, ring: ring };

            // 点击事件
            node.userData.onClick = () => this.highlightTokenAndAttention(node);

            this.llmGroup.add(node);
            this.tokenNodes.push(node);
            this.interactables.push(node); // Sprite 也是 Object3D，raycaster 支持
        });

        // 2. 预生成 Attention 连接线 (贝塞尔曲线)
        // 随机生成一些强关联
        this.tokenNodes.forEach(sourceNode => {
            const sourceId = sourceNode.userData.id;
            // 每一个词都随机关注其他 2-3 个词
            for (let k = 0; k < 3; k++) {
                const targetId = Math.floor(Math.random() * sentence.length);
                if (sourceId === targetId) continue;

                const targetNode = this.tokenNodes[targetId];

                const curve = new THREE.QuadraticBezierCurve3(
                    sourceNode.position,
                    new THREE.Vector3(0, 0, 0), // 中心汇聚点
                    targetNode.position
                );

                const points = curve.getPoints(40);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const lineMat = new THREE.LineBasicMaterial({
                    color: 0xff33cc,
                    transparent: true,
                    opacity: 0, // 初始不可见
                    linewidth: 1,
                    blending: THREE.AdditiveBlending
                });

                const line = new THREE.Line(geometry, lineMat);
                line.userData = { source: sourceId, target: targetId };
                this.llmGroup.add(line);
                this.attentionLines.push(line);
            }
        });
    }

    setupBackground() {
        // 创建矩阵数字雨效果的背景粒子
        const count = 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = [];

        for (let i = 0; i < count; i++) {
            positions.push((Math.random() - 0.5) * 100);
            positions.push((Math.random() - 0.5) * 100);
            positions.push((Math.random() - 0.5) * 60 - 20); // 背景层
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

        const material = new THREE.PointsMaterial({
            color: 0x003366,
            size: 0.5,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true
        });

        this.bgParticles = new THREE.Points(geometry, material);
        this.scene.add(this.bgParticles);
    }

    createLabels(manager) {
        this.tokenNodes.forEach((node, i) => {
            // 仅每隔几个显示标签，防止太乱
            // 或者全显示但字小点
            manager.createLabel(node.userData.word, node.position.clone().add(new THREE.Vector3(0, 1.5, 0)), 'font-mono text-xs text-blue-200');
        });
    }

    setupUI() {
        const infoTitle = document.getElementById('info-title');
        const infoContent = document.getElementById('info-content');
        if (infoTitle) infoTitle.innerText = "Transformer 神经网络";
        if (infoContent) {
            infoContent.innerHTML = `
                <div class="p-3 bg-blue-900/30 rounded border border-blue-500/30 mb-4 backdrop-blur-sm">
                    <div class="font-bold text-blue-300 text-lg mb-1">Self-Attention Mechanism</div>
                    <div class="text-xs text-gray-300">
                        模型不需要按照顺序阅读，而是并行计算每个Token之间的关联系数（Attention Score）。
                    </div>
                </div>
                <div class="text-sm text-gray-400">
                    <i class="fas fa-mouse-pointer text-blue-500"></i> 点击光点观察语义连接
                </div>
            `;
        }
        document.getElementById('info-panel').classList.add('visible');
    }

    highlightTokenAndAttention(clickedNode) {
        this.selectedToken = clickedNode;
        const selectedId = clickedNode.userData.id;

        // 1. 重置
        this.tokenNodes.forEach(node => {
            node.material.color.setHex(0x00ffff);
            node.scale.set(2, 2, 2);
            node.userData.ring.material.opacity = 0.3;
        });
        this.attentionLines.forEach(line => line.material.opacity = 0);

        // 2. 高亮选中
        clickedNode.material.color.setHex(0xffaa00);
        clickedNode.scale.set(3, 3, 3);
        clickedNode.userData.ring.material.opacity = 0.8;

        // 3. 激活相关连接并做一种“脉冲”动画
        let count = 0;
        this.attentionLines.forEach(line => {
            if (line.userData.source === selectedId) {
                line.material.opacity = 0.6;
                // 让连接的目标节点也亮起来
                const targetNode = this.tokenNodes[line.userData.target];
                targetNode.material.color.setHex(0xff33cc);
                targetNode.scale.set(2.5, 2.5, 2.5);
                count++;
            }
        });

        // 更新 UI
        const info = document.getElementById('info-content');
        if (info) {
            info.innerHTML = `
                <div class="text-3xl font-bold text-white mb-2 tracking-wider">${clickedNode.userData.word}</div>
                <div class="mb-4 text-purple-400 font-mono">Embedding: [0.21, -0.55, 0.89...]</div>
                <div class="bg-black/40 p-3 rounded">
                    <div class="flex justify-between text-sm mb-1 text-gray-400">
                        <span>关联节点</span>
                        <span>权重 (Weight)</span>
                    </div>
                    ${Array(count).fill(0).map(() => `
                        <div class="flex justify-between text-sm border-b border-gray-700 py-1">
                            <span class="text-blue-300">random_context</span>
                            <span class="text-green-400">${(Math.random() * 0.9).toFixed(3)}</span>
                        </div>
                    `).join('')}
                </div>
             `;
        }
    }

    animate(time, delta) {
        // 整体缓慢旋转
        this.llmGroup.rotation.y += 0.001;
        this.llmGroup.rotation.z = Math.sin(time * 0.1) * 0.05;

        // 节点自身晃动
        this.tokenNodes.forEach((node, i) => {
            node.position.y += Math.sin(time * 2 + i) * 0.005;
            if (node.userData.ring) {
                node.userData.ring.rotation.z += 0.02;
                node.userData.ring.rotation.x += 0.01;
            }
        });

        // 脉冲线特效
        if (this.selectedToken) {
            this.attentionLines.forEach(line => {
                if (line.material.opacity > 0) {
                    // 模拟数据流动的闪烁
                    line.material.opacity = 0.4 + Math.sin(time * 10) * 0.3;
                }
            });
        }

        // 背景粒子移动
        if (this.bgParticles) {
            this.bgParticles.rotation.y -= 0.0005;
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
