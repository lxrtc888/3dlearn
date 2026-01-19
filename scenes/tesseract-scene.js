/**
 * 四维超立方体 - 维度演化 3D教学场景
 * ============================================
 * 从0维点到高维空间的震撼演化之旅
 * 
 * 教学内容：
 * 1. 维度的概念与递增规律
 * 2. n维超立方体的几何性质
 * 3. 四维空间在三维的投影
 * 4. 高维几何的数学之美
 * 
 * 目标学生：初中-大学
 * ============================================
 */

class TesseractScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'TesseractScene';
        this.mainGroup = null;
        
        // 当前维度状态
        this.currentDimension = 0;
        this.maxDimension = 6; // 最高展示到6维
        this.isAnimating = false;
        this.isAutoPlaying = false;
        this.animationTime = 0;
        
        // 几何元素
        this.vertices = [];
        this.edges = [];
        this.vertexMeshes = [];
        this.edgeLines = [];
        this.trails = []; // 粒子轨迹
        
        // 4D旋转角度
        this.rotationXW = 0;
        this.rotationYW = 0;
        this.rotationZW = 0;
        this.autoRotate4D = true;
        
        // 动画参数
        this.evolutionProgress = 0;
        this.evolutionSpeed = 0.008; // 较慢的演化速度
        this.evolutionPhase = 'idle'; // 'idle', 'evolving', 'rotating'
        
        // 视觉效果
        this.colors = {
            vertex: 0x00ffff,
            edge: 0x4488ff,
            trail: 0xff00ff,
            glow: 0x00ffff,
            dimension: [
                0xffffff, // 0D - 白色
                0x00ff00, // 1D - 绿色
                0xffff00, // 2D - 黄色
                0xff8800, // 3D - 橙色
                0xff00ff, // 4D - 品红
                0x00ffff, // 5D - 青色
                0xff4444  // 6D - 红色
            ]
        };
        
        // 维度数据
        this.dimensionData = this.calculateDimensionData();
    }

    /**
     * 计算各维度的几何数据
     */
    calculateDimensionData() {
        const data = [];
        for (let n = 0; n <= 10; n++) {
            data.push({
                dimension: n,
                vertices: Math.pow(2, n),
                edges: n * Math.pow(2, n - 1),
                faces: n >= 2 ? this.binomial(n, 2) * Math.pow(2, n - 2) : 0,
                cells: n >= 3 ? this.binomial(n, 3) * Math.pow(2, n - 3) : 0,
                name: this.getDimensionName(n)
            });
        }
        return data;
    }

    binomial(n, k) {
        if (k > n) return 0;
        if (k === 0 || k === n) return 1;
        let result = 1;
        for (let i = 0; i < k; i++) {
            result = result * (n - i) / (i + 1);
        }
        return Math.round(result);
    }

    getDimensionName(n) {
        const names = ['点', '线段', '正方形', '立方体', '超立方体', '五维超立方体', '六维超立方体'];
        return names[n] || `${n}维超立方体`;
    }

    init() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建星空背景
        this.createStarField();
        
        // 创建环境
        this.createEnvironment();
        
        // 初始化为0维（一个点）
        this.initDimension(0);
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(0, 0, 8);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 设置灯光
        this.setupLighting();
        
        // 创建UI
        this.setupUI();
        
        // 创建维度信息面板
        this.createDimensionPanel();
        
        console.log('TesseractScene initialized');
    }

    /**
     * 创建星空背景
     */
    createStarField() {
        const starsCount = 2000;
        const positions = new Float32Array(starsCount * 3);
        const colors = new Float32Array(starsCount * 3);
        const sizes = new Float32Array(starsCount);
        
        for (let i = 0; i < starsCount; i++) {
            // 球形分布
            const radius = 50 + Math.random() * 100;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            // 随机颜色（偏蓝白）
            const colorChoice = Math.random();
            if (colorChoice < 0.7) {
                colors[i * 3] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 1] = 0.9 + Math.random() * 0.1;
                colors[i * 3 + 2] = 1;
            } else if (colorChoice < 0.9) {
                colors[i * 3] = 0.6;
                colors[i * 3 + 1] = 0.8;
                colors[i * 3 + 2] = 1;
            } else {
                colors[i * 3] = 1;
                colors[i * 3 + 1] = 0.8;
                colors[i * 3 + 2] = 0.6;
            }
            
            sizes[i] = 0.5 + Math.random() * 1.5;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 0.15,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        this.starField = new THREE.Points(geometry, material);
        this.mainGroup.add(this.starField);
    }

    /**
     * 创建环境
     */
    createEnvironment() {
        // 网格参考平面（半透明）
        const gridHelper = new THREE.GridHelper(20, 20, 0x222244, 0x111133);
        gridHelper.position.y = -4;
        gridHelper.material.transparent = true;
        gridHelper.material.opacity = 0.3;
        this.mainGroup.add(gridHelper);
        
        // 坐标轴指示
        const axisLength = 3;
        const axisGroup = new THREE.Group();
        
        // X轴 - 红色
        const xAxis = this.createAxis(new THREE.Vector3(axisLength, 0, 0), 0xff4444, 'X');
        axisGroup.add(xAxis);
        
        // Y轴 - 绿色
        const yAxis = this.createAxis(new THREE.Vector3(0, axisLength, 0), 0x44ff44, 'Y');
        axisGroup.add(yAxis);
        
        // Z轴 - 蓝色
        const zAxis = this.createAxis(new THREE.Vector3(0, 0, axisLength), 0x4444ff, 'Z');
        axisGroup.add(zAxis);
        
        axisGroup.position.set(-5, -3, -5);
        this.mainGroup.add(axisGroup);
    }

    createAxis(direction, color, label) {
        const group = new THREE.Group();
        
        const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            direction
        ]);
        const line = new THREE.Line(geometry, material);
        group.add(line);
        
        // 箭头
        const coneGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
        const coneMaterial = new THREE.MeshBasicMaterial({ color });
        const cone = new THREE.Mesh(coneGeometry, coneMaterial);
        cone.position.copy(direction);
        cone.lookAt(direction.clone().multiplyScalar(2));
        group.add(cone);
        
        return group;
    }

    /**
     * 初始化指定维度的几何体
     */
    initDimension(dim) {
        this.currentDimension = dim;
        this.clearGeometry();
        
        // 生成顶点
        this.vertices = this.generateHypercubeVertices(dim);
        
        // 生成边
        this.edges = this.generateHypercubeEdges(dim);
        
        // 创建可视化
        this.createVisualization();
        
        // 更新信息面板 - 使用实际生成的顶点和边数量
        this.updateDimensionPanel(dim, this.vertices.length, this.edges.length);
    }

    /**
     * 生成n维超立方体的顶点
     */
    generateHypercubeVertices(n) {
        if (n === 0) return [[0, 0, 0, 0, 0, 0]];
        
        const vertices = [];
        const count = Math.pow(2, n);
        
        for (let i = 0; i < count; i++) {
            const vertex = [];
            for (let j = 0; j < 6; j++) { // 支持最多6维
                if (j < n) {
                    vertex.push((i >> j) & 1 ? 1 : -1);
                } else {
                    vertex.push(0);
                }
            }
            vertices.push(vertex);
        }
        
        return vertices;
    }

    /**
     * 生成n维超立方体的边
     */
    generateHypercubeEdges(n) {
        const edges = [];
        const vertices = this.vertices;
        
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                // 两个顶点只在一个坐标上不同则连边
                let diff = 0;
                for (let k = 0; k < n; k++) {
                    if (vertices[i][k] !== vertices[j][k]) diff++;
                }
                if (diff === 1) {
                    edges.push([i, j]);
                }
            }
        }
        
        return edges;
    }

    /**
     * 清除现有几何体
     */
    clearGeometry() {
        this.vertexMeshes.forEach(m => {
            this.mainGroup.remove(m);
            if (m.geometry) m.geometry.dispose();
            if (m.material) m.material.dispose();
        });
        this.vertexMeshes = [];
        
        this.edgeLines.forEach(l => {
            this.mainGroup.remove(l);
            if (l.geometry) l.geometry.dispose();
            if (l.material) l.material.dispose();
        });
        this.edgeLines = [];
        
        this.trails.forEach(t => {
            this.mainGroup.remove(t);
            if (t.geometry) t.geometry.dispose();
            if (t.material) t.material.dispose();
        });
        this.trails = [];
    }

    /**
     * 创建可视化
     */
    createVisualization() {
        const color = this.colors.dimension[this.currentDimension] || 0xffffff;
        const scale = 1.5;
        
        // 创建顶点
        this.vertices.forEach((v, index) => {
            const pos3D = this.projectTo3D(v);
            
            // 顶点球体
            const geometry = new THREE.SphereGeometry(0.12, 16, 16);
            const material = new THREE.MeshStandardMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.6,
                metalness: 0.3,
                roughness: 0.4
            });
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(pos3D.x * scale, pos3D.y * scale, pos3D.z * scale);
            
            // 光晕
            const glowGeometry = new THREE.SphereGeometry(0.25, 8, 8);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3,
                side: THREE.BackSide
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            mesh.add(glow);
            
            mesh.userData = {
                index: index,
                originalVertex: v.slice(),
                name: `顶点 ${index}`,
                info: `坐标: (${v.slice(0, this.currentDimension).join(', ')})`
            };
            
            this.vertexMeshes.push(mesh);
            this.mainGroup.add(mesh);
        });
        
        // 创建边
        this.edges.forEach(([i, j]) => {
            const v1 = this.projectTo3D(this.vertices[i]);
            const v2 = this.projectTo3D(this.vertices[j]);
            
            const geometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(v1.x * scale, v1.y * scale, v1.z * scale),
                new THREE.Vector3(v2.x * scale, v2.y * scale, v2.z * scale)
            ]);
            
            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.7,
                linewidth: 2
            });
            
            const line = new THREE.Line(geometry, material);
            this.edgeLines.push(line);
            this.mainGroup.add(line);
        });
    }

    /**
     * 将高维坐标投影到3D
     * 使用透视投影
     */
    projectTo3D(vertex) {
        let x = vertex[0] || 0;
        let y = vertex[1] || 0;
        let z = vertex[2] || 0;
        let w = vertex[3] || 0;
        let v = vertex[4] || 0;
        let u = vertex[5] || 0;
        
        // 4D旋转（XW平面）
        if (this.currentDimension >= 4) {
            const cosXW = Math.cos(this.rotationXW);
            const sinXW = Math.sin(this.rotationXW);
            const newX = x * cosXW - w * sinXW;
            const newW = x * sinXW + w * cosXW;
            x = newX;
            w = newW;
            
            // YW平面旋转
            const cosYW = Math.cos(this.rotationYW);
            const sinYW = Math.sin(this.rotationYW);
            const newY = y * cosYW - w * sinYW;
            w = y * sinYW + w * cosYW;
            y = newY;
            
            // ZW平面旋转
            const cosZW = Math.cos(this.rotationZW);
            const sinZW = Math.sin(this.rotationZW);
            const newZ = z * cosZW - w * sinZW;
            w = z * sinZW + w * cosZW;
            z = newZ;
        }
        
        // 5D和6D的额外投影
        if (this.currentDimension >= 5) {
            const factor5 = 1 / (3 - v * 0.3);
            x *= factor5;
            y *= factor5;
            z *= factor5;
        }
        
        if (this.currentDimension >= 6) {
            const factor6 = 1 / (3 - u * 0.2);
            x *= factor6;
            y *= factor6;
            z *= factor6;
        }
        
        // 4D透视投影
        if (this.currentDimension >= 4) {
            const distance = 4;
            const factor = distance / (distance - w * 0.5);
            x *= factor;
            y *= factor;
            z *= factor;
        }
        
        return { x, y, z };
    }

    /**
     * 更新几何体位置（用于4D旋转）
     */
    updateGeometryPositions() {
        const scale = 1.5;
        
        this.vertices.forEach((v, index) => {
            const pos3D = this.projectTo3D(v);
            if (this.vertexMeshes[index]) {
                this.vertexMeshes[index].position.set(
                    pos3D.x * scale, 
                    pos3D.y * scale, 
                    pos3D.z * scale
                );
            }
        });
        
        this.edges.forEach(([i, j], index) => {
            const v1 = this.projectTo3D(this.vertices[i]);
            const v2 = this.projectTo3D(this.vertices[j]);
            
            if (this.edgeLines[index]) {
                const positions = this.edgeLines[index].geometry.attributes.position.array;
                positions[0] = v1.x * scale;
                positions[1] = v1.y * scale;
                positions[2] = v1.z * scale;
                positions[3] = v2.x * scale;
                positions[4] = v2.y * scale;
                positions[5] = v2.z * scale;
                this.edgeLines[index].geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    /**
     * 演化到下一维度
     */
    evolveToDimension(targetDim) {
        if (this.isAnimating || targetDim > this.maxDimension || targetDim < 0) return;
        if (targetDim === this.currentDimension) return;
        
        this.isAnimating = true;
        this.evolutionPhase = 'evolving';
        this.evolutionProgress = 0;
        
        const fromDim = this.currentDimension;
        const toDim = targetDim;
        
        // 保存原始顶点
        const originalVertices = this.vertices.map(v => v.slice());
        const originalMeshPositions = this.vertexMeshes.map(m => m.position.clone());
        
        // 生成目标顶点
        const targetVertices = this.generateHypercubeVertices(toDim);
        const targetEdges = this.generateHypercubeEdges(toDim);
        
        // 动画演化
        const animateEvolution = () => {
            this.evolutionProgress += this.evolutionSpeed;
            
            if (this.evolutionProgress >= 1) {
                this.evolutionProgress = 1;
                this.isAnimating = false;
                this.evolutionPhase = 'rotating';
                this.currentDimension = toDim;
                
                // 完成后重建完整几何
                this.initDimension(toDim);
                this.showEvolutionComplete(toDim);
                return;
            }
            
            // 使用缓动函数
            const t = this.easeInOutCubic(this.evolutionProgress);
            
            // 更新现有顶点位置
            this.updateEvolutionFrame(fromDim, toDim, t, originalVertices, targetVertices);
            
            // 更新信息面板进度
            this.updateEvolutionProgress(fromDim, toDim, t);
            
            requestAnimationFrame(animateEvolution);
        };
        
        animateEvolution();
    }

    /**
     * 更新演化帧
     */
    updateEvolutionFrame(fromDim, toDim, t, originalVertices, targetVertices) {
        const scale = 1.5;
        const color = new THREE.Color().lerpColors(
            new THREE.Color(this.colors.dimension[fromDim]),
            new THREE.Color(this.colors.dimension[toDim]),
            t
        );
        
        // 升维：需要添加新顶点
        if (toDim > fromDim) {
            const originalCount = originalVertices.length;
            const targetCount = targetVertices.length;
            
            // 确保有足够的顶点网格
            while (this.vertexMeshes.length < targetCount) {
                const geometry = new THREE.SphereGeometry(0.12, 16, 16);
                const material = new THREE.MeshStandardMaterial({
                    color: color,
                    emissive: color,
                    emissiveIntensity: 0.6,
                    transparent: true,
                    opacity: 0
                });
                const mesh = new THREE.Mesh(geometry, material);
                
                // 光晕
                const glowGeometry = new THREE.SphereGeometry(0.25, 8, 8);
                const glowMaterial = new THREE.MeshBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0
                });
                const glow = new THREE.Mesh(glowGeometry, glowMaterial);
                mesh.add(glow);
                
                this.vertexMeshes.push(mesh);
                this.mainGroup.add(mesh);
            }
            
            // 更新所有顶点
            for (let i = 0; i < targetCount; i++) {
                const mesh = this.vertexMeshes[i];
                let targetPos;
                
                if (i < originalCount) {
                    // 原有顶点：插值到新位置
                    const origV = originalVertices[i];
                    const targV = targetVertices[i];
                    const interpV = [];
                    for (let j = 0; j < 6; j++) {
                        interpV.push(origV[j] + (targV[j] - origV[j]) * t);
                    }
                    targetPos = this.projectTo3DStatic(interpV, toDim, t);
                } else {
                    // 新顶点：从对应原顶点位置生长出来
                    const sourceIndex = i % originalCount;
                    const sourceV = originalVertices[sourceIndex];
                    const targV = targetVertices[i];
                    const interpV = [];
                    for (let j = 0; j < 6; j++) {
                        interpV.push(sourceV[j] + (targV[j] - sourceV[j]) * t);
                    }
                    targetPos = this.projectTo3DStatic(interpV, toDim, t);
                    
                    // 淡入效果
                    mesh.material.opacity = t;
                    if (mesh.children[0]) {
                        mesh.children[0].material.opacity = t * 0.3;
                    }
                }
                
                mesh.position.set(targetPos.x * scale, targetPos.y * scale, targetPos.z * scale);
                mesh.material.color.copy(color);
                mesh.material.emissive.copy(color);
                
                // 添加粒子轨迹
                if (Math.random() < 0.1) {
                    this.addTrailParticle(mesh.position.clone(), color);
                }
            }
            
            // 更新边
            this.updateEdgesDuringEvolution(fromDim, toDim, t, targetVertices, scale, color);
        }
    }

    /**
     * 静态投影（用于演化动画，不应用4D旋转）
     */
    projectTo3DStatic(vertex, dim, t) {
        let x = vertex[0] || 0;
        let y = vertex[1] || 0;
        let z = vertex[2] || 0;
        let w = vertex[3] || 0;
        
        // 4D透视投影（带时间因子平滑过渡）
        if (dim >= 4) {
            const distance = 4;
            const factor = distance / (distance - w * 0.5 * t);
            x *= factor;
            y *= factor;
            z *= factor;
        }
        
        return { x, y, z };
    }

    /**
     * 更新边的演化
     */
    updateEdgesDuringEvolution(fromDim, toDim, t, targetVertices, scale, color) {
        const targetEdges = this.generateHypercubeEdgesFromVertices(targetVertices, toDim);
        
        // 确保有足够的边
        while (this.edgeLines.length < targetEdges.length) {
            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0
            });
            const line = new THREE.Line(geometry, material);
            this.edgeLines.push(line);
            this.mainGroup.add(line);
        }
        
        // 更新边位置
        const fromEdgeCount = this.generateHypercubeEdgesFromVertices(
            this.generateHypercubeVertices(fromDim), fromDim
        ).length;
        
        targetEdges.forEach(([i, j], index) => {
            const line = this.edgeLines[index];
            if (!line) return;
            
            const pos1 = this.vertexMeshes[i]?.position || new THREE.Vector3();
            const pos2 = this.vertexMeshes[j]?.position || new THREE.Vector3();
            
            const positions = line.geometry.attributes.position.array;
            positions[0] = pos1.x;
            positions[1] = pos1.y;
            positions[2] = pos1.z;
            positions[3] = pos2.x;
            positions[4] = pos2.y;
            positions[5] = pos2.z;
            line.geometry.attributes.position.needsUpdate = true;
            
            line.material.color.copy(color);
            
            // 新边淡入
            if (index >= fromEdgeCount) {
                line.material.opacity = t * 0.7;
            } else {
                line.material.opacity = 0.7;
            }
        });
    }

    generateHypercubeEdgesFromVertices(vertices, n) {
        const edges = [];
        for (let i = 0; i < vertices.length; i++) {
            for (let j = i + 1; j < vertices.length; j++) {
                let diff = 0;
                for (let k = 0; k < n; k++) {
                    if (vertices[i][k] !== vertices[j][k]) diff++;
                }
                if (diff === 1) {
                    edges.push([i, j]);
                }
            }
        }
        return edges;
    }

    /**
     * 添加轨迹粒子
     */
    addTrailParticle(position, color) {
        const geometry = new THREE.SphereGeometry(0.03, 4, 4);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        const particle = new THREE.Mesh(geometry, material);
        particle.position.copy(position);
        particle.userData.life = 1.0;
        particle.userData.decay = 0.02;
        
        this.trails.push(particle);
        this.mainGroup.add(particle);
    }

    /**
     * 更新轨迹粒子
     */
    updateTrails() {
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const particle = this.trails[i];
            particle.userData.life -= particle.userData.decay;
            particle.material.opacity = particle.userData.life * 0.8;
            particle.scale.setScalar(particle.userData.life);
            
            if (particle.userData.life <= 0) {
                this.mainGroup.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
                this.trails.splice(i, 1);
            }
        }
    }

    /**
     * 缓动函数
     */
    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    /**
     * 显示演化完成提示
     */
    showEvolutionComplete(dim) {
        const data = this.dimensionData[dim];
        const message = `🎉 欢迎来到${dim}维空间！${data.name}有 ${data.vertices} 个顶点，${data.edges} 条边`;
        this.showGuide(message);
    }

    /**
     * 更新演化进度显示
     */
    updateEvolutionProgress(fromDim, toDim, t) {
        const progressText = document.getElementById('evolution-progress');
        if (progressText) {
            const percent = Math.round(t * 100);
            progressText.textContent = `${fromDim}D → ${toDim}D: ${percent}%`;
        }
        
        // 计算当前显示的实际顶点数和边数
        const fromVertices = Math.pow(2, fromDim);
        const toVertices = Math.pow(2, toDim);
        const fromEdges = fromDim * Math.pow(2, fromDim - 1);
        const toEdges = toDim * Math.pow(2, toDim - 1);
        
        // 插值计算当前显示的数量
        const currentVertices = Math.round(fromVertices + (toVertices - fromVertices) * t);
        const currentEdges = Math.round(fromEdges + (toEdges - fromEdges) * t);
        
        // 更新面板（使用目标维度的信息，但显示插值的数量）
        this.updateDimensionPanel(toDim, currentVertices, currentEdges);
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404080, 0.4);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(5, 10, 5);
        this.scene.add(mainLight);
        
        // 多彩点光源
        const pointLight1 = new THREE.PointLight(0xff00ff, 0.5, 20);
        pointLight1.position.set(-5, 3, 0);
        this.mainGroup.add(pointLight1);
        
        const pointLight2 = new THREE.PointLight(0x00ffff, 0.5, 20);
        pointLight2.position.set(5, -3, 0);
        this.mainGroup.add(pointLight2);
    }

    /**
     * 创建维度信息面板
     */
    createDimensionPanel() {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
        const panel = document.createElement('div');
        panel.id = 'dimension-panel';
        panel.className = 'dimension-panel';
        panel.innerHTML = `
            <div class="dim-title">
                <span class="dim-number" id="dim-number">0</span>
                <span class="dim-label">维</span>
            </div>
            <div class="dim-name" id="dim-name">点</div>
            <div class="dim-stats">
                <div class="stat-item">
                    <span class="stat-value" id="stat-vertices">1</span>
                    <span class="stat-label">顶点</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="stat-edges">0</span>
                    <span class="stat-label">边</span>
                </div>
                <div class="stat-item">
                    <span class="stat-value" id="stat-faces">0</span>
                    <span class="stat-label">面</span>
                </div>
            </div>
            <div class="dim-formula">
                顶点数 = 2<sup id="formula-n">0</sup> = <span id="formula-result">1</span>
            </div>
            <div id="evolution-progress" class="evolution-progress"></div>
        `;
        container.appendChild(panel);
    }

    /**
     * 更新维度信息面板
     * @param {number} dim - 当前维度（默认使用this.currentDimension）
     * @param {number} actualVertices - 实际显示的顶点数（用于演化过程）
     * @param {number} actualEdges - 实际显示的边数（用于演化过程）
     */
    updateDimensionPanel(dim = null, actualVertices = null, actualEdges = null) {
        const dimension = dim !== null ? dim : this.currentDimension;
        const data = this.dimensionData[dimension];
        if (!data) return;
        
        const dimNumber = document.getElementById('dim-number');
        const dimName = document.getElementById('dim-name');
        const statVertices = document.getElementById('stat-vertices');
        const statEdges = document.getElementById('stat-edges');
        const statFaces = document.getElementById('stat-faces');
        const formulaN = document.getElementById('formula-n');
        const formulaResult = document.getElementById('formula-result');
        
        // 使用实际值或计算值
        const vertexCount = actualVertices !== null ? actualVertices : data.vertices;
        const edgeCount = actualEdges !== null ? actualEdges : data.edges;
        
        if (dimNumber) dimNumber.textContent = dimension;
        if (dimName) dimName.textContent = data.name;
        if (statVertices) statVertices.textContent = vertexCount;
        if (statEdges) statEdges.textContent = edgeCount;
        if (statFaces) statFaces.textContent = data.faces;
        if (formulaN) formulaN.textContent = dimension;
        if (formulaResult) formulaResult.textContent = data.vertices;
        
        // 更新颜色
        const color = this.colors.dimension[dimension] || 0xffffff;
        const colorHex = '#' + color.toString(16).padStart(6, '0');
        if (dimNumber) dimNumber.style.color = colorHex;
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="tesseract-controls">
                <div class="control-group">
                    <label>维度演化</label>
                    <div class="dim-buttons">
                        ${[0,1,2,3,4,5,6].map(d => `
                            <button class="dim-btn ${d === 0 ? 'active' : ''}" data-dim="${d}">${d}D</button>
                        `).join('')}
                    </div>
                </div>
                <div class="control-group">
                    <button class="action-btn" id="btn-auto-evolve">
                        <i class="fas fa-play"></i> 自动演化
                    </button>
                    <button class="action-btn" id="btn-reset-dim">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
                <div class="control-group rotation-group" style="display: none;" id="rotation-controls">
                    <label>4D旋转</label>
                    <button class="action-btn small toggle active" id="btn-auto-rotate">
                        <i class="fas fa-sync"></i> 自动
                    </button>
                </div>
            </div>
        `;
        
        // 绑定事件
        document.querySelectorAll('.dim-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dim = parseInt(e.target.dataset.dim);
                this.evolveToDimension(dim);
                
                // 更新按钮状态
                document.querySelectorAll('.dim-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        document.getElementById('btn-auto-evolve')?.addEventListener('click', () => {
            this.startAutoEvolution();
        });
        
        document.getElementById('btn-reset-dim')?.addEventListener('click', () => {
            this.initDimension(0);
            document.querySelectorAll('.dim-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.dim-btn[data-dim="0"]')?.classList.add('active');
        });
        
        document.getElementById('btn-auto-rotate')?.addEventListener('click', (e) => {
            this.autoRotate4D = !this.autoRotate4D;
            e.target.classList.toggle('active');
        });
    }

    /**
     * 开始自动演化
     */
    startAutoEvolution() {
        if (this.isAnimating) return;
        
        this.isAutoPlaying = true;
        this.initDimension(0);
        
        const evolveNext = (dim) => {
            if (dim > this.maxDimension || !this.isAutoPlaying) {
                this.isAutoPlaying = false;
                return;
            }
            
            setTimeout(() => {
                this.evolveToDimension(dim);
                
                // 更新按钮状态
                document.querySelectorAll('.dim-btn').forEach(b => b.classList.remove('active'));
                document.querySelector(`.dim-btn[data-dim="${dim}"]`)?.classList.add('active');
                
                // 等待当前演化完成
                const checkComplete = setInterval(() => {
                    if (!this.isAnimating) {
                        clearInterval(checkComplete);
                        // 在当前维度停留一会儿
                        setTimeout(() => evolveNext(dim + 1), 2000);
                    }
                }, 100);
            }, dim === 0 ? 1000 : 500);
        };
        
        this.showGuide('🚀 开始维度演化之旅！从0维的点出发...');
        evolveNext(1);
    }

    /**
     * 显示引导消息
     */
    showGuide(message) {
        const container = document.getElementById('view-scene');
        if (!container) return;
        
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

    /**
     * 动画更新
     */
    animate(time, delta) {
        this.animationTime = time;
        
        // 星空缓慢旋转
        if (this.starField) {
            this.starField.rotation.y = time * 0.02;
        }
        
        // 4D自动旋转
        if (this.currentDimension >= 4 && this.autoRotate4D && !this.isAnimating) {
            this.rotationXW += delta * 0.3;
            this.rotationYW += delta * 0.2;
            this.rotationZW += delta * 0.15;
            this.updateGeometryPositions();
            
            // 显示旋转控制
            const rotationControls = document.getElementById('rotation-controls');
            if (rotationControls) rotationControls.style.display = 'flex';
        } else if (this.currentDimension < 4) {
            const rotationControls = document.getElementById('rotation-controls');
            if (rotationControls) rotationControls.style.display = 'none';
        }
        
        // 顶点脉动效果
        this.vertexMeshes.forEach((mesh, i) => {
            const pulse = 1 + Math.sin(time * 3 + i * 0.5) * 0.1;
            mesh.scale.setScalar(pulse);
        });
        
        // 更新轨迹粒子
        this.updateTrails();
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        setTimeout(() => {
            this.showGuide('🌌 欢迎探索维度空间！点击"自动演化"开始震撼之旅');
        }, 500);
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return this.vertexMeshes.filter(m => m.userData.name);
    }

    /**
     * 清理
     */
    dispose() {
        this.isAutoPlaying = false;
        this.clearGeometry();
        
        // 移除维度面板
        const panel = document.getElementById('dimension-panel');
        if (panel) panel.remove();
    }
}

// 注册到全局
window.TesseractScene = TesseractScene;
