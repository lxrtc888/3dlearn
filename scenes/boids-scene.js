/**
 * Boids群体智慧场景 - Swarm Intelligence Visualization
 * ============================================
 * "没有领袖，却如此协调"
 * 
 * 核心概念（Craig Reynolds 1986年提出）：
 * 1. 分离(Separation): 避免与邻近个体拥挤
 * 2. 对齐(Alignment): 与邻近个体保持同向
 * 3. 聚合(Cohesion): 向邻近个体的中心移动
 * 
 * 三条简单规则 → 复杂群体行为
 * 应用：鸟群、鱼群、蜂群、交通流、AI群体行为
 * ============================================
 */
window.BoidsScene = class BoidsScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // Boids
        this.boids = [];
        this.boidMeshes = [];
        this.trails = [];

        // 参数
        this.params = {
            count: 100,                   // Boid数量
            maxSpeed: 0.15,               // 最大速度
            maxForce: 0.01,               // 最大转向力
            
            // 三大规则权重
            separationWeight: 1.5,        // 分离权重
            alignmentWeight: 1.0,         // 对齐权重
            cohesionWeight: 1.0,          // 聚合权重
            
            // 感知范围
            separationRadius: 2,          // 分离距离
            neighborRadius: 5,            // 邻居感知距离
            
            // 可视化
            showTrails: false,            // 显示轨迹
            trailLength: 20,              // 轨迹长度
            boidType: 'bird',             // bird, fish, arrow
            
            // 边界
            boundarySize: 15,             // 边界大小
            boundaryForce: 0.5,           // 边界反弹力
            
            // 捕食者
            hasPredator: false,           // 是否有捕食者
            predatorPos: new THREE.Vector3(0, 0, 0)
        };

        // 颜色
        this.colors = {
            background: 0x0a1628,
            boid: 0x4ecdc4,
            boidGlow: 0x00ff88,
            trail: 0x4a90d9,
            predator: 0xff6b6b,
            boundary: 0x333355
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 20, z: 30 };
        
        this.isAutoPlaying = true;
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

        // 背景 - 深蓝天空/海洋
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

        // 初始化Boids
        this.initBoids();
    }

    /**
     * 设置光照
     */
    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.5);
        directional.position.set(10, 20, 10);
        this.scene.add(directional);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建边界框
        this.createBoundary();

        // 创建环境粒子
        this.createEnvironment();
    }

    /**
     * 创建边界
     */
    createBoundary() {
        const size = this.params.boundarySize;
        
        // 边界线框
        const geometry = new THREE.BoxGeometry(size * 2, size * 2, size * 2);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ 
            color: this.colors.boundary,
            transparent: true,
            opacity: 0.3
        });
        this.boundaryBox = new THREE.LineSegments(edges, material);
        this.mainGroup.add(this.boundaryBox);

        // 底部网格
        const gridHelper = new THREE.GridHelper(size * 2, 20, 0x222244, 0x111133);
        gridHelper.position.y = -size;
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.mainGroup.add(gridHelper);
    }

    /**
     * 创建环境
     */
    createEnvironment() {
        // 背景星点（模拟天空或水中气泡）
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = [];
        
        for (let i = 0; i < 500; i++) {
            const range = 50;
            particlePositions.push(
                (Math.random() - 0.5) * range,
                (Math.random() - 0.5) * range,
                (Math.random() - 0.5) * range
            );
        }
        
        particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(particlePositions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.3
        });
        
        this.envParticles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.envParticles);
    }

    /**
     * 初始化Boids
     */
    initBoids() {
        // 清除旧的
        this.clearBoids();

        const size = this.params.boundarySize * 0.8;

        // 创建Boids
        for (let i = 0; i < this.params.count; i++) {
            const boid = {
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * size * 2,
                    (Math.random() - 0.5) * size * 2,
                    (Math.random() - 0.5) * size * 2
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * this.params.maxSpeed,
                    (Math.random() - 0.5) * this.params.maxSpeed,
                    (Math.random() - 0.5) * this.params.maxSpeed
                ),
                acceleration: new THREE.Vector3(),
                trail: []
            };

            this.boids.push(boid);

            // 创建网格
            const mesh = this.createBoidMesh(i);
            this.boidMeshes.push(mesh);
            this.mainGroup.add(mesh);

            // 创建轨迹
            if (this.params.showTrails) {
                const trail = this.createTrail();
                this.trails.push(trail);
                this.mainGroup.add(trail);
            }
        }
    }

    /**
     * 创建Boid网格
     */
    createBoidMesh(index) {
        let geometry;
        
        switch (this.params.boidType) {
            case 'bird':
                // 鸟形（锥体）
                geometry = new THREE.ConeGeometry(0.15, 0.5, 4);
                geometry.rotateX(Math.PI / 2);
                break;
            case 'fish':
                // 鱼形（扁椭球）
                geometry = new THREE.SphereGeometry(0.2, 8, 8);
                geometry.scale(1, 0.5, 0.3);
                break;
            case 'arrow':
                // 箭头形
                geometry = new THREE.ConeGeometry(0.1, 0.4, 3);
                geometry.rotateX(Math.PI / 2);
                break;
            default:
                geometry = new THREE.ConeGeometry(0.15, 0.5, 4);
                geometry.rotateX(Math.PI / 2);
        }

        // 渐变颜色
        const hue = (index / this.params.count) * 0.3 + 0.5; // 青色到蓝色
        const color = new THREE.Color().setHSL(hue, 0.8, 0.6);
        
        const material = new THREE.MeshPhongMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.userData.index = index;
        
        return mesh;
    }

    /**
     * 创建轨迹
     */
    createTrail() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineBasicMaterial({
            color: this.colors.trail,
            transparent: true,
            opacity: 0.3
        });
        return new THREE.Line(geometry, material);
    }

    /**
     * 清除Boids
     */
    clearBoids() {
        this.boidMeshes.forEach(mesh => {
            this.mainGroup.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        
        this.trails.forEach(trail => {
            this.mainGroup.remove(trail);
            trail.geometry.dispose();
            trail.material.dispose();
        });

        this.boids = [];
        this.boidMeshes = [];
        this.trails = [];
    }

    /**
     * Boids核心算法
     */
    updateBoids() {
        this.boids.forEach((boid, index) => {
            // 重置加速度
            boid.acceleration.set(0, 0, 0);

            // 获取邻居
            const neighbors = this.getNeighbors(boid, index);

            // 应用三大规则
            const separation = this.separate(boid, neighbors);
            const alignment = this.align(boid, neighbors);
            const cohesion = this.cohere(boid, neighbors);

            // 加权叠加
            separation.multiplyScalar(this.params.separationWeight);
            alignment.multiplyScalar(this.params.alignmentWeight);
            cohesion.multiplyScalar(this.params.cohesionWeight);

            boid.acceleration.add(separation);
            boid.acceleration.add(alignment);
            boid.acceleration.add(cohesion);

            // 边界力
            const boundaryForce = this.boundaryForce(boid);
            boid.acceleration.add(boundaryForce);

            // 捕食者躲避
            if (this.params.hasPredator) {
                const flee = this.flee(boid, this.params.predatorPos);
                flee.multiplyScalar(3);
                boid.acceleration.add(flee);
            }

            // 更新速度
            boid.velocity.add(boid.acceleration);
            
            // 限制速度
            if (boid.velocity.length() > this.params.maxSpeed) {
                boid.velocity.normalize().multiplyScalar(this.params.maxSpeed);
            }

            // 更新位置
            boid.position.add(boid.velocity);

            // 更新轨迹
            if (this.params.showTrails) {
                boid.trail.push(boid.position.clone());
                if (boid.trail.length > this.params.trailLength) {
                    boid.trail.shift();
                }
            }

            // 更新网格
            this.updateBoidMesh(index);
        });
    }

    /**
     * 获取邻居
     */
    getNeighbors(boid, selfIndex) {
        const neighbors = [];
        
        this.boids.forEach((other, index) => {
            if (index === selfIndex) return;
            
            const distance = boid.position.distanceTo(other.position);
            if (distance < this.params.neighborRadius) {
                neighbors.push({ boid: other, distance });
            }
        });

        return neighbors;
    }

    /**
     * 分离规则：避免拥挤
     */
    separate(boid, neighbors) {
        const steer = new THREE.Vector3();
        let count = 0;

        neighbors.forEach(({ boid: other, distance }) => {
            if (distance < this.params.separationRadius && distance > 0) {
                const diff = new THREE.Vector3().subVectors(boid.position, other.position);
                diff.normalize();
                diff.divideScalar(distance); // 距离越近，力越大
                steer.add(diff);
                count++;
            }
        });

        if (count > 0) {
            steer.divideScalar(count);
            steer.normalize();
            steer.multiplyScalar(this.params.maxSpeed);
            steer.sub(boid.velocity);
            if (steer.length() > this.params.maxForce) {
                steer.normalize().multiplyScalar(this.params.maxForce);
            }
        }

        return steer;
    }

    /**
     * 对齐规则：与邻居同向
     */
    align(boid, neighbors) {
        const avgVelocity = new THREE.Vector3();

        if (neighbors.length === 0) return avgVelocity;

        neighbors.forEach(({ boid: other }) => {
            avgVelocity.add(other.velocity);
        });

        avgVelocity.divideScalar(neighbors.length);
        avgVelocity.normalize();
        avgVelocity.multiplyScalar(this.params.maxSpeed);

        const steer = new THREE.Vector3().subVectors(avgVelocity, boid.velocity);
        if (steer.length() > this.params.maxForce) {
            steer.normalize().multiplyScalar(this.params.maxForce);
        }

        return steer;
    }

    /**
     * 聚合规则：向群体中心移动
     */
    cohere(boid, neighbors) {
        const center = new THREE.Vector3();

        if (neighbors.length === 0) return center;

        neighbors.forEach(({ boid: other }) => {
            center.add(other.position);
        });

        center.divideScalar(neighbors.length);

        return this.seek(boid, center);
    }

    /**
     * 寻找目标
     */
    seek(boid, target) {
        const desired = new THREE.Vector3().subVectors(target, boid.position);
        desired.normalize();
        desired.multiplyScalar(this.params.maxSpeed);

        const steer = new THREE.Vector3().subVectors(desired, boid.velocity);
        if (steer.length() > this.params.maxForce) {
            steer.normalize().multiplyScalar(this.params.maxForce);
        }

        return steer;
    }

    /**
     * 逃离目标
     */
    flee(boid, target) {
        const distance = boid.position.distanceTo(target);
        if (distance > 10) return new THREE.Vector3();

        const desired = new THREE.Vector3().subVectors(boid.position, target);
        desired.normalize();
        desired.multiplyScalar(this.params.maxSpeed);

        const steer = new THREE.Vector3().subVectors(desired, boid.velocity);
        if (steer.length() > this.params.maxForce) {
            steer.normalize().multiplyScalar(this.params.maxForce);
        }

        return steer;
    }

    /**
     * 边界力
     */
    boundaryForce(boid) {
        const force = new THREE.Vector3();
        const size = this.params.boundarySize;
        const margin = size * 0.8;
        const strength = this.params.boundaryForce;

        // X轴
        if (boid.position.x > margin) {
            force.x = -strength * (boid.position.x - margin);
        } else if (boid.position.x < -margin) {
            force.x = -strength * (boid.position.x + margin);
        }

        // Y轴
        if (boid.position.y > margin) {
            force.y = -strength * (boid.position.y - margin);
        } else if (boid.position.y < -margin) {
            force.y = -strength * (boid.position.y + margin);
        }

        // Z轴
        if (boid.position.z > margin) {
            force.z = -strength * (boid.position.z - margin);
        } else if (boid.position.z < -margin) {
            force.z = -strength * (boid.position.z + margin);
        }

        return force;
    }

    /**
     * 更新Boid网格
     */
    updateBoidMesh(index) {
        const boid = this.boids[index];
        const mesh = this.boidMeshes[index];

        // 更新位置
        mesh.position.copy(boid.position);

        // 更新朝向（沿速度方向）
        if (boid.velocity.length() > 0.01) {
            const target = new THREE.Vector3().addVectors(boid.position, boid.velocity);
            mesh.lookAt(target);
        }

        // 更新轨迹
        if (this.params.showTrails && this.trails[index] && boid.trail.length > 1) {
            const positions = [];
            boid.trail.forEach(p => positions.push(p.x, p.y, p.z));
            
            this.trails[index].geometry.setAttribute(
                'position',
                new THREE.Float32BufferAttribute(positions, 3)
            );
            this.trails[index].geometry.attributes.position.needsUpdate = true;
        }
    }

    /**
     * 设置UI
     */
    setupUI() {
        // 底部操作按钮
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'flex';
            controlsDiv.innerHTML = `
                <button class="control-btn" id="btn-more-sep">
                    <i class="fas fa-arrows-alt"></i> 更分散
                </button>
                <button class="control-btn" id="btn-more-align">
                    <i class="fas fa-arrows-alt-h"></i> 更对齐
                </button>
                <button class="control-btn" id="btn-more-coh">
                    <i class="fas fa-compress-alt"></i> 更聚合
                </button>
                <button class="control-btn" id="btn-predator">
                    <i class="fas fa-crow"></i> 捕食者
                </button>
                <button class="control-btn" id="btn-add-boids">
                    <i class="fas fa-plus"></i> 增加数量
                </button>
                <button class="control-btn active" id="btn-play">
                    <i class="fas fa-pause"></i> 暂停
                </button>
                <button class="control-btn" id="btn-reset">
                    <i class="fas fa-redo"></i> 重置
                </button>
                <button class="control-btn" id="btn-reset-view">
                    <i class="fas fa-video"></i> 重置视角
                </button>
            `;

            // 底部按钮事件
            document.getElementById('btn-more-sep')?.addEventListener('click', () => {
                this.params.separationWeight = Math.min(3, this.params.separationWeight + 0.5);
                this.showToast(`分离权重: ${this.params.separationWeight.toFixed(1)}`);
            });
            document.getElementById('btn-more-align')?.addEventListener('click', () => {
                this.params.alignmentWeight = Math.min(3, this.params.alignmentWeight + 0.5);
                this.showToast(`对齐权重: ${this.params.alignmentWeight.toFixed(1)}`);
            });
            document.getElementById('btn-more-coh')?.addEventListener('click', () => {
                this.params.cohesionWeight = Math.min(3, this.params.cohesionWeight + 0.5);
                this.showToast(`聚合权重: ${this.params.cohesionWeight.toFixed(1)}`);
            });
            document.getElementById('btn-predator')?.addEventListener('click', () => {
                this.params.hasPredator = !this.params.hasPredator;
                const btn = document.getElementById('btn-predator');
                btn.classList.toggle('active', this.params.hasPredator);
                if (this.params.hasPredator) {
                    this.showToast('🦅 捕食者出现！移动鼠标控制');
                    this.createPredator();
                } else {
                    this.removePredator();
                    this.showToast('捕食者已消失');
                }
            });
            document.getElementById('btn-add-boids')?.addEventListener('click', () => {
                this.params.count = Math.min(200, this.params.count + 20);
                this.initBoids();
                this.showToast(`群体数量: ${this.params.count}`);
            });
            document.getElementById('btn-play')?.addEventListener('click', () => {
                this.isAutoPlaying = !this.isAutoPlaying;
                const btn = document.getElementById('btn-play');
                btn.innerHTML = this.isAutoPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 播放';
            });
            document.getElementById('btn-reset')?.addEventListener('click', () => this.initBoids());
            document.getElementById('btn-reset-view')?.addEventListener('click', () => this.resetCamera());
        }

        const panel = document.getElementById('control-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="control-section">
                <h4><i class="fas fa-balance-scale"></i> 三大规则权重</h4>
                <div class="rule-slider">
                    <label><span class="rule-icon">↔️</span> 分离: <span id="sep-val">${this.params.separationWeight.toFixed(1)}</span></label>
                    <input type="range" id="separation-slider" 
                           min="0" max="3" step="0.1"
                           value="${this.params.separationWeight}" 
                           class="styled-slider cyan">
                </div>
                <div class="rule-slider">
                    <label><span class="rule-icon">→→</span> 对齐: <span id="align-val">${this.params.alignmentWeight.toFixed(1)}</span></label>
                    <input type="range" id="alignment-slider" 
                           min="0" max="3" step="0.1"
                           value="${this.params.alignmentWeight}" 
                           class="styled-slider green">
                </div>
                <div class="rule-slider">
                    <label><span class="rule-icon">⊙</span> 聚合: <span id="coh-val">${this.params.cohesionWeight.toFixed(1)}</span></label>
                    <input type="range" id="cohesion-slider" 
                           min="0" max="3" step="0.1"
                           value="${this.params.cohesionWeight}" 
                           class="styled-slider blue">
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-users"></i> 群体设置</h4>
                <div class="rule-slider">
                    <label>数量: <span id="count-val">${this.params.count}</span></label>
                    <input type="range" id="count-slider" 
                           min="20" max="200" step="10"
                           value="${this.params.count}" 
                           class="styled-slider">
                </div>
                <div class="rule-slider">
                    <label>速度: <span id="speed-val">${this.params.maxSpeed.toFixed(2)}</span></label>
                    <input type="range" id="speed-slider" 
                           min="0.05" max="0.3" step="0.01"
                           value="${this.params.maxSpeed}" 
                           class="styled-slider">
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-exclamation-triangle"></i> 捕食者</h4>
                <label class="toggle-label">
                    <input type="checkbox" id="toggle-predator">
                    <span>添加捕食者（鼠标控制）</span>
                </label>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-palette"></i> 外观</h4>
                <select id="boid-type" class="styled-select">
                    <option value="bird">🐦 鸟群</option>
                    <option value="fish">🐟 鱼群</option>
                    <option value="arrow">➤ 箭头</option>
                </select>
                <label class="toggle-label" style="margin-top:10px;">
                    <input type="checkbox" id="toggle-trails">
                    <span>显示轨迹</span>
                </label>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-play-circle"></i> 控制</h4>
                <div class="control-buttons">
                    <button id="btn-play" class="control-btn primary">
                        <i class="fas fa-pause"></i> 暂停
                    </button>
                    <button id="btn-reset" class="control-btn">
                        <i class="fas fa-redo"></i> 重置
                    </button>
                </div>
            </div>
            
            <style>
                .rule-slider {
                    margin-bottom: 12px;
                }
                .rule-slider label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 5px;
                    font-size: 12px;
                    color: #aaa;
                }
                .rule-icon {
                    font-size: 14px;
                }
                .styled-slider {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(to right, #333, #666);
                    outline: none;
                    -webkit-appearance: none;
                }
                .styled-slider.cyan {
                    background: linear-gradient(to right, #333, #4ecdc4);
                }
                .styled-slider.green {
                    background: linear-gradient(to right, #333, #00ff88);
                }
                .styled-slider.blue {
                    background: linear-gradient(to right, #333, #4a90d9);
                }
                .styled-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 16px;
                    height: 16px;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(255,255,255,0.3);
                }
                .styled-select {
                    width: 100%;
                    padding: 10px;
                    border: 2px solid #4ecdc4;
                    background: rgba(78, 205, 196, 0.1);
                    color: #ffffff;
                    border-radius: 8px;
                    font-size: 13px;
                    cursor: pointer;
                }
                .styled-select option {
                    background: #1a1a2e;
                }
                .toggle-label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 13px;
                }
                .toggle-label input {
                    width: 18px;
                    height: 18px;
                    accent-color: #4ecdc4;
                }
                .control-buttons {
                    display: flex;
                    gap: 10px;
                }
                .control-btn {
                    flex: 1;
                    padding: 12px;
                    border: none;
                    border-radius: 8px;
                    background: rgba(255,255,255,0.1);
                    color: #ffffff;
                    cursor: pointer;
                    transition: all 0.3s;
                }
                .control-btn.primary {
                    background: linear-gradient(135deg, #4ecdc4, #00ff88);
                }
            </style>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 分离权重
        const sepSlider = document.getElementById('separation-slider');
        if (sepSlider) {
            sepSlider.addEventListener('input', (e) => {
                this.params.separationWeight = parseFloat(e.target.value);
                document.getElementById('sep-val').textContent = this.params.separationWeight.toFixed(1);
            });
        }

        // 对齐权重
        const alignSlider = document.getElementById('alignment-slider');
        if (alignSlider) {
            alignSlider.addEventListener('input', (e) => {
                this.params.alignmentWeight = parseFloat(e.target.value);
                document.getElementById('align-val').textContent = this.params.alignmentWeight.toFixed(1);
            });
        }

        // 聚合权重
        const cohSlider = document.getElementById('cohesion-slider');
        if (cohSlider) {
            cohSlider.addEventListener('input', (e) => {
                this.params.cohesionWeight = parseFloat(e.target.value);
                document.getElementById('coh-val').textContent = this.params.cohesionWeight.toFixed(1);
            });
        }

        // 数量
        const countSlider = document.getElementById('count-slider');
        if (countSlider) {
            countSlider.addEventListener('input', (e) => {
                this.params.count = parseInt(e.target.value);
                document.getElementById('count-val').textContent = this.params.count;
            });
            countSlider.addEventListener('change', () => {
                this.initBoids();
            });
        }

        // 速度
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.params.maxSpeed = parseFloat(e.target.value);
                document.getElementById('speed-val').textContent = this.params.maxSpeed.toFixed(2);
            });
        }

        // 捕食者
        const predatorToggle = document.getElementById('toggle-predator');
        if (predatorToggle) {
            predatorToggle.addEventListener('change', (e) => {
                this.params.hasPredator = e.target.checked;
                if (e.target.checked) {
                    this.showToast('🦅 捕食者出现！移动鼠标控制位置');
                    this.createPredator();
                } else {
                    this.removePredator();
                }
            });
        }

        // 外观类型
        const boidType = document.getElementById('boid-type');
        if (boidType) {
            boidType.addEventListener('change', (e) => {
                this.params.boidType = e.target.value;
                this.initBoids();
            });
        }

        // 轨迹
        const trailsToggle = document.getElementById('toggle-trails');
        if (trailsToggle) {
            trailsToggle.addEventListener('change', (e) => {
                this.params.showTrails = e.target.checked;
                this.initBoids();
            });
        }

        // 播放/暂停
        const playBtn = document.getElementById('btn-play');
        if (playBtn) {
            playBtn.addEventListener('click', () => {
                this.isAutoPlaying = !this.isAutoPlaying;
                playBtn.innerHTML = this.isAutoPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 播放';
            });
        }

        // 重置
        const resetBtn = document.getElementById('btn-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.initBoids();
            });
        }
    }

    /**
     * 创建捕食者
     */
    createPredator() {
        const geometry = new THREE.SphereGeometry(1, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            color: this.colors.predator,
            transparent: true,
            opacity: 0.8
        });
        this.predatorMesh = new THREE.Mesh(geometry, material);
        this.mainGroup.add(this.predatorMesh);

        // 光晕
        const glowGeometry = new THREE.SphereGeometry(1.5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.predator,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.predatorMesh.add(glow);
    }

    /**
     * 移除捕食者
     */
    removePredator() {
        if (this.predatorMesh) {
            this.mainGroup.remove(this.predatorMesh);
            this.predatorMesh.geometry.dispose();
            this.predatorMesh.material.dispose();
            this.predatorMesh = null;
        }
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.innerHTML = message;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: linear-gradient(135deg, rgba(78, 205, 196, 0.9), rgba(0, 255, 136, 0.9));
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        if (panel) {
            panel.innerHTML = `
                <div style="padding: 15px;">
                    <h3 style="color: #4ecdc4; margin-bottom: 10px;">
                        <i class="fas fa-crow"></i> Boids群体智慧
                    </h3>
                    <p style="color: #aaa; font-size: 13px; line-height: 1.6;">
                        <strong style="color: #00ff88;">三条简单规则：</strong><br>
                        1️⃣ <strong>分离</strong>：避免拥挤<br>
                        2️⃣ <strong>对齐</strong>：与邻居同向<br>
                        3️⃣ <strong>聚合</strong>：向群体中心
                    </p>
                    <div style="margin: 15px 0; padding: 10px; background: rgba(78,205,196,0.1); border-radius: 8px;">
                        <p style="color: #4ecdc4; font-size: 12px;">
                            ✨ 没有领袖，却如此协调！<br>
                            🧠 涌现行为 = 简单规则 → 复杂智能<br>
                            🐦 应用：鸟群、鱼群、机器人群
                        </p>
                    </div>
                    <p style="color: #888; font-size: 12px;">
                        💡 调整规则权重，观察群体行为变化！
                    </p>
                </div>
            `;
        }
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        if (!this.isAutoPlaying) return;

        // 更新Boids
        this.updateBoids();

        // 更新捕食者
        if (this.predatorMesh) {
            this.predatorMesh.position.copy(this.params.predatorPos);
            // 脉动效果
            const pulse = 1 + Math.sin(time * 0.005) * 0.1;
            this.predatorMesh.scale.set(pulse, pulse, pulse);
        }

        // 环境粒子微动
        if (this.envParticles) {
            this.envParticles.rotation.y += 0.0002;
        }
    }

    /**
     * 鼠标移动处理
     */
    onMouseMove(event) {
        if (this.params.hasPredator) {
            // 将鼠标位置转换为3D空间坐标
            const rect = this.renderer.domElement.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // 简单映射到边界范围内
            this.params.predatorPos.x = x * this.params.boundarySize;
            this.params.predatorPos.y = y * this.params.boundarySize;
            this.params.predatorPos.z = 0;
        }
    }

    /**
     * 点击处理
     */
    onClick(event) {
        // 可扩展
    }

    /**
     * 重置相机
     */
    resetCamera() {
        this.camera.position.set(
            this.defaultCameraPos.x,
            this.defaultCameraPos.y,
            this.defaultCameraPos.z
        );
        this.camera.lookAt(0, 0, 0);
    }

    /**
     * 销毁场景
     */
    dispose() {
        this.clearBoids();
        this.removePredator();

        if (this.mainGroup) {
            this.mainGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(this.mainGroup);
        }

        if (this.envParticles) {
            this.envParticles.geometry.dispose();
            this.envParticles.material.dispose();
            this.scene.remove(this.envParticles);
        }

        // 添加动画样式
        if (!document.querySelector('#boids-animations')) {
            const animStyle = document.createElement('style');
            animStyle.id = 'boids-animations';
            animStyle.textContent = `
                @keyframes fadeInOut {
                    0% { opacity: 0; transform: translate(-50%, -20px); }
                    20% { opacity: 1; transform: translate(-50%, 0); }
                    80% { opacity: 1; transform: translate(-50%, 0); }
                    100% { opacity: 0; transform: translate(-50%, -20px); }
                }
            `;
            document.head.appendChild(animStyle);
        }
    }
};
