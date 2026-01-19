/**
 * 六度分隔理论场景 - Six Degrees of Separation
 * ============================================
 * "你和世界上任何人最多6步就能联系"
 * 
 * 核心概念：
 * - Small World Network（小世界网络）
 * - 弱连接（Weak Ties）的重要性
 * - 社交网络的拓扑结构
 * 
 * Stanley Milgram 1967年实验证实
 * ============================================
 */
window.SixDegreesScene = class SixDegreesScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 网络参数
        this.params = {
            nodeCount: 80,           // 节点数
            avgConnections: 4,       // 平均连接数
            clusterCount: 6,         // 簇数量
            sphereRadius: 20,        // 球体半径
            weakTieProb: 0.1         // 弱连接概率
        };

        // 数据结构
        this.nodes = [];
        this.edges = [];
        this.nodeMeshes = [];
        this.edgeLines = [];

        // 选择状态
        this.selectedNodes = [];
        this.pathNodes = [];
        this.pathEdges = [];

        // 颜色
        this.colors = {
            background: 0x0a0a18,
            node: 0x4a90d9,
            nodeHover: 0x00ffff,
            nodeSelected: 0xff6b6b,
            edgeStrong: 0x3a6090,
            edgeWeak: 0xff9f43,
            pathEdge: 0x00ff88,
            pathNode: 0xffff00
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 10, z: 50 };
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
        this.scene.fog = new THREE.FogExp2(this.colors.background, 0.01);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();

        // 生成网络
        this.generateNetwork();
    }

    /**
     * 设置光照
     */
    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.4);
        directional.position.set(10, 20, 10);
        this.scene.add(directional);

        // 多个点光源
        const colors = [0x4a90d9, 0x00ffff, 0xff6b6b];
        colors.forEach((color, i) => {
            const light = new THREE.PointLight(color, 0.3, 50);
            const angle = (i / colors.length) * Math.PI * 2;
            light.position.set(
                Math.cos(angle) * 25,
                10,
                Math.sin(angle) * 25
            );
            this.scene.add(light);
        });
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建背景球体
        this.createBackgroundSphere();

        // 创建星空
        this.createStars();
    }

    /**
     * 创建背景球体
     */
    createBackgroundSphere() {
        const geometry = new THREE.SphereGeometry(this.params.sphereRadius * 1.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x111122,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.3
        });
        const sphere = new THREE.Mesh(geometry, material);
        this.mainGroup.add(sphere);
    }

    /**
     * 创建星空
     */
    createStars() {
        const starsGeom = new THREE.BufferGeometry();
        const starCount = 1000;
        const positions = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const radius = 80 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.cos(phi);
            positions[i * 3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
        }

        starsGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const starsMat = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.3,
            transparent: true,
            opacity: 0.5
        });

        this.stars = new THREE.Points(starsGeom, starsMat);
        this.scene.add(this.stars);
    }

    /**
     * 生成社交网络
     */
    generateNetwork() {
        this.clearNetwork();

        const { nodeCount, clusterCount, sphereRadius, avgConnections, weakTieProb } = this.params;

        // 1. 创建节点（按簇分布）
        const clusterCenters = [];
        for (let c = 0; c < clusterCount; c++) {
            const theta = (c / clusterCount) * Math.PI * 2;
            const phi = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            clusterCenters.push({
                x: sphereRadius * 0.6 * Math.sin(phi) * Math.cos(theta),
                y: sphereRadius * 0.6 * Math.cos(phi),
                z: sphereRadius * 0.6 * Math.sin(phi) * Math.sin(theta)
            });
        }

        // 分配节点到簇
        for (let i = 0; i < nodeCount; i++) {
            const clusterId = i % clusterCount;
            const center = clusterCenters[clusterId];

            // 在簇中心附近随机分布
            const offset = 5;
            const node = {
                id: i,
                clusterId: clusterId,
                x: center.x + (Math.random() - 0.5) * offset * 2,
                y: center.y + (Math.random() - 0.5) * offset * 2,
                z: center.z + (Math.random() - 0.5) * offset * 2,
                connections: []
            };

            this.nodes.push(node);
        }

        // 2. 创建边（簇内强连接 + 簇间弱连接）
        for (let i = 0; i < nodeCount; i++) {
            const node = this.nodes[i];
            
            // 簇内连接
            const sameCluster = this.nodes.filter(n => 
                n.id !== i && n.clusterId === node.clusterId
            );
            const connectCount = Math.min(avgConnections, sameCluster.length);
            
            // 按距离排序，连接最近的
            sameCluster.sort((a, b) => {
                const distA = this.distance(node, a);
                const distB = this.distance(node, b);
                return distA - distB;
            });

            for (let j = 0; j < connectCount; j++) {
                this.addEdge(i, sameCluster[j].id, false);
            }

            // 弱连接（跨簇）
            if (Math.random() < weakTieProb) {
                const otherCluster = this.nodes.filter(n => 
                    n.id !== i && n.clusterId !== node.clusterId
                );
                if (otherCluster.length > 0) {
                    const target = otherCluster[Math.floor(Math.random() * otherCluster.length)];
                    this.addEdge(i, target.id, true);
                }
            }
        }

        // 3. 创建3D对象
        this.createNodeMeshes();
        this.createEdgeLines();

        this.updateInfoDisplay();
    }

    /**
     * 计算距离
     */
    distance(a, b) {
        return Math.sqrt(
            Math.pow(a.x - b.x, 2) +
            Math.pow(a.y - b.y, 2) +
            Math.pow(a.z - b.z, 2)
        );
    }

    /**
     * 添加边
     */
    addEdge(from, to, isWeak) {
        // 避免重复
        const exists = this.edges.some(e => 
            (e.from === from && e.to === to) || (e.from === to && e.to === from)
        );
        if (exists) return;

        this.edges.push({ from, to, isWeak });
        this.nodes[from].connections.push(to);
        this.nodes[to].connections.push(from);
    }

    /**
     * 创建节点网格
     */
    createNodeMeshes() {
        const geometry = new THREE.SphereGeometry(0.5, 16, 16);
        const clusterColors = [
            0x4a90d9, 0x50c878, 0xff6b6b, 
            0xffd700, 0x9370db, 0x20b2aa
        ];

        this.nodes.forEach((node, i) => {
            const color = clusterColors[node.clusterId % clusterColors.length];
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.3
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(node.x, node.y, node.z);
            mesh.userData = {
                nodeId: i,
                hoverTitle: `人物 #${i + 1}`,
                hoverDesc: `簇 ${node.clusterId + 1} · ${node.connections.length} 个朋友`,
                onClick: () => this.selectNode(i)
            };

            // 发光效果
            const glowGeom = new THREE.SphereGeometry(0.8, 8, 8);
            const glowMat = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.2
            });
            const glow = new THREE.Mesh(glowGeom, glowMat);
            mesh.add(glow);

            this.mainGroup.add(mesh);
            this.nodeMeshes.push(mesh);
            this.interactables.push(mesh);
        });
    }

    /**
     * 创建边线
     */
    createEdgeLines() {
        this.edges.forEach(edge => {
            const from = this.nodes[edge.from];
            const to = this.nodes[edge.to];

            const points = [
                new THREE.Vector3(from.x, from.y, from.z),
                new THREE.Vector3(to.x, to.y, to.z)
            ];

            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: edge.isWeak ? this.colors.edgeWeak : this.colors.edgeStrong,
                transparent: true,
                opacity: edge.isWeak ? 0.8 : 0.3,
                linewidth: edge.isWeak ? 2 : 1
            });

            const line = new THREE.Line(geometry, material);
            line.userData = { edge, isWeak: edge.isWeak };
            this.mainGroup.add(line);
            this.edgeLines.push(line);
        });
    }

    /**
     * 清除网络
     */
    clearNetwork() {
        this.nodeMeshes.forEach(mesh => this.mainGroup.remove(mesh));
        this.edgeLines.forEach(line => this.mainGroup.remove(line));
        this.nodes = [];
        this.edges = [];
        this.nodeMeshes = [];
        this.edgeLines = [];
        this.interactables = [];
        this.selectedNodes = [];
        this.pathNodes = [];
        this.pathEdges = [];
    }

    /**
     * 选择节点
     */
    selectNode(nodeId) {
        // 重置之前的高亮
        this.clearPath();

        if (this.selectedNodes.length === 0) {
            // 第一个节点
            this.selectedNodes.push(nodeId);
            this.highlightNode(nodeId, this.colors.nodeSelected);
            this.showGuide(`🎯 已选择起点 #${nodeId + 1}，请点击另一个人作为终点`);
        } else if (this.selectedNodes.length === 1) {
            if (nodeId === this.selectedNodes[0]) {
                // 取消选择
                this.selectedNodes = [];
                this.resetNodeColors();
                return;
            }

            // 第二个节点
            this.selectedNodes.push(nodeId);
            this.highlightNode(nodeId, this.colors.nodeSelected);

            // 计算最短路径
            this.findShortestPath(this.selectedNodes[0], this.selectedNodes[1]);
        } else {
            // 重新开始
            this.selectedNodes = [nodeId];
            this.resetNodeColors();
            this.highlightNode(nodeId, this.colors.nodeSelected);
            this.showGuide(`🎯 已选择起点 #${nodeId + 1}，请点击另一个人作为终点`);
        }
    }

    /**
     * BFS寻找最短路径
     */
    findShortestPath(startId, endId) {
        const visited = new Set();
        const queue = [[startId]];
        visited.add(startId);

        while (queue.length > 0) {
            const path = queue.shift();
            const current = path[path.length - 1];

            if (current === endId) {
                // 找到路径
                this.showPath(path);
                return;
            }

            for (const neighbor of this.nodes[current].connections) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push([...path, neighbor]);
                }
            }
        }

        // 无法连接
        this.showGuide('❌ 这两人之间没有连接路径！');
    }

    /**
     * 显示路径
     */
    showPath(path) {
        this.pathNodes = path;
        const steps = path.length - 1;

        // 高亮路径节点
        path.forEach((nodeId, i) => {
            this.highlightNode(nodeId, i === 0 || i === path.length - 1 
                ? this.colors.nodeSelected 
                : this.colors.pathNode);
        });

        // 高亮路径边
        for (let i = 0; i < path.length - 1; i++) {
            const from = path[i];
            const to = path[i + 1];

            this.edgeLines.forEach(line => {
                const edge = line.userData.edge;
                if ((edge.from === from && edge.to === to) || 
                    (edge.from === to && edge.to === from)) {
                    line.material.color.setHex(this.colors.pathEdge);
                    line.material.opacity = 1;
                    this.pathEdges.push(line);
                }
            });
        }

        // 显示结果
        const message = steps <= 6 
            ? `✅ ${steps}步就能联系！验证了六度分隔理论！`
            : `🔗 需要${steps}步联系（超过6步）`;
        
        this.showGuide(message);
        this.updatePathInfo(path);
    }

    /**
     * 高亮节点
     */
    highlightNode(nodeId, color) {
        const mesh = this.nodeMeshes[nodeId];
        if (mesh) {
            mesh.material.color.setHex(color);
            mesh.material.emissive.setHex(color);
            mesh.material.emissiveIntensity = 0.5;
            mesh.scale.set(1.5, 1.5, 1.5);
        }
    }

    /**
     * 清除路径高亮
     */
    clearPath() {
        this.pathEdges.forEach(line => {
            line.material.color.setHex(
                line.userData.isWeak ? this.colors.edgeWeak : this.colors.edgeStrong
            );
            line.material.opacity = line.userData.isWeak ? 0.8 : 0.3;
        });
        this.pathEdges = [];
        this.pathNodes = [];
    }

    /**
     * 重置节点颜色
     */
    resetNodeColors() {
        const clusterColors = [
            0x4a90d9, 0x50c878, 0xff6b6b,
            0xffd700, 0x9370db, 0x20b2aa
        ];

        this.nodeMeshes.forEach((mesh, i) => {
            const node = this.nodes[i];
            const color = clusterColors[node.clusterId % clusterColors.length];
            mesh.material.color.setHex(color);
            mesh.material.emissive.setHex(color);
            mesh.material.emissiveIntensity = 0.3;
            mesh.scale.set(1, 1, 1);
        });

        this.clearPath();
    }

    /**
     * 更新路径信息显示
     */
    updatePathInfo(path) {
        let panel = document.getElementById('path-info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'path-info-panel';
            panel.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(10, 10, 30, 0.95);
                border: 1px solid #00ff88;
                border-radius: 8px;
                padding: 16px;
                color: #fff;
                z-index: 100;
                max-width: 250px;
            `;
            document.getElementById('scene-canvas-container')?.appendChild(panel);
        }

        const steps = path.length - 1;
        panel.innerHTML = `
            <div style="color: #00ff88; font-size: 16px; margin-bottom: 12px;">
                <i class="fas fa-route"></i> 最短路径
            </div>
            <div style="font-size: 28px; color: ${steps <= 6 ? '#00ff88' : '#ff6b6b'}; margin-bottom: 8px;">
                ${steps} 步
            </div>
            <div style="color: #aaa; font-size: 12px; margin-bottom: 12px;">
                ${path.map(id => `#${id + 1}`).join(' → ')}
            </div>
            <div style="padding: 8px; background: rgba(0,255,136,0.1); border-radius: 4px; font-size: 12px;">
                ${steps <= 6 
                    ? '✅ 符合六度分隔理论！' 
                    : '⚠️ 超过6步，可能需要更多弱连接'}
            </div>
        `;
    }

    /**
     * 更新信息显示
     */
    updateInfoDisplay() {
        let panel = document.getElementById('network-info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'network-info-panel';
            panel.style.cssText = `
                position: absolute;
                top: 20px;
                left: 20px;
                background: rgba(10, 10, 30, 0.9);
                border: 1px solid #4a90d9;
                border-radius: 8px;
                padding: 16px;
                color: #fff;
                font-size: 13px;
                z-index: 100;
            `;
            document.getElementById('scene-canvas-container')?.appendChild(panel);
        }

        const weakEdges = this.edges.filter(e => e.isWeak).length;

        panel.innerHTML = `
            <div style="color: #4a90d9; font-size: 16px; margin-bottom: 10px;">
                <i class="fas fa-project-diagram"></i> 网络统计
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                <div>节点数: <span style="color: #00ffff;">${this.nodes.length}</span></div>
                <div>连接数: <span style="color: #00ffff;">${this.edges.length}</span></div>
                <div>簇数量: <span style="color: #50c878;">${this.params.clusterCount}</span></div>
                <div>弱连接: <span style="color: #ff9f43;">${weakEdges}</span></div>
            </div>
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #333; font-size: 11px; color: #888;">
                <i class="fas fa-info-circle"></i> 橙色线 = 跨群体的"弱连接"
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
            <button class="control-btn" id="btn-regenerate">
                <i class="fas fa-sync"></i> 重新生成
            </button>
            <button class="control-btn" id="btn-clear-selection">
                <i class="fas fa-times"></i> 清除选择
            </button>
            <button class="control-btn" id="btn-highlight-weak">
                <i class="fas fa-link"></i> 高亮弱连接
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
        document.getElementById('btn-regenerate').onclick = () => {
            this.generateNetwork();
            this.showGuide('🔄 已重新生成网络');
        };
        document.getElementById('btn-clear-selection').onclick = () => {
            this.selectedNodes = [];
            this.resetNodeColors();
            const pathPanel = document.getElementById('path-info-panel');
            if (pathPanel) pathPanel.remove();
            this.showGuide('✨ 已清除选择，点击任意两个节点计算路径');
        };
        document.getElementById('btn-highlight-weak').onclick = () => this.highlightWeakTies();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    /**
     * 高亮弱连接
     */
    highlightWeakTies() {
        this.edgeLines.forEach(line => {
            if (line.userData.isWeak) {
                line.material.opacity = 1;
                // 闪烁动画
                if (typeof gsap !== 'undefined') {
                    gsap.to(line.material, {
                        opacity: 0.3,
                        duration: 0.5,
                        repeat: 3,
                        yoyo: true
                    });
                }
            } else {
                line.material.opacity = 0.1;
            }
        });

        setTimeout(() => {
            this.edgeLines.forEach(line => {
                line.material.opacity = line.userData.isWeak ? 0.8 : 0.3;
            });
        }, 3000);

        this.showGuide('🔗 橙色线是"弱连接"，它们是联通不同群体的桥梁！');
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
            background: rgba(74, 144, 217, 0.2);
            border: 1px solid rgba(74, 144, 217, 0.4);
            padding: 12px 24px;
            border-radius: 8px;
            color: #4a90d9;
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
        }, 4000);
    }

    /**
     * 初始引导
     */
    showInitialGuide() {
        setTimeout(() => {
            this.showGuide('🔗 六度分隔：你和任何人最多6步就能联系');
        }, 1000);
        setTimeout(() => {
            this.showGuide('👆 点击任意两个节点，查看最短连接路径！');
        }, 5000);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        // 节点轻微浮动
        this.nodeMeshes.forEach((mesh, i) => {
            const t = time * 0.001 + i * 0.5;
            mesh.position.y = this.nodes[i].y + Math.sin(t) * 0.2;
        });

        // 星空旋转
        if (this.stars) {
            this.stars.rotation.y += 0.0001;
        }
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
        this.clearNetwork();
        
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
        }
        if (this.stars) {
            this.scene.remove(this.stars);
        }

        // 移除UI元素
        ['network-info-panel', 'path-info-panel'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    /**
     * 背景点击处理
     */
    onBackgroundClick() {
        // 不做任何操作，保持选择状态
    }
};
