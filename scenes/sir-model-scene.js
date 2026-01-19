/**
 * 病毒传播SIR模型场景 - Epidemic Simulation
 * ============================================
 * "理解'拉平曲线'的意义"
 * 
 * SIR模型：
 * - S (Susceptible): 易感者 - 尚未感染
 * - I (Infected): 感染者 - 正在传播病毒
 * - R (Recovered): 康复者 - 已获得免疫
 * 
 * 核心公式：
 * dS/dt = -β·S·I
 * dI/dt = β·S·I - γ·I
 * dR/dt = γ·I
 * 
 * R₀ (基本传染数) = β/γ
 * ============================================
 */
window.SIRModelScene = class SIRModelScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 粒子（人群）
        this.particles = [];
        this.particleMeshes = [];
        
        // 统计数据
        this.stats = {
            S: 0,
            I: 0,
            R: 0,
            history: []
        };

        // 参数
        this.params = {
            populationSize: 200,          // 人口数量
            initialInfected: 3,           // 初始感染者
            transmissionRate: 0.3,        // 传播率 β
            recoveryRate: 0.02,           // 康复率 γ
            transmissionRadius: 0.8,      // 传播距离
            speed: 0.03,                  // 移动速度
            socialDistancing: false,      // 社交距离
            distancingStrength: 0.5,      // 隔离强度
            vaccination: 0,               // 疫苗接种比例
            quarantine: false,            // 隔离措施
            areaWidth: 12,                // 区域宽度
            areaHeight: 8                 // 区域高度
        };

        // 颜色
        this.colors = {
            S: 0x4ecdc4,  // 健康 - 青色
            I: 0xff6b6b,  // 感染 - 红色
            R: 0xa855f7,  // 康复 - 紫色
            V: 0xffd93d,  // 疫苗 - 金色
            background: 0x0a0a1a,
            grid: 0x1a1a3a
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 12, z: 15 };
        
        this.isAutoPlaying = true;
        this.chartCanvas = null;
        this.chartCtx = null;
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
        this.scene.fog = new THREE.FogExp2(this.colors.background, 0.02);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();

        // 初始化模拟
        this.initSimulation();
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

        // 创建活动区域边界
        this.createBoundary();

        // 创建地面网格
        this.createGround();

        // 创建图表显示区
        this.createChartDisplay();
    }

    /**
     * 创建边界
     */
    createBoundary() {
        const w = this.params.areaWidth;
        const h = this.params.areaHeight;
        
        const points = [
            new THREE.Vector3(-w/2, 0, -h/2),
            new THREE.Vector3(w/2, 0, -h/2),
            new THREE.Vector3(w/2, 0, h/2),
            new THREE.Vector3(-w/2, 0, h/2),
            new THREE.Vector3(-w/2, 0, -h/2)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({ 
            color: 0x4a90d9,
            transparent: true,
            opacity: 0.5
        });
        
        this.boundary = new THREE.Line(geometry, material);
        this.mainGroup.add(this.boundary);

        // 墙壁效果
        const wallGeometry = new THREE.BoxGeometry(w, 0.3, h);
        const wallMaterial = new THREE.MeshBasicMaterial({
            color: 0x4a90d9,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const walls = new THREE.Mesh(wallGeometry, wallMaterial);
        walls.position.y = 0.15;
        this.mainGroup.add(walls);
    }

    /**
     * 创建地面
     */
    createGround() {
        const gridHelper = new THREE.GridHelper(
            Math.max(this.params.areaWidth, this.params.areaHeight) + 2,
            20,
            this.colors.grid,
            this.colors.grid
        );
        gridHelper.material.opacity = 0.3;
        gridHelper.material.transparent = true;
        this.mainGroup.add(gridHelper);
    }

    /**
     * 创建图表显示区
     */
    createChartDisplay() {
        // Canvas图表
        this.chartCanvas = document.createElement('canvas');
        this.chartCanvas.width = 300;
        this.chartCanvas.height = 150;
        this.chartCtx = this.chartCanvas.getContext('2d');

        // 作为纹理
        this.chartTexture = new THREE.CanvasTexture(this.chartCanvas);
        
        const chartGeometry = new THREE.PlaneGeometry(6, 3);
        const chartMaterial = new THREE.MeshBasicMaterial({
            map: this.chartTexture,
            transparent: true
        });
        
        this.chartMesh = new THREE.Mesh(chartGeometry, chartMaterial);
        this.chartMesh.position.set(0, 5, -6);
        this.chartMesh.rotation.x = -0.3;
        this.mainGroup.add(this.chartMesh);

        // 图表边框
        const borderGeometry = new THREE.EdgesGeometry(chartGeometry);
        const borderMaterial = new THREE.LineBasicMaterial({ color: 0x4a90d9 });
        const border = new THREE.LineSegments(borderGeometry, borderMaterial);
        this.chartMesh.add(border);
    }

    /**
     * 初始化模拟
     */
    initSimulation() {
        // 清除旧粒子
        this.clearParticles();

        // 重置统计
        this.stats = {
            S: 0,
            I: 0,
            R: 0,
            history: []
        };

        const w = this.params.areaWidth / 2 - 0.5;
        const h = this.params.areaHeight / 2 - 0.5;

        // 创建粒子
        for (let i = 0; i < this.params.populationSize; i++) {
            const particle = {
                position: new THREE.Vector3(
                    (Math.random() - 0.5) * w * 2,
                    0.3,
                    (Math.random() - 0.5) * h * 2
                ),
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * this.params.speed,
                    0,
                    (Math.random() - 0.5) * this.params.speed
                ),
                state: 'S', // S, I, R
                infectionTime: 0,
                isQuarantined: false
            };

            // 初始感染者
            if (i < this.params.initialInfected) {
                particle.state = 'I';
                particle.infectionTime = 0;
                this.stats.I++;
            } 
            // 疫苗接种者
            else if (i < this.params.initialInfected + Math.floor(this.params.populationSize * this.params.vaccination)) {
                particle.state = 'R'; // 视为已免疫
                this.stats.R++;
            } else {
                this.stats.S++;
            }

            this.particles.push(particle);

            // 创建网格
            const mesh = this.createParticleMesh(particle);
            this.particleMeshes.push(mesh);
            this.mainGroup.add(mesh);
        }

        this.updateChart();
    }

    /**
     * 创建粒子网格
     */
    createParticleMesh(particle) {
        const geometry = new THREE.SphereGeometry(0.15, 16, 16);
        const material = new THREE.MeshPhongMaterial({
            color: this.colors[particle.state],
            emissive: this.colors[particle.state],
            emissiveIntensity: 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(particle.position);
        mesh.userData.particle = particle;
        
        return mesh;
    }

    /**
     * 清除粒子
     */
    clearParticles() {
        this.particleMeshes.forEach(mesh => {
            this.mainGroup.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.particles = [];
        this.particleMeshes = [];
    }

    /**
     * 更新模拟
     */
    updateSimulation() {
        const w = this.params.areaWidth / 2;
        const h = this.params.areaHeight / 2;

        // 更新每个粒子
        this.particles.forEach((particle, index) => {
            // 隔离的粒子不移动
            if (particle.isQuarantined) return;

            // 社交距离 - 避开其他粒子
            if (this.params.socialDistancing && particle.state !== 'I') {
                this.applySocialDistancing(particle, index);
            }

            // 移动
            particle.position.add(particle.velocity);

            // 边界反弹
            if (particle.position.x < -w || particle.position.x > w) {
                particle.velocity.x *= -1;
                particle.position.x = Math.max(-w, Math.min(w, particle.position.x));
            }
            if (particle.position.z < -h || particle.position.z > h) {
                particle.velocity.z *= -1;
                particle.position.z = Math.max(-h, Math.min(h, particle.position.z));
            }

            // 感染者传播
            if (particle.state === 'I') {
                this.spreadInfection(particle, index);
                
                // 康复检查
                if (Math.random() < this.params.recoveryRate) {
                    particle.state = 'R';
                    this.stats.I--;
                    this.stats.R++;
                    this.updateParticleMesh(index);
                }
            }

            // 更新网格位置
            this.particleMeshes[index].position.copy(particle.position);
        });

        // 记录历史
        if (this.stats.history.length < 500) {
            this.stats.history.push({
                S: this.stats.S,
                I: this.stats.I,
                R: this.stats.R
            });
        }

        // 更新图表
        if (this.stats.history.length % 5 === 0) {
            this.updateChart();
        }
    }

    /**
     * 应用社交距离
     */
    applySocialDistancing(particle, index) {
        const avoidance = new THREE.Vector3();
        
        this.particles.forEach((other, otherIndex) => {
            if (index === otherIndex) return;
            
            const distance = particle.position.distanceTo(other.position);
            if (distance < 1.5 && distance > 0) {
                const away = new THREE.Vector3()
                    .subVectors(particle.position, other.position)
                    .normalize()
                    .multiplyScalar(this.params.distancingStrength / distance);
                avoidance.add(away);
            }
        });

        particle.velocity.add(avoidance.multiplyScalar(0.01));
        
        // 限制速度
        const maxSpeed = this.params.speed * 1.5;
        if (particle.velocity.length() > maxSpeed) {
            particle.velocity.normalize().multiplyScalar(maxSpeed);
        }
    }

    /**
     * 传播感染
     */
    spreadInfection(infected, infectedIndex) {
        this.particles.forEach((other, otherIndex) => {
            if (infectedIndex === otherIndex) return;
            if (other.state !== 'S') return;
            
            const distance = infected.position.distanceTo(other.position);
            
            if (distance < this.params.transmissionRadius) {
                if (Math.random() < this.params.transmissionRate * 0.1) {
                    other.state = 'I';
                    other.infectionTime = 0;
                    this.stats.S--;
                    this.stats.I++;
                    this.updateParticleMesh(otherIndex);

                    // 隔离措施
                    if (this.params.quarantine && Math.random() < 0.5) {
                        other.isQuarantined = true;
                        other.velocity.set(0, 0, 0);
                    }
                }
            }
        });
    }

    /**
     * 更新粒子网格
     */
    updateParticleMesh(index) {
        const particle = this.particles[index];
        const mesh = this.particleMeshes[index];
        
        mesh.material.color.setHex(this.colors[particle.state]);
        mesh.material.emissive.setHex(this.colors[particle.state]);

        // 感染者脉动效果
        if (particle.state === 'I') {
            mesh.material.emissiveIntensity = 0.5;
        } else {
            mesh.material.emissiveIntensity = 0.3;
        }
    }

    /**
     * 更新图表
     */
    updateChart() {
        const ctx = this.chartCtx;
        const w = this.chartCanvas.width;
        const h = this.chartCanvas.height;
        const history = this.stats.history;
        const total = this.params.populationSize;

        // 清除
        ctx.fillStyle = 'rgba(10, 10, 26, 0.95)';
        ctx.fillRect(0, 0, w, h);

        // 边框
        ctx.strokeStyle = '#4a90d9';
        ctx.lineWidth = 2;
        ctx.strokeRect(1, 1, w - 2, h - 2);

        // 标题
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('SIR 曲线', w / 2, 15);

        if (history.length < 2) {
            this.chartTexture.needsUpdate = true;
            return;
        }

        const margin = 25;
        const chartW = w - margin * 2;
        const chartH = h - margin * 2;

        // 绘制曲线
        const drawCurve = (key, color) => {
            ctx.beginPath();
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            
            history.forEach((point, i) => {
                const x = margin + (i / (history.length - 1)) * chartW;
                const y = h - margin - (point[key] / total) * chartH;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            
            ctx.stroke();
        };

        // S曲线（青色）
        drawCurve('S', '#4ecdc4');
        // I曲线（红色）
        drawCurve('I', '#ff6b6b');
        // R曲线（紫色）
        drawCurve('R', '#a855f7');

        // 图例
        const legendY = h - 10;
        ctx.font = '10px Arial';
        
        ctx.fillStyle = '#4ecdc4';
        ctx.fillText(`S:${this.stats.S}`, w * 0.2, legendY);
        
        ctx.fillStyle = '#ff6b6b';
        ctx.fillText(`I:${this.stats.I}`, w * 0.5, legendY);
        
        ctx.fillStyle = '#a855f7';
        ctx.fillText(`R:${this.stats.R}`, w * 0.8, legendY);

        this.chartTexture.needsUpdate = true;
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
                <button class="control-btn" id="btn-distancing">
                    <i class="fas fa-people-arrows"></i> 社交距离
                </button>
                <button class="control-btn" id="btn-quarantine">
                    <i class="fas fa-home"></i> 隔离措施
                </button>
                <button class="control-btn" id="btn-vaccine">
                    <i class="fas fa-syringe"></i> 疫苗接种
                </button>
                <button class="control-btn" id="btn-increase-r0">
                    <i class="fas fa-arrow-up"></i> 提高传播率
                </button>
                <button class="control-btn" id="btn-decrease-r0">
                    <i class="fas fa-arrow-down"></i> 降低传播率
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
            document.getElementById('btn-distancing')?.addEventListener('click', () => {
                this.params.socialDistancing = !this.params.socialDistancing;
                const btn = document.getElementById('btn-distancing');
                btn.classList.toggle('active', this.params.socialDistancing);
                this.showToast(this.params.socialDistancing ? '🏠 启用社交距离' : '社交距离已关闭');
            });
            document.getElementById('btn-quarantine')?.addEventListener('click', () => {
                this.params.quarantine = !this.params.quarantine;
                const btn = document.getElementById('btn-quarantine');
                btn.classList.toggle('active', this.params.quarantine);
                this.showToast(this.params.quarantine ? '🏥 启用隔离措施' : '隔离措施已关闭');
            });
            document.getElementById('btn-vaccine')?.addEventListener('click', () => {
                this.params.vaccination = this.params.vaccination >= 0.5 ? 0 : 0.5;
                this.initSimulation();
                this.showToast(`💉 疫苗接种率: ${Math.round(this.params.vaccination * 100)}%`);
            });
            document.getElementById('btn-increase-r0')?.addEventListener('click', () => {
                this.params.transmissionRate = Math.min(1, this.params.transmissionRate + 0.1);
                this.updateR0Display();
                this.showToast(`传播率β: ${this.params.transmissionRate.toFixed(2)}`);
            });
            document.getElementById('btn-decrease-r0')?.addEventListener('click', () => {
                this.params.transmissionRate = Math.max(0.1, this.params.transmissionRate - 0.1);
                this.updateR0Display();
                this.showToast(`传播率β: ${this.params.transmissionRate.toFixed(2)}`);
            });
            document.getElementById('btn-play')?.addEventListener('click', () => {
                this.isAutoPlaying = !this.isAutoPlaying;
                const btn = document.getElementById('btn-play');
                btn.innerHTML = this.isAutoPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 播放';
            });
            document.getElementById('btn-reset')?.addEventListener('click', () => {
                this.initSimulation();
                this.isAutoPlaying = true;
                document.getElementById('btn-play').innerHTML = '<i class="fas fa-pause"></i> 暂停';
            });
            document.getElementById('btn-reset-view')?.addEventListener('click', () => this.resetCamera());
        }

        const panel = document.getElementById('control-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="control-section">
                <h4><i class="fas fa-virus"></i> 病毒参数</h4>
                <div class="param-slider">
                    <label>传播率 β: <span id="transmission-val">${this.params.transmissionRate.toFixed(2)}</span></label>
                    <input type="range" id="transmission-slider" 
                           min="0.05" max="1" step="0.05"
                           value="${this.params.transmissionRate}" 
                           class="styled-slider red">
                </div>
                <div class="param-slider">
                    <label>康复率 γ: <span id="recovery-val">${this.params.recoveryRate.toFixed(2)}</span></label>
                    <input type="range" id="recovery-slider" 
                           min="0.01" max="0.1" step="0.005"
                           value="${this.params.recoveryRate}" 
                           class="styled-slider purple">
                </div>
                <div class="r0-display">
                    <span>R₀ = β/γ = </span>
                    <span id="r0-value" class="r0-value">${(this.params.transmissionRate / this.params.recoveryRate).toFixed(1)}</span>
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-shield-alt"></i> 防控措施</h4>
                <div class="toggle-options">
                    <label class="toggle-label">
                        <input type="checkbox" id="toggle-distancing">
                        <span>社交距离</span>
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" id="toggle-quarantine">
                        <span>隔离措施</span>
                    </label>
                </div>
                <div class="param-slider" style="margin-top: 10px;">
                    <label>疫苗接种率: <span id="vaccine-val">${Math.round(this.params.vaccination * 100)}%</span></label>
                    <input type="range" id="vaccine-slider" 
                           min="0" max="0.9" step="0.1"
                           value="${this.params.vaccination}" 
                           class="styled-slider gold">
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-users"></i> 人口: <span id="pop-val">${this.params.populationSize}</span></h4>
                <input type="range" id="population-slider" 
                       min="50" max="300" step="50"
                       value="${this.params.populationSize}" 
                       class="styled-slider cyan">
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
                .param-slider {
                    margin-bottom: 12px;
                }
                .param-slider label {
                    display: block;
                    margin-bottom: 5px;
                    font-size: 12px;
                    color: #aaa;
                }
                .styled-slider {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    outline: none;
                    -webkit-appearance: none;
                }
                .styled-slider.red {
                    background: linear-gradient(to right, #4ecdc4, #ff6b6b);
                }
                .styled-slider.purple {
                    background: linear-gradient(to right, #ff6b6b, #a855f7);
                }
                .styled-slider.gold {
                    background: linear-gradient(to right, #666, #ffd93d);
                }
                .styled-slider.cyan {
                    background: linear-gradient(to right, #333, #4ecdc4);
                }
                .styled-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    background: #ffffff;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(255,255,255,0.3);
                }
                .r0-display {
                    background: rgba(255, 107, 107, 0.2);
                    padding: 10px;
                    border-radius: 8px;
                    text-align: center;
                    margin-top: 10px;
                }
                .r0-value {
                    font-size: 20px;
                    font-weight: bold;
                    color: #ff6b6b;
                }
                .toggle-options {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
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
                    font-size: 13px;
                }
                .control-btn:hover {
                    background: rgba(255,255,255,0.2);
                    transform: translateY(-2px);
                }
                .control-btn.primary {
                    background: linear-gradient(135deg, #ff6b6b, #a855f7);
                }
            </style>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 传播率
        const transmissionSlider = document.getElementById('transmission-slider');
        if (transmissionSlider) {
            transmissionSlider.addEventListener('input', (e) => {
                this.params.transmissionRate = parseFloat(e.target.value);
                document.getElementById('transmission-val').textContent = this.params.transmissionRate.toFixed(2);
                this.updateR0Display();
            });
        }

        // 康复率
        const recoverySlider = document.getElementById('recovery-slider');
        if (recoverySlider) {
            recoverySlider.addEventListener('input', (e) => {
                this.params.recoveryRate = parseFloat(e.target.value);
                document.getElementById('recovery-val').textContent = this.params.recoveryRate.toFixed(2);
                this.updateR0Display();
            });
        }

        // 社交距离
        const distancingToggle = document.getElementById('toggle-distancing');
        if (distancingToggle) {
            distancingToggle.addEventListener('change', (e) => {
                this.params.socialDistancing = e.target.checked;
                if (e.target.checked) {
                    this.showToast('🏠 启用社交距离：人们会主动保持距离');
                }
            });
        }

        // 隔离措施
        const quarantineToggle = document.getElementById('toggle-quarantine');
        if (quarantineToggle) {
            quarantineToggle.addEventListener('change', (e) => {
                this.params.quarantine = e.target.checked;
                if (e.target.checked) {
                    this.showToast('🏥 启用隔离措施：感染者将被隔离');
                }
            });
        }

        // 疫苗接种率
        const vaccineSlider = document.getElementById('vaccine-slider');
        if (vaccineSlider) {
            vaccineSlider.addEventListener('input', (e) => {
                this.params.vaccination = parseFloat(e.target.value);
                document.getElementById('vaccine-val').textContent = Math.round(this.params.vaccination * 100) + '%';
            });
            vaccineSlider.addEventListener('change', () => {
                this.initSimulation();
            });
        }

        // 人口数量
        const populationSlider = document.getElementById('population-slider');
        if (populationSlider) {
            populationSlider.addEventListener('input', (e) => {
                this.params.populationSize = parseInt(e.target.value);
                document.getElementById('pop-val').textContent = this.params.populationSize;
            });
            populationSlider.addEventListener('change', () => {
                this.initSimulation();
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
                this.initSimulation();
                this.isAutoPlaying = true;
                const playBtn = document.getElementById('btn-play');
                if (playBtn) {
                    playBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
                }
            });
        }
    }

    /**
     * 更新R0显示
     */
    updateR0Display() {
        const r0 = this.params.transmissionRate / this.params.recoveryRate;
        const r0Element = document.getElementById('r0-value');
        if (r0Element) {
            r0Element.textContent = r0.toFixed(1);
            // R0 > 1 时显示红色，< 1 时显示绿色
            r0Element.style.color = r0 > 1 ? '#ff6b6b' : '#4ecdc4';
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
            background: linear-gradient(135deg, rgba(78, 205, 196, 0.9), rgba(168, 85, 247, 0.9));
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
                    <h3 style="color: #ff6b6b; margin-bottom: 10px;">
                        <i class="fas fa-virus"></i> SIR传染病模型
                    </h3>
                    <p style="color: #aaa; font-size: 13px; line-height: 1.6;">
                        <strong style="color: #4ecdc4;">S</strong> - 易感者（可能被感染）<br>
                        <strong style="color: #ff6b6b;">I</strong> - 感染者（正在传播病毒）<br>
                        <strong style="color: #a855f7;">R</strong> - 康复者（已获得免疫）
                    </p>
                    <div style="margin: 15px 0; padding: 10px; background: rgba(255,107,107,0.1); border-radius: 8px;">
                        <p style="color: #ff6b6b; font-size: 12px;">
                            🦠 R₀ > 1: 疫情扩散<br>
                            ✅ R₀ < 1: 疫情消退<br>
                            📉 "拉平曲线" = 降低R₀
                        </p>
                    </div>
                    <p style="color: #888; font-size: 12px;">
                        💡 尝试启用防控措施，观察曲线变化！
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

        this.updateSimulation();

        // 感染者脉动效果
        this.particles.forEach((particle, index) => {
            if (particle.state === 'I') {
                const pulse = 1 + Math.sin(time * 0.005 + index) * 0.2;
                this.particleMeshes[index].scale.set(pulse, pulse, pulse);
            }
        });
    }

    /**
     * 鼠标移动处理
     */
    onMouseMove(event) {
        // 可扩展
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
        this.clearParticles();

        if (this.mainGroup) {
            this.mainGroup.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(m => m.dispose());
                    } else {
                        if (child.material.map) child.material.map.dispose();
                        child.material.dispose();
                    }
                }
            });
            this.scene.remove(this.mainGroup);
        }

        if (this.chartTexture) {
            this.chartTexture.dispose();
        }

        // 添加动画样式
        if (!document.querySelector('#sir-animations')) {
            const animStyle = document.createElement('style');
            animStyle.id = 'sir-animations';
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
