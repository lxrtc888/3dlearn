/**
 * 核裂变链式反应 3D教学场景
 * ============================================
 * 教学内容：
 * 1. 铀-235原子核结构
 * 2. 中子撞击与核分裂
 * 3. 链式反应的指数增长
 * 4. 临界质量概念
 * 5. 能量释放（E=mc²）
 * 
 * 目标学生：初中-高中
 * ============================================
 */

class NuclearFissionScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'NuclearFissionScene';
        this.mainGroup = null;
        
        // 原子核集合
        this.nuclei = [];
        this.neutrons = [];
        this.fragments = [];
        this.energyBursts = [];
        
        // 动画状态
        this.isPlaying = false;
        this.isAutoPlaying = false;
        this.animationTime = 0;
        this.reactionGeneration = 0;
        this.maxGenerations = 5;
        
        // 物理参数
        this.neutronSpeed = 8;
        this.splitDelay = 0.3;
        
        // 统计
        this.stats = {
            totalFissions: 0,
            totalNeutrons: 0,
            energyReleased: 0
        };
        
        // 颜色定义
        this.colors = {
            proton: 0xff4444,      // 红色 - 质子
            neutron: 0x4488ff,     // 蓝色 - 中子
            uranium: 0xffd700,     // 金色 - 铀核
            fragment1: 0x44ff88,   // 绿色 - 裂变产物1（钡）
            fragment2: 0xff8844,   // 橙色 - 裂变产物2（氪）
            energy: 0xffff00,      // 黄色 - 能量
            glow: 0x00ffff         // 青色 - 辉光
        };
    }

    init() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建环境
        this.createEnvironment();
        
        // 创建初始铀原子核阵列
        this.createUraniumArray();
        
        // 创建入射中子
        this.createInitialNeutron();
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(0, 20, 35);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 设置灯光
        this.setupLighting();
        
        // 创建UI
        this.setupUI();
        
        console.log('NuclearFissionScene initialized');
    }

    /**
     * 创建环境背景
     */
    createEnvironment() {
        // 深色背景粒子
        const particleCount = 500;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.2,
            color: 0x666688,
            transparent: true,
            opacity: 0.5
        });
        
        const particles = new THREE.Points(geometry, material);
        this.scene.add(particles);
        
        // 网格地面
        const gridHelper = new THREE.GridHelper(50, 20, 0x333355, 0x222244);
        gridHelper.position.y = -10;
        this.scene.add(gridHelper);
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        // 环境光
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);
        
        // 主光源
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);
        
        // 点光源 - 用于照亮核反应区域
        const pointLight = new THREE.PointLight(0xffd700, 0.5, 50);
        pointLight.position.set(0, 5, 0);
        this.scene.add(pointLight);
        this.coreLight = pointLight;
    }

    /**
     * 创建铀原子核阵列
     */
    createUraniumArray() {
        const spacing = 6;
        const rows = 3;
        const cols = 3;
        
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const x = (j - (cols - 1) / 2) * spacing;
                const z = (i - (rows - 1) / 2) * spacing;
                
                // 随机Y偏移
                const y = (Math.random() - 0.5) * 2;
                
                this.createUraniumNucleus(new THREE.Vector3(x, y, z));
            }
        }
    }

    /**
     * 创建单个铀-235原子核
     */
    createUraniumNucleus(position) {
        const nucleus = new THREE.Group();
        nucleus.userData = {
            type: 'uranium235',
            name: '铀-235原子核',
            protons: 92,
            neutrons: 143,
            isFissile: true,
            hasReacted: false,
            info: `<b>铀-235 (²³⁵U)</b><br>
                质子数：92<br>
                中子数：143<br>
                <br>
                铀-235是一种<b>可裂变同位素</b>，当被慢中子击中时，
                会分裂成两个较小的原子核（如钡和氪），
                同时释放2-3个高能中子和大量能量。<br>
                <br>
                这些新中子可以继续引发其他铀原子核分裂，
                形成<b>链式反应</b>。`,
            hoverTitle: '铀-235原子核',
            hoverDesc: '点击查看详情',
            hoverIcon: 'fa-atom',
            isInteractive: true
        };
        
        // 核心球体（简化模型）
        const coreGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: this.colors.uranium,
            emissive: this.colors.uranium,
            emissiveIntensity: 0.2,
            metalness: 0.3,
            roughness: 0.7
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        nucleus.add(core);
        
        // 添加质子和中子表面装饰
        const nucleonCount = 20; // 简化显示
        for (let i = 0; i < nucleonCount; i++) {
            const isProton = Math.random() > 0.5;
            const nucleonGeometry = new THREE.SphereGeometry(0.2, 16, 16);
            const nucleonMaterial = new THREE.MeshStandardMaterial({
                color: isProton ? this.colors.proton : this.colors.neutron,
                emissive: isProton ? this.colors.proton : this.colors.neutron,
                emissiveIntensity: 0.3
            });
            const nucleon = new THREE.Mesh(nucleonGeometry, nucleonMaterial);
            
            // 在球面上随机分布
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);
            const r = 1.5;
            
            nucleon.position.set(
                r * Math.sin(theta) * Math.cos(phi),
                r * Math.sin(theta) * Math.sin(phi),
                r * Math.cos(theta)
            );
            nucleus.add(nucleon);
        }
        
        // 外层辉光
        const glowGeometry = new THREE.SphereGeometry(2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.uranium,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        nucleus.add(glow);
        nucleus.userData.glow = glow;
        
        nucleus.position.copy(position);
        this.mainGroup.add(nucleus);
        this.nuclei.push(nucleus);
        
        return nucleus;
    }

    /**
     * 创建初始入射中子
     */
    createInitialNeutron() {
        const startPos = new THREE.Vector3(-20, 0, 0);
        const targetNucleus = this.nuclei[4]; // 中心原子核
        const direction = targetNucleus.position.clone().sub(startPos).normalize();
        
        this.initialNeutron = this.createNeutron(startPos, direction);
        this.initialNeutron.userData.isInitial = true;
    }

    /**
     * 创建中子
     */
    createNeutron(position, direction) {
        const neutron = new THREE.Group();
        
        // 中子球体
        const geometry = new THREE.SphereGeometry(0.25, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.colors.neutron,
            emissive: this.colors.neutron,
            emissiveIntensity: 0.5
        });
        const sphere = new THREE.Mesh(geometry, material);
        neutron.add(sphere);
        
        // 运动尾迹
        const trailGeometry = new THREE.ConeGeometry(0.15, 1, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.neutron,
            transparent: true,
            opacity: 0.3
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = Math.PI / 2;
        trail.position.z = 0.6;
        neutron.add(trail);
        
        neutron.position.copy(position);
        neutron.userData = {
            type: 'neutron',
            direction: direction.clone(),
            speed: this.neutronSpeed,
            isActive: true,
            hoverTitle: '中子',
            hoverDesc: '高能中子，可引发核裂变'
        };
        
        // 使中子朝向运动方向
        neutron.lookAt(position.clone().add(direction));
        
        this.mainGroup.add(neutron);
        this.neutrons.push(neutron);
        this.stats.totalNeutrons++;
        
        return neutron;
    }

    /**
     * 核裂变事件
     */
    triggerFission(nucleus, neutron) {
        if (nucleus.userData.hasReacted) return;
        
        nucleus.userData.hasReacted = true;
        this.stats.totalFissions++;
        
        const position = nucleus.position.clone();
        
        // 隐藏原始原子核
        nucleus.visible = false;
        
        // 移除击中的中子
        if (neutron) {
            neutron.userData.isActive = false;
            neutron.visible = false;
        }
        
        // 创建能量爆发效果
        this.createEnergyBurst(position);
        
        // 创建裂变产物
        setTimeout(() => {
            this.createFissionFragments(position);
        }, 100);
        
        // 释放新中子（2-3个）
        const newNeutronCount = 2 + Math.floor(Math.random() * 2);
        setTimeout(() => {
            for (let i = 0; i < newNeutronCount; i++) {
                const angle = (i / newNeutronCount) * Math.PI * 2 + Math.random() * 0.5;
                const direction = new THREE.Vector3(
                    Math.cos(angle),
                    (Math.random() - 0.5) * 0.5,
                    Math.sin(angle)
                ).normalize();
                
                this.createNeutron(position.clone(), direction);
            }
        }, 200);
        
        // 更新能量统计
        this.stats.energyReleased += 200; // MeV
        this.updateStatsDisplay();
        
        // 增强核心光源
        if (this.coreLight) {
            this.coreLight.intensity = Math.min(2, this.coreLight.intensity + 0.3);
        }
    }

    /**
     * 创建能量爆发效果
     */
    createEnergyBurst(position) {
        const burst = new THREE.Group();
        
        // 中心光球
        const coreGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        const coreMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        burst.add(core);
        
        // 光环
        const ringGeometry = new THREE.RingGeometry(0.5, 2, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.energy,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        burst.add(ring);
        
        // 射线
        for (let i = 0; i < 8; i++) {
            const rayGeometry = new THREE.CylinderGeometry(0.05, 0.02, 3, 8);
            const rayMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.energy,
                transparent: true,
                opacity: 0.6
            });
            const ray = new THREE.Mesh(rayGeometry, rayMaterial);
            ray.rotation.z = (i / 8) * Math.PI * 2;
            ray.position.x = Math.cos((i / 8) * Math.PI * 2) * 1.5;
            ray.position.z = Math.sin((i / 8) * Math.PI * 2) * 1.5;
            burst.add(ray);
        }
        
        burst.position.copy(position);
        burst.userData = {
            createdAt: this.animationTime,
            duration: 0.8
        };
        
        this.mainGroup.add(burst);
        this.energyBursts.push(burst);
    }

    /**
     * 创建裂变碎片
     */
    createFissionFragments(position) {
        // 裂变产物1 - 钡-141
        const fragment1 = this.createFragment(
            position.clone().add(new THREE.Vector3(1, 0.5, 0)),
            this.colors.fragment1,
            '钡-141',
            new THREE.Vector3(1, 0.2, 0.3).normalize()
        );
        
        // 裂变产物2 - 氪-92
        const fragment2 = this.createFragment(
            position.clone().add(new THREE.Vector3(-1, -0.5, 0)),
            this.colors.fragment2,
            '氪-92',
            new THREE.Vector3(-1, -0.2, -0.3).normalize()
        );
        
        this.fragments.push(fragment1, fragment2);
    }

    /**
     * 创建单个裂变碎片
     */
    createFragment(position, color, name, direction) {
        const fragment = new THREE.Group();
        
        // 碎片球体
        const geometry = new THREE.SphereGeometry(0.8, 24, 24);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.4,
            metalness: 0.2,
            roughness: 0.6
        });
        const sphere = new THREE.Mesh(geometry, material);
        fragment.add(sphere);
        
        // 辉光
        const glowGeometry = new THREE.SphereGeometry(1.1, 24, 24);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        fragment.add(glow);
        
        fragment.position.copy(position);
        fragment.userData = {
            name: name,
            direction: direction,
            speed: 3,
            createdAt: this.animationTime
        };
        
        this.mainGroup.add(fragment);
        return fragment;
    }

    /**
     * 设置UI控制
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="fission-controls">
                <div class="control-group">
                    <button class="action-btn" id="btn-start-fission">
                        <i class="fas fa-play"></i> 开始反应
                    </button>
                    <button class="action-btn" id="btn-pause-fission">
                        <i class="fas fa-pause"></i> 暂停
                    </button>
                    <button class="action-btn" id="btn-reset-fission">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
                <div class="control-group stats-group">
                    <div class="stat-item">
                        <i class="fas fa-atom"></i>
                        <span>裂变次数: <b id="stat-fissions">0</b></span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-circle"></i>
                        <span>中子数: <b id="stat-neutrons">1</b></span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-bolt"></i>
                        <span>能量: <b id="stat-energy">0</b> MeV</span>
                    </div>
                </div>
            </div>
        `;
        
        // 绑定事件
        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        const self = this;
        
        const startBtn = document.getElementById('btn-start-fission');
        if (startBtn) {
            startBtn.addEventListener('click', () => {
                self.startReaction();
            });
        }
        
        const pauseBtn = document.getElementById('btn-pause-fission');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => {
                self.isPlaying = !self.isPlaying;
                pauseBtn.innerHTML = self.isPlaying 
                    ? '<i class="fas fa-pause"></i> 暂停'
                    : '<i class="fas fa-play"></i> 继续';
            });
        }
        
        const resetBtn = document.getElementById('btn-reset-fission');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                self.resetScene();
            });
        }
    }

    /**
     * 开始链式反应
     */
    startReaction() {
        this.isPlaying = true;
        
        // 发射初始中子
        if (this.initialNeutron) {
            this.initialNeutron.userData.isActive = true;
        }
        
        // 显示引导
        this.showGuide('⚛️ 中子正在飞向铀-235原子核...');
    }

    /**
     * 重置场景
     */
    resetScene() {
        // 清除所有动态对象
        [...this.neutrons, ...this.fragments, ...this.energyBursts].forEach(obj => {
            if (obj.parent) obj.parent.remove(obj);
        });
        this.neutrons = [];
        this.fragments = [];
        this.energyBursts = [];
        
        // 重置原子核
        this.nuclei.forEach(n => {
            n.visible = true;
            n.userData.hasReacted = false;
        });
        
        // 重置统计
        this.stats = { totalFissions: 0, totalNeutrons: 0, energyReleased: 0 };
        this.updateStatsDisplay();
        
        // 重置光源
        if (this.coreLight) this.coreLight.intensity = 0.5;
        
        // 重新创建初始中子
        this.createInitialNeutron();
        
        this.isPlaying = false;
        this.animationTime = 0;
    }

    /**
     * 更新统计显示
     */
    updateStatsDisplay() {
        const fissionsEl = document.getElementById('stat-fissions');
        const neutronsEl = document.getElementById('stat-neutrons');
        const energyEl = document.getElementById('stat-energy');
        
        if (fissionsEl) fissionsEl.textContent = this.stats.totalFissions;
        if (neutronsEl) neutronsEl.textContent = this.neutrons.filter(n => n.userData.isActive).length;
        if (energyEl) energyEl.textContent = this.stats.energyReleased;
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
        }, 3000);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        this.animationTime = time;
        
        // 原子核脉动效果
        this.nuclei.forEach((nucleus, i) => {
            if (!nucleus.userData.hasReacted && nucleus.userData.glow) {
                const pulse = 1 + Math.sin(time * 2 + i) * 0.1;
                nucleus.userData.glow.scale.setScalar(pulse);
            }
        });
        
        if (!this.isPlaying) return;
        
        // 更新中子运动
        this.updateNeutrons(delta);
        
        // 更新裂变碎片
        this.updateFragments(delta);
        
        // 更新能量爆发效果
        this.updateEnergyBursts(delta);
        
        // 检测碰撞
        this.checkCollisions();
        
        // 更新统计
        this.updateStatsDisplay();
    }

    /**
     * 更新中子运动
     */
    updateNeutrons(delta) {
        this.neutrons.forEach(neutron => {
            if (!neutron.userData.isActive) return;
            
            const direction = neutron.userData.direction;
            const speed = neutron.userData.speed;
            
            neutron.position.add(direction.clone().multiplyScalar(speed * delta));
            
            // 边界检查
            if (neutron.position.length() > 30) {
                neutron.userData.isActive = false;
                neutron.visible = false;
            }
        });
    }

    /**
     * 更新裂变碎片
     */
    updateFragments(delta) {
        this.fragments.forEach(fragment => {
            const dir = fragment.userData.direction;
            const speed = fragment.userData.speed;
            
            fragment.position.add(dir.clone().multiplyScalar(speed * delta));
            
            // 减速
            fragment.userData.speed *= 0.98;
            
            // 旋转
            fragment.rotation.x += delta * 2;
            fragment.rotation.y += delta * 1.5;
        });
    }

    /**
     * 更新能量爆发效果
     */
    updateEnergyBursts(delta) {
        for (let i = this.energyBursts.length - 1; i >= 0; i--) {
            const burst = this.energyBursts[i];
            const age = this.animationTime - burst.userData.createdAt;
            const progress = age / burst.userData.duration;
            
            if (progress >= 1) {
                this.mainGroup.remove(burst);
                this.energyBursts.splice(i, 1);
                continue;
            }
            
            // 扩大和淡出
            const scale = 1 + progress * 3;
            burst.scale.setScalar(scale);
            burst.children.forEach(child => {
                if (child.material) {
                    child.material.opacity = (1 - progress) * 0.8;
                }
            });
        }
    }

    /**
     * 碰撞检测
     */
    checkCollisions() {
        this.neutrons.forEach(neutron => {
            if (!neutron.userData.isActive) return;
            
            this.nuclei.forEach(nucleus => {
                if (nucleus.userData.hasReacted) return;
                
                const distance = neutron.position.distanceTo(nucleus.position);
                if (distance < 2) {
                    this.triggerFission(nucleus, neutron);
                }
            });
        });
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        this.isAutoPlaying = true;
        setTimeout(() => {
            this.showGuide('⚛️ 核裂变链式反应：观察中子如何引发连锁反应');
        }, 500);
        
        // 自动开始反应
        setTimeout(() => {
            if (this.isAutoPlaying) {
                this.startReaction();
            }
        }, 2000);
    }

    /**
     * 获取可交互对象
     */
    getInteractables() {
        return this.nuclei.filter(n => n.userData.isInteractive);
    }

    /**
     * 清理
     */
    dispose() {
        this.isPlaying = false;
        this.isAutoPlaying = false;
    }
}

// 注册到全局
window.NuclearFissionScene = NuclearFissionScene;
