/**
 * 米格达尔效应 3D教学场景
 * ============================================
 * 2026年1月15日中国科学院首次直接证实的量子效应
 * 
 * 教学内容：
 * 1. 原子结构认知
 * 2. 中子入射与碰撞
 * 3. 原子核反冲
 * 4. 电场剧变与能量传递
 * 5. 米格达尔电子释放
 * 6. 共顶点轨迹形成
 * 
 * 目标学生：高中-大学
 * ============================================
 */

class MigdalScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.name = 'MigdalScene';
        this.mainGroup = null;
        
        // 原子模型
        this.atom = null;
        this.nucleus = null;
        this.electrons = [];
        this.electronOrbits = [];
        this.electricFieldLines = [];
        
        // 粒子
        this.incidentNeutron = null;
        this.recoilNucleus = null;
        this.migdalElectron = null;
        
        // 轨迹
        this.nucleusTrail = null;
        this.electronTrail = null;
        this.trailPoints = { nucleus: [], electron: [] };
        
        // 教学状态
        this.currentStep = 0;
        this.totalSteps = 8;
        this.isPlaying = false;
        this.isAutoPlaying = false;
        this.animationTime = 0;
        this.stepStartTime = 0;
        
        // 动画参数
        this.collisionOccurred = false;
        this.showFieldLines = true;
        this.comparisonMode = false;
        this.playbackSpeed = 1;
        
        // 颜色定义
        this.colors = {
            proton: 0xff4444,
            neutron: 0x4488ff,
            electron: 0x00ffff,
            electronOrbit: 0x00ffff,
            fieldLine: 0xffaa00,
            nucleusTrail: 0xff6600,
            electronTrail: 0x00ffff,
            collision: 0xffffff,
            energy: 0xffff00
        };
        
        // 步骤信息
        this.stepInfo = [
            {
                title: '认识原子',
                desc: '原子由原子核（质子+中子）和核外电子组成。电子被电磁力束缚在原子核周围。',
                icon: 'fa-atom'
            },
            {
                title: '入侵者来了',
                desc: '一个高能中子正从远处飞来，它将与原子发生碰撞。中子不带电，可以直接接近原子核。',
                icon: 'fa-meteor'
            },
            {
                title: '剧烈碰撞',
                desc: '中子撞击原子核！就像台球中母球撞击目标球。能量在瞬间传递。',
                icon: 'fa-burst'
            },
            {
                title: '原子核反冲',
                desc: '原子核被撞飞！它突然获得能量并高速运动。注意：电子还不知道发生了什么...',
                icon: 'fa-arrow-right'
            },
            {
                title: '电场剧变',
                desc: '🔑 关键！原子核突然运动，它产生的电场来不及"通知"电子。电场变化以光速传播，但核已经跑了！',
                icon: 'fa-bolt'
            },
            {
                title: '电子获能',
                desc: '电场的突然变化将能量传递给电子。这种"信息差"让电子获得了额外能量。这就是米格达尔效应的本质！',
                icon: 'fa-exchange-alt'
            },
            {
                title: '电子逃逸',
                desc: '米格达尔电子获得足够能量后脱离原子束缚，沿着与核反冲不同的方向飞出。',
                icon: 'fa-sign-out-alt'
            },
            {
                title: '共顶点轨迹',
                desc: '形成米格达尔效应的"签名"：两条从同一点出发的轨迹。粗短的是核反冲，细长的是电子。80年后终于被证实！',
                icon: 'fa-code-branch'
            }
        ];
    }

    init() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建环境
        this.createEnvironment();
        
        // 创建探测器轮廓
        this.createDetector();
        
        // 创建原子模型
        this.createAtom();
        
        // 创建电场线
        this.createElectricFieldLines();
        
        // 创建入射中子（初始隐藏）
        this.createIncidentNeutron();
        
        // 创建轨迹系统
        this.createTrailSystem();
        
        // 设置相机
        if (this.camera) {
            this.camera.position.set(0, 8, 20);
            this.camera.lookAt(0, 0, 0);
        }
        
        // 设置灯光
        this.setupLighting();
        
        // 创建UI
        this.setupUI();
        
        // 初始化第一步
        this.goToStep(0);
        
        console.log('MigdalScene initialized');
    }

    /**
     * 创建环境背景
     */
    createEnvironment() {
        // 星空背景
        const starCount = 800;
        const positions = new Float32Array(starCount * 3);
        
        for (let i = 0; i < starCount; i++) {
            const radius = 80 + Math.random() * 40;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.15,
            color: 0x8888aa,
            transparent: true,
            opacity: 0.6
        });
        
        const stars = new THREE.Points(geometry, material);
        this.scene.add(stars);
    }

    /**
     * 创建探测器轮廓
     */
    createDetector() {
        // 圆柱形探测器外壳
        const detectorGeometry = new THREE.CylinderGeometry(8, 8, 12, 32, 1, true);
        const detectorMaterial = new THREE.MeshBasicMaterial({
            color: 0x4488aa,
            transparent: true,
            opacity: 0.1,
            wireframe: true
        });
        const detector = new THREE.Mesh(detectorGeometry, detectorMaterial);
        detector.rotation.x = Math.PI / 2;
        this.mainGroup.add(detector);
        
        // 探测器底座
        const baseGeometry = new THREE.CylinderGeometry(3, 4, 2, 6);
        const baseMaterial = new THREE.MeshStandardMaterial({
            color: 0x334455,
            metalness: 0.8,
            roughness: 0.3
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -7;
        this.mainGroup.add(base);
        
        // 标签
        this.detectorLabel = this.createTextSprite('气体探测器', 0x88aacc);
        this.detectorLabel.position.set(0, 7, 0);
        this.mainGroup.add(this.detectorLabel);
    }

    /**
     * 创建原子模型
     */
    createAtom() {
        this.atom = new THREE.Group();
        
        // 原子核
        this.nucleus = new THREE.Group();
        
        // 核心球体
        const coreGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const coreMaterial = new THREE.MeshStandardMaterial({
            color: 0xffaa44,
            emissive: 0xffaa44,
            emissiveIntensity: 0.3,
            metalness: 0.3,
            roughness: 0.6
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        this.nucleus.add(core);
        
        // 质子和中子装饰
        const nucleonCount = 12;
        for (let i = 0; i < nucleonCount; i++) {
            const isProton = i % 2 === 0;
            const nucleonGeometry = new THREE.SphereGeometry(0.15, 12, 12);
            const nucleonMaterial = new THREE.MeshStandardMaterial({
                color: isProton ? this.colors.proton : this.colors.neutron,
                emissive: isProton ? this.colors.proton : this.colors.neutron,
                emissiveIntensity: 0.4
            });
            const nucleon = new THREE.Mesh(nucleonGeometry, nucleonMaterial);
            
            const phi = Math.random() * Math.PI * 2;
            const theta = Math.acos(2 * Math.random() - 1);
            const r = 0.75;
            
            nucleon.position.set(
                r * Math.sin(theta) * Math.cos(phi),
                r * Math.sin(theta) * Math.sin(phi),
                r * Math.cos(theta)
            );
            this.nucleus.add(nucleon);
        }
        
        // 核光晕
        const glowGeometry = new THREE.SphereGeometry(1.2, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffaa44,
            transparent: true,
            opacity: 0.15,
            side: THREE.BackSide
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.nucleus.add(glow);
        
        this.nucleus.userData = {
            name: '原子核',
            info: '<b>原子核</b><br>由质子（红色）和中子（蓝色）组成。<br>质子带正电，中子不带电。<br>核力将它们紧密束缚在一起。',
            hoverTitle: '原子核',
            hoverDesc: '质子+中子的紧密结合体',
            hoverIcon: 'fa-circle',
            isInteractive: true
        };
        
        this.atom.add(this.nucleus);
        
        // 电子轨道和电子
        const orbitRadii = [2.5, 4, 5.5];
        const electronCounts = [2, 4, 2];
        
        orbitRadii.forEach((radius, orbitIndex) => {
            // 轨道环
            const orbitGeometry = new THREE.TorusGeometry(radius, 0.02, 8, 64);
            const orbitMaterial = new THREE.MeshBasicMaterial({
                color: this.colors.electronOrbit,
                transparent: true,
                opacity: 0.3
            });
            const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
            orbit.rotation.x = Math.PI / 2 + (orbitIndex * 0.3);
            orbit.rotation.y = orbitIndex * 0.5;
            this.electronOrbits.push(orbit);
            this.atom.add(orbit);
            
            // 电子
            for (let i = 0; i < electronCounts[orbitIndex]; i++) {
                const electronGeometry = new THREE.SphereGeometry(0.12, 16, 16);
                const electronMaterial = new THREE.MeshStandardMaterial({
                    color: this.colors.electron,
                    emissive: this.colors.electron,
                    emissiveIntensity: 0.6
                });
                const electron = new THREE.Mesh(electronGeometry, electronMaterial);
                
                // 电子光晕
                const eGlowGeometry = new THREE.SphereGeometry(0.2, 16, 16);
                const eGlowMaterial = new THREE.MeshBasicMaterial({
                    color: this.colors.electron,
                    transparent: true,
                    opacity: 0.3
                });
                const eGlow = new THREE.Mesh(eGlowGeometry, eGlowMaterial);
                electron.add(eGlow);
                
                electron.userData = {
                    orbitRadius: radius,
                    orbitIndex: orbitIndex,
                    angleOffset: (i / electronCounts[orbitIndex]) * Math.PI * 2,
                    speed: 1 + orbitIndex * 0.3,
                    isMigdalCandidate: orbitIndex === 0 && i === 0, // 第一个电子可能被激发
                    name: '电子',
                    hoverTitle: '电子',
                    hoverDesc: '带负电的轻粒子',
                    isInteractive: true
                };
                
                this.electrons.push(electron);
                this.atom.add(electron);
            }
        });
        
        this.mainGroup.add(this.atom);
    }

    /**
     * 创建电场线
     */
    createElectricFieldLines() {
        const lineCount = 12;
        
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2;
            const points = [];
            
            // 从核心向外辐射的曲线
            for (let j = 0; j <= 20; j++) {
                const t = j / 20;
                const r = 0.8 + t * 5;
                points.push(new THREE.Vector3(
                    r * Math.cos(angle),
                    (Math.sin(t * Math.PI) - 0.5) * 0.5,
                    r * Math.sin(angle)
                ));
            }
            
            const curve = new THREE.CatmullRomCurve3(points);
            const geometry = new THREE.TubeGeometry(curve, 20, 0.02, 8, false);
            const material = new THREE.MeshBasicMaterial({
                color: this.colors.fieldLine,
                transparent: true,
                opacity: 0.4
            });
            
            const fieldLine = new THREE.Mesh(geometry, material);
            fieldLine.userData = {
                originalPoints: points.map(p => p.clone()),
                angle: angle
            };
            
            this.electricFieldLines.push(fieldLine);
            this.mainGroup.add(fieldLine);
        }
    }

    /**
     * 创建入射中子
     */
    createIncidentNeutron() {
        this.incidentNeutron = new THREE.Group();
        
        // 中子球体
        const geometry = new THREE.SphereGeometry(0.25, 16, 16);
        const material = new THREE.MeshStandardMaterial({
            color: this.colors.neutron,
            emissive: this.colors.neutron,
            emissiveIntensity: 0.6
        });
        const sphere = new THREE.Mesh(geometry, material);
        this.incidentNeutron.add(sphere);
        
        // 尾迹效果
        const trailGeometry = new THREE.ConeGeometry(0.15, 1.5, 8);
        const trailMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.neutron,
            transparent: true,
            opacity: 0.4
        });
        const trail = new THREE.Mesh(trailGeometry, trailMaterial);
        trail.rotation.x = -Math.PI / 2;
        trail.position.z = 1;
        this.incidentNeutron.add(trail);
        
        // 光晕
        const glowGeometry = new THREE.SphereGeometry(0.4, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.neutron,
            transparent: true,
            opacity: 0.2
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.incidentNeutron.add(glow);
        
        this.incidentNeutron.position.set(-15, 0, 0);
        this.incidentNeutron.visible = false;
        this.incidentNeutron.userData = {
            name: '入射中子',
            hoverTitle: '入射中子',
            hoverDesc: '高能中子，来自D-D聚变源',
            isInteractive: true
        };
        
        this.mainGroup.add(this.incidentNeutron);
    }

    /**
     * 创建轨迹系统
     */
    createTrailSystem() {
        // 核反冲轨迹
        const nucleusTrailGeometry = new THREE.BufferGeometry();
        const nucleusPositions = new Float32Array(300); // 100个点
        nucleusTrailGeometry.setAttribute('position', new THREE.BufferAttribute(nucleusPositions, 3));
        
        const nucleusTrailMaterial = new THREE.LineBasicMaterial({
            color: this.colors.nucleusTrail,
            transparent: true,
            opacity: 0.8,
            linewidth: 2
        });
        
        this.nucleusTrail = new THREE.Line(nucleusTrailGeometry, nucleusTrailMaterial);
        this.nucleusTrail.visible = false;
        this.mainGroup.add(this.nucleusTrail);
        
        // 电子轨迹
        const electronTrailGeometry = new THREE.BufferGeometry();
        const electronPositions = new Float32Array(300);
        electronTrailGeometry.setAttribute('position', new THREE.BufferAttribute(electronPositions, 3));
        
        const electronTrailMaterial = new THREE.LineBasicMaterial({
            color: this.colors.electronTrail,
            transparent: true,
            opacity: 0.8
        });
        
        this.electronTrail = new THREE.Line(electronTrailGeometry, electronTrailMaterial);
        this.electronTrail.visible = false;
        this.mainGroup.add(this.electronTrail);
    }

    /**
     * 创建文字精灵
     */
    createTextSprite(text, color = 0xffffff) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        context.fillStyle = 'transparent';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 24px Arial';
        context.fillStyle = '#' + color.toString(16).padStart(6, '0');
        context.textAlign = 'center';
        context.fillText(text, 128, 40);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture, 
            transparent: true 
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 1, 1);
        
        return sprite;
    }

    /**
     * 设置灯光
     */
    setupLighting() {
        const ambient = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambient);
        
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8);
        mainLight.position.set(10, 15, 10);
        this.scene.add(mainLight);
        
        // 点光源照亮原子
        const atomLight = new THREE.PointLight(0xffaa44, 0.5, 20);
        atomLight.position.set(0, 0, 0);
        this.mainGroup.add(atomLight);
        this.atomLight = atomLight;
    }

    /**
     * 设置UI控制
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;
        
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="migdal-controls">
                <div class="control-group step-controls">
                    <button class="step-btn" id="btn-prev-step" title="上一步">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <div class="step-indicators" id="step-indicators"></div>
                    <button class="step-btn" id="btn-next-step" title="下一步">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </div>
                
                <div class="control-group">
                    <button class="action-btn" id="btn-play-pause">
                        <i class="fas fa-play"></i> 播放
                    </button>
                    <button class="action-btn" id="btn-reset">
                        <i class="fas fa-undo"></i> 重置
                    </button>
                </div>
                
                <div class="control-group">
                    <button class="action-btn small" id="btn-speed-slow" title="0.5x">
                        <i class="fas fa-turtle"></i>
                    </button>
                    <button class="action-btn small active" id="btn-speed-normal" title="1x">
                        <i class="fas fa-running"></i>
                    </button>
                    <button class="action-btn small" id="btn-speed-fast" title="2x">
                        <i class="fas fa-rabbit"></i>
                    </button>
                </div>
                
                <div class="control-group">
                    <button class="action-btn toggle" id="btn-field-lines">
                        <i class="fas fa-project-diagram"></i> 电场线
                    </button>
                </div>
            </div>
        `;
        
        // 创建步骤指示器
        this.createStepIndicators();
        
        // 绑定事件
        this.bindUIEvents();
    }

    /**
     * 创建步骤指示器
     */
    createStepIndicators() {
        const container = document.getElementById('step-indicators');
        if (!container) return;
        
        let html = '';
        for (let i = 0; i < this.totalSteps; i++) {
            const info = this.stepInfo[i];
            html += `
                <div class="step-indicator ${i === 0 ? 'active' : ''}" 
                     data-step="${i}" 
                     title="${info.title}">
                    <i class="fas ${info.icon}"></i>
                </div>
            `;
        }
        container.innerHTML = html;
        
        // 绑定点击事件
        container.querySelectorAll('.step-indicator').forEach(el => {
            el.addEventListener('click', () => {
                this.goToStep(parseInt(el.dataset.step));
            });
        });
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        const self = this;
        
        // 上一步/下一步
        document.getElementById('btn-prev-step')?.addEventListener('click', () => {
            self.goToStep(Math.max(0, self.currentStep - 1));
        });
        
        document.getElementById('btn-next-step')?.addEventListener('click', () => {
            self.goToStep(Math.min(self.totalSteps - 1, self.currentStep + 1));
        });
        
        // 播放/暂停
        document.getElementById('btn-play-pause')?.addEventListener('click', function() {
            self.isPlaying = !self.isPlaying;
            this.innerHTML = self.isPlaying 
                ? '<i class="fas fa-pause"></i> 暂停'
                : '<i class="fas fa-play"></i> 播放';
        });
        
        // 重置
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            self.resetScene();
        });
        
        // 速度控制
        ['slow', 'normal', 'fast'].forEach((speed, i) => {
            document.getElementById(`btn-speed-${speed}`)?.addEventListener('click', function() {
                document.querySelectorAll('.migdal-controls .action-btn.small').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                self.playbackSpeed = [0.5, 1, 2][i];
            });
        });
        
        // 电场线开关
        document.getElementById('btn-field-lines')?.addEventListener('click', function() {
            self.showFieldLines = !self.showFieldLines;
            this.classList.toggle('active', self.showFieldLines);
            self.electricFieldLines.forEach(line => {
                line.visible = self.showFieldLines;
            });
        });
    }

    /**
     * 跳转到指定步骤
     */
    goToStep(step) {
        this.currentStep = step;
        this.stepStartTime = this.animationTime;
        
        // 更新指示器
        document.querySelectorAll('.step-indicator').forEach((el, i) => {
            el.classList.toggle('active', i === step);
            el.classList.toggle('completed', i < step);
        });
        
        // 显示步骤信息
        this.showStepInfo(step);
        
        // 执行步骤特定设置
        this.setupStep(step);
    }

    /**
     * 显示步骤信息
     */
    showStepInfo(step) {
        const info = this.stepInfo[step];
        
        // 使用信息面板显示
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            const titleEl = infoPanel.querySelector('.info-title');
            const contentEl = infoPanel.querySelector('.info-content');
            
            if (titleEl) titleEl.innerHTML = `<i class="fas ${info.icon}"></i> 步骤${step + 1}: ${info.title}`;
            if (contentEl) contentEl.innerHTML = `<p>${info.desc}</p>`;
            
            infoPanel.classList.add('visible');
        }
    }

    /**
     * 设置步骤状态
     */
    setupStep(step) {
        // 重置可见性
        this.incidentNeutron.visible = step >= 1;
        this.nucleusTrail.visible = step >= 7;
        this.electronTrail.visible = step >= 7;
        
        // 根据步骤设置
        switch(step) {
            case 0: // 认识原子
                this.resetAtomPosition();
                this.incidentNeutron.position.set(-15, 0, 0);
                this.collisionOccurred = false;
                break;
                
            case 1: // 入侵者来了
                this.incidentNeutron.position.set(-12, 0, 0);
                break;
                
            case 2: // 剧烈碰撞
                this.incidentNeutron.position.set(-2, 0, 0);
                break;
                
            case 3: // 原子核反冲
                this.collisionOccurred = true;
                break;
                
            case 4: // 电场剧变
                // 电场线动画将在animate中处理
                break;
                
            case 5: // 电子获能
                break;
                
            case 6: // 电子逃逸
                break;
                
            case 7: // 共顶点轨迹
                this.showTrails();
                break;
        }
    }

    /**
     * 重置原子位置
     */
    resetAtomPosition() {
        if (this.nucleus) {
            this.nucleus.position.set(0, 0, 0);
        }
        this.electrons.forEach(e => {
            e.visible = true;
        });
    }

    /**
     * 显示轨迹
     */
    showTrails() {
        this.nucleusTrail.visible = true;
        this.electronTrail.visible = true;
        
        // 生成轨迹点
        this.generateTrailPoints();
    }

    /**
     * 生成轨迹点
     */
    generateTrailPoints() {
        // 核反冲轨迹（粗短，向右上）
        const nucleusPoints = [];
        for (let i = 0; i <= 30; i++) {
            const t = i / 30;
            nucleusPoints.push(new THREE.Vector3(
                t * 6,
                t * 2 + Math.sin(t * 3) * 0.2,
                t * 1
            ));
        }
        
        // 电子轨迹（细长，向右下）
        const electronPoints = [];
        for (let i = 0; i <= 50; i++) {
            const t = i / 50;
            electronPoints.push(new THREE.Vector3(
                t * 4,
                -t * 5 + Math.sin(t * 5) * 0.3,
                t * 2
            ));
        }
        
        // 更新轨迹几何
        this.updateTrailGeometry(this.nucleusTrail, nucleusPoints);
        this.updateTrailGeometry(this.electronTrail, electronPoints);
    }

    /**
     * 更新轨迹几何
     */
    updateTrailGeometry(trail, points) {
        const positions = trail.geometry.attributes.position.array;
        
        for (let i = 0; i < points.length && i < 100; i++) {
            positions[i * 3] = points[i].x;
            positions[i * 3 + 1] = points[i].y;
            positions[i * 3 + 2] = points[i].z;
        }
        
        trail.geometry.attributes.position.needsUpdate = true;
        trail.geometry.setDrawRange(0, points.length);
    }

    /**
     * 重置场景
     */
    resetScene() {
        this.currentStep = 0;
        this.collisionOccurred = false;
        this.isPlaying = false;
        this.animationTime = 0;
        
        this.resetAtomPosition();
        this.incidentNeutron.position.set(-15, 0, 0);
        this.incidentNeutron.visible = false;
        this.nucleusTrail.visible = false;
        this.electronTrail.visible = false;
        
        // 重置电场线
        this.electricFieldLines.forEach(line => {
            line.visible = this.showFieldLines;
        });
        
        // 更新UI
        document.getElementById('btn-play-pause').innerHTML = '<i class="fas fa-play"></i> 播放';
        
        this.goToStep(0);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        this.animationTime = time;
        const adjustedDelta = delta * this.playbackSpeed;
        
        // 电子轨道运动（始终运行）
        this.electrons.forEach((electron, i) => {
            if (!electron.visible) return;
            
            const data = electron.userData;
            const angle = time * data.speed + data.angleOffset;
            const r = data.orbitRadius;
            
            // 根据轨道倾斜计算位置
            const tiltX = data.orbitIndex * 0.3;
            const tiltY = data.orbitIndex * 0.5;
            
            electron.position.x = r * Math.cos(angle);
            electron.position.y = r * Math.sin(angle) * Math.cos(tiltX);
            electron.position.z = r * Math.sin(angle) * Math.sin(tiltX);
        });
        
        // 原子核脉动
        if (this.nucleus) {
            const pulse = 1 + Math.sin(time * 3) * 0.05;
            this.nucleus.scale.setScalar(pulse);
        }
        
        if (!this.isPlaying) return;
        
        // 根据当前步骤执行动画
        this.animateCurrentStep(time, adjustedDelta);
    }

    /**
     * 当前步骤动画
     */
    animateCurrentStep(time, delta) {
        const stepTime = time - this.stepStartTime;
        
        switch(this.currentStep) {
            case 1: // 中子飞行
                this.animateNeutronFlight(stepTime, delta);
                break;
                
            case 2: // 碰撞
                this.animateCollision(stepTime, delta);
                break;
                
            case 3: // 核反冲
            case 4: // 电场剧变
                this.animateRecoil(stepTime, delta);
                this.animateFieldDistortion(stepTime);
                break;
                
            case 5: // 电子获能
            case 6: // 电子逃逸
                this.animateMigdalElectron(stepTime, delta);
                break;
                
            case 7: // 轨迹
                this.animateTrails(stepTime);
                break;
        }
        
        // 自动进入下一步
        if (stepTime > 3 && this.currentStep < this.totalSteps - 1) {
            this.goToStep(this.currentStep + 1);
        }
    }

    /**
     * 中子飞行动画
     */
    animateNeutronFlight(stepTime, delta) {
        if (this.incidentNeutron.position.x < -1) {
            this.incidentNeutron.position.x += delta * 4;
        }
    }

    /**
     * 碰撞动画
     */
    animateCollision(stepTime, delta) {
        // 创建碰撞闪光效果
        if (stepTime < 0.5) {
            if (this.atomLight) {
                this.atomLight.intensity = 2 - stepTime * 3;
            }
        }
    }

    /**
     * 反冲动画
     */
    animateRecoil(stepTime, delta) {
        if (this.collisionOccurred && this.nucleus) {
            const recoilDistance = Math.min(stepTime * 2, 4);
            this.nucleus.position.x = recoilDistance;
            this.nucleus.position.y = recoilDistance * 0.3;
        }
    }

    /**
     * 电场扭曲动画
     */
    animateFieldDistortion(stepTime) {
        this.electricFieldLines.forEach((line, i) => {
            if (!line.visible) return;
            
            // 电场线向核运动方向扭曲
            const distortion = Math.min(stepTime * 0.5, 1);
            const material = line.material;
            material.opacity = 0.4 + Math.sin(stepTime * 5 + i) * 0.2;
        });
    }

    /**
     * 米格达尔电子动画
     */
    animateMigdalElectron(stepTime, delta) {
        // 找到要激发的电子
        const migdalElectron = this.electrons.find(e => e.userData.isMigdalCandidate);
        if (migdalElectron && stepTime > 0.5) {
            // 电子飞出
            migdalElectron.position.x = (stepTime - 0.5) * 2;
            migdalElectron.position.y = -(stepTime - 0.5) * 3;
            migdalElectron.position.z = (stepTime - 0.5) * 1;
            
            // 增强发光
            if (migdalElectron.children[0]) {
                migdalElectron.children[0].material.opacity = 0.6;
            }
        }
    }

    /**
     * 轨迹动画
     */
    animateTrails(stepTime) {
        // 轨迹渐显效果
        const progress = Math.min(stepTime / 2, 1);
        
        if (this.nucleusTrail.geometry) {
            this.nucleusTrail.geometry.setDrawRange(0, Math.floor(30 * progress));
        }
        if (this.electronTrail.geometry) {
            this.electronTrail.geometry.setDrawRange(0, Math.floor(50 * progress));
        }
    }

    /**
     * 开始自动播放
     */
    startAutoPlay() {
        this.isAutoPlaying = true;
        
        setTimeout(() => {
            this.showGuide('⚛️ 米格达尔效应：80年后首次被直接证实的量子现象');
        }, 500);
        
        setTimeout(() => {
            if (this.isAutoPlaying) {
                this.isPlaying = true;
                document.getElementById('btn-play-pause').innerHTML = '<i class="fas fa-pause"></i> 暂停';
            }
        }, 2000);
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
     * 获取可交互对象
     */
    getInteractables() {
        return [this.nucleus, this.incidentNeutron, ...this.electrons].filter(o => o && o.userData.isInteractive);
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
window.MigdalScene = MigdalScene;
