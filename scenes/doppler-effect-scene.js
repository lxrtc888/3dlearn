/**
 * 多普勒效应场景 - Doppler Effect Visualization
 * ============================================
 * 核心原理：
 * - 波源移动时，前方波被压缩（频率升高），后方波被拉伸（频率降低）
 * - 公式：f' = f × (v ± v_observer) / (v ∓ v_source)
 * - 应用：雷达测速、医学超声、天文红移/蓝移
 * ============================================
 */
window.DopplerEffectScene = class DopplerEffectScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.ambulance = null;           // 救护车
        this.road = null;                // 公路
        this.observer = null;            // 观察者
        this.waveRings = [];             // 波纹圈
        this.frequencyIndicator = null;  // 频率指示器

        // 场景参数
        this.params = {
            ambulanceSpeed: 0.08,        // 救护车速度
            waveSpeed: 0.2,              // 波传播速度
            waveFrequency: 0.5,          // 发射波的频率(秒)
            isMoving: true,              // 是否在移动
            direction: 1,                // 方向 1=右 -1=左
            observerPosition: 'side',    // 观察者位置: side/front/back
            showStaticComparison: false, // 是否显示静止声源对比
            maxWaves: 30                 // 最大波纹数
        };

        // 动画状态
        this.animationPhase = 0;
        this.lastWaveTime = 0;
        this.ambulanceX = -15;

        // 静态声源对比
        this.staticSource = null;
        this.staticWaveRings = [];

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 25, z: 35 };
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

        // 背景 - 天空渐变色
        this.scene.background = new THREE.Color(0x87CEEB);
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.008);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambient);

        // 太阳光
        const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
        sunLight.position.set(20, 30, 10);
        sunLight.castShadow = true;
        this.scene.add(sunLight);

        // 半球光（天空/地面）
        const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x3d5c3d, 0.4);
        this.scene.add(hemiLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建地面
        this.createGround();

        // 创建公路
        this.createRoad();

        // 创建救护车
        this.createAmbulance();

        // 创建观察者
        this.createObserver();

        // 创建频率指示器
        this.createFrequencyIndicator();

        // 创建说明文字
        this.createLabels();
    }

    /**
     * 创建地面
     */
    createGround() {
        // 草地
        const groundGeo = new THREE.PlaneGeometry(100, 100);
        const groundMat = new THREE.MeshStandardMaterial({
            color: 0x4a7c4e,
            roughness: 0.9
        });
        const ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.1;
        ground.receiveShadow = true;
        this.mainGroup.add(ground);
    }

    /**
     * 创建公路
     */
    createRoad() {
        // 主公路
        const roadGeo = new THREE.PlaneGeometry(60, 8);
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x333333,
            roughness: 0.8
        });
        this.road = new THREE.Mesh(roadGeo, roadMat);
        this.road.rotation.x = -Math.PI / 2;
        this.road.position.y = 0.01;
        this.mainGroup.add(this.road);

        // 道路中线
        const lineGeo = new THREE.PlaneGeometry(55, 0.3);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const centerLine = new THREE.Mesh(lineGeo, lineMat);
        centerLine.rotation.x = -Math.PI / 2;
        centerLine.position.y = 0.02;
        this.mainGroup.add(centerLine);

        // 虚线
        for (let i = -25; i < 25; i += 3) {
            const dashGeo = new THREE.PlaneGeometry(1.5, 0.2);
            const dash = new THREE.Mesh(dashGeo, lineMat);
            dash.rotation.x = -Math.PI / 2;
            dash.position.set(i, 0.02, -1.5);
            this.mainGroup.add(dash);
            
            const dash2 = dash.clone();
            dash2.position.set(i, 0.02, 1.5);
            this.mainGroup.add(dash2);
        }
    }

    /**
     * 创建救护车
     */
    createAmbulance() {
        this.ambulance = new THREE.Group();

        // 车身
        const bodyGeo = new THREE.BoxGeometry(4, 2, 2);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.5;
        this.ambulance.add(body);

        // 车头
        const headGeo = new THREE.BoxGeometry(1.5, 1.5, 2);
        const head = new THREE.Mesh(headGeo, bodyMat);
        head.position.set(2.5, 1.25, 0);
        this.ambulance.add(head);

        // 红色十字
        const crossMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.2, 0.1), crossMat);
        crossV.position.set(0, 1.5, 1.01);
        this.ambulance.add(crossV);
        
        const crossH = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.3, 0.1), crossMat);
        crossH.position.set(0, 1.5, 1.01);
        this.ambulance.add(crossH);

        // 警灯
        const lightGeo = new THREE.BoxGeometry(0.8, 0.3, 0.6);
        const redLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
        redLight.position.set(-0.5, 2.65, 0);
        this.ambulance.add(redLight);
        this.redLight = redLight;

        const blueLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({ color: 0x0066ff }));
        blueLight.position.set(0.5, 2.65, 0);
        this.ambulance.add(blueLight);
        this.blueLight = blueLight;

        // 轮子
        const wheelGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
        const wheelMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
        
        const positions = [
            [1.2, 0.5, 1.15], [1.2, 0.5, -1.15],
            [-1.2, 0.5, 1.15], [-1.2, 0.5, -1.15]
        ];
        
        positions.forEach(pos => {
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.rotation.x = Math.PI / 2;
            wheel.position.set(...pos);
            this.ambulance.add(wheel);
        });

        // 声波发射点（扬声器位置）
        const speakerGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const speakerMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        const speaker = new THREE.Mesh(speakerGeo, speakerMat);
        speaker.position.set(0, 2.65, 0);
        this.ambulance.add(speaker);
        this.speaker = speaker;

        this.ambulance.position.set(this.ambulanceX, 0, 0);
        this.mainGroup.add(this.ambulance);

        // 添加交互
        this.interactables.push({
            object: body,
            info: {
                title: '救护车（声源）',
                content: `
                    <p>🚑 <strong>移动的声源</strong></p>
                    <p>救护车上的警笛不断发出固定频率的声波。</p>
                    <br>
                    <p>📢 当救护车<span class="text-blue-400">靠近</span>你时：</p>
                    <p>• 波被压缩 → 频率升高 → 声音变尖</p>
                    <br>
                    <p>📢 当救护车<span class="text-red-400">远离</span>你时：</p>
                    <p>• 波被拉伸 → 频率降低 → 声音变低</p>
                `
            }
        });
    }

    /**
     * 创建观察者
     */
    createObserver() {
        this.observer = new THREE.Group();

        // 身体
        const bodyGeo = new THREE.CylinderGeometry(0.3, 0.4, 1.5, 8);
        const bodyMat = new THREE.MeshStandardMaterial({ color: 0x3366cc });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.75;
        this.observer.add(body);

        // 头
        const headGeo = new THREE.SphereGeometry(0.35, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xffcc99 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 1.75;
        this.observer.add(head);

        // 耳朵（突出显示）
        const earGeo = new THREE.SphereGeometry(0.15, 8, 8);
        const earMat = new THREE.MeshBasicMaterial({ color: 0xff6600 });
        const leftEar = new THREE.Mesh(earGeo, earMat);
        leftEar.position.set(-0.4, 1.75, 0);
        this.observer.add(leftEar);
        this.leftEar = leftEar;

        const rightEar = new THREE.Mesh(earGeo, earMat);
        rightEar.position.set(0.4, 1.75, 0);
        this.observer.add(rightEar);
        this.rightEar = rightEar;

        // 放置在路边
        this.observer.position.set(0, 0, 8);
        this.mainGroup.add(this.observer);

        // 添加交互
        this.interactables.push({
            object: body,
            info: {
                title: '观察者（接收者）',
                content: `
                    <p>👤 <strong>站在路边的人</strong></p>
                    <p>观察者站在固定位置，接收来自救护车的声波。</p>
                    <br>
                    <p>🔊 观察者听到的频率取决于：</p>
                    <p>• 声源的发射频率</p>
                    <p>• 声源与观察者的相对速度</p>
                    <br>
                    <p>💡 <strong>多普勒公式：</strong></p>
                    <p class="text-yellow-400">f' = f × (v ± v₀) / (v ∓ vₛ)</p>
                `
            }
        });
    }

    /**
     * 创建频率指示器
     */
    createFrequencyIndicator() {
        this.frequencyIndicator = new THREE.Group();

        // 背景板
        const bgGeo = new THREE.PlaneGeometry(6, 3);
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.frequencyIndicator.add(bg);

        // 频率条（用来显示频率高低）
        const barGeo = new THREE.PlaneGeometry(4, 0.5);
        const barMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.freqBar = new THREE.Mesh(barGeo, barMat);
        this.freqBar.position.set(0, 0.5, 0.01);
        this.frequencyIndicator.add(this.freqBar);

        // 基准线
        const refGeo = new THREE.PlaneGeometry(4, 0.1);
        const refMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const refLine = new THREE.Mesh(refGeo, refMat);
        refLine.position.set(0, -0.5, 0.01);
        this.frequencyIndicator.add(refLine);

        this.frequencyIndicator.position.set(0, 10, 10);
        this.frequencyIndicator.rotation.x = -0.3;
        this.mainGroup.add(this.frequencyIndicator);
    }

    /**
     * 创建说明标签
     */
    createLabels() {
        // 使用简单的3D文字或保持简洁
        // 实际效果通过UI面板展示
    }

    /**
     * 发射一个波纹
     */
    emitWave(sourceX, isStatic = false) {
        const waveGroup = new THREE.Group();

        // 创建波纹圈
        const ringGeo = new THREE.RingGeometry(0.1, 0.3, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: isStatic ? 0x888888 : 0x00aaff,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = -Math.PI / 2;
        waveGroup.add(ring);

        waveGroup.position.set(sourceX, 3, 0);
        waveGroup.userData = {
            birthX: sourceX,
            radius: 0.2,
            opacity: 0.8
        };

        this.mainGroup.add(waveGroup);

        if (isStatic) {
            this.staticWaveRings.push(waveGroup);
        } else {
            this.waveRings.push(waveGroup);
        }
    }

    /**
     * 更新波纹
     */
    updateWaves(delta) {
        const waveGrowthRate = this.params.waveSpeed * delta * 60;

        // 更新主波纹
        for (let i = this.waveRings.length - 1; i >= 0; i--) {
            const wave = this.waveRings[i];
            const data = wave.userData;

            // 波纹扩大
            data.radius += waveGrowthRate;
            data.opacity -= 0.008;

            // 更新几何体
            const ring = wave.children[0];
            ring.scale.set(data.radius * 5, data.radius * 5, 1);
            ring.material.opacity = Math.max(0, data.opacity);

            // 移除消失的波纹
            if (data.opacity <= 0 || data.radius > 30) {
                this.mainGroup.remove(wave);
                wave.children[0].geometry.dispose();
                wave.children[0].material.dispose();
                this.waveRings.splice(i, 1);
            }
        }

        // 更新静态波纹
        for (let i = this.staticWaveRings.length - 1; i >= 0; i--) {
            const wave = this.staticWaveRings[i];
            const data = wave.userData;

            data.radius += waveGrowthRate;
            data.opacity -= 0.008;

            const ring = wave.children[0];
            ring.scale.set(data.radius * 5, data.radius * 5, 1);
            ring.material.opacity = Math.max(0, data.opacity);

            if (data.opacity <= 0 || data.radius > 30) {
                this.mainGroup.remove(wave);
                wave.children[0].geometry.dispose();
                wave.children[0].material.dispose();
                this.staticWaveRings.splice(i, 1);
            }
        }
    }

    /**
     * 计算观察者接收到的频率
     */
    calculateObservedFrequency() {
        const soundSpeed = this.params.waveSpeed * 100; // 归一化声速
        const sourceSpeed = this.params.ambulanceSpeed * 100 * this.params.direction;
        const baseFreq = 1.0; // 基准频率

        // 计算观察者相对于声源的位置
        const observerX = this.observer.position.x;
        const sourceX = this.ambulance.position.x;
        const dx = observerX - sourceX;

        // 声源朝向观察者移动时频率升高，远离时降低
        let relativeVelocity = 0;
        if (this.params.isMoving) {
            if (this.params.direction > 0) {
                // 向右移动
                relativeVelocity = dx > 0 ? sourceSpeed : -sourceSpeed;
            } else {
                // 向左移动
                relativeVelocity = dx < 0 ? sourceSpeed : -sourceSpeed;
            }
        }

        // 多普勒公式
        const observedFreq = baseFreq * soundSpeed / (soundSpeed - relativeVelocity);
        return Math.max(0.5, Math.min(2.0, observedFreq)); // 限制范围
    }

    /**
     * 更新频率指示器
     */
    updateFrequencyIndicator() {
        const freq = this.calculateObservedFrequency();
        
        // 更新条形长度和颜色
        this.freqBar.scale.x = freq;
        
        // 颜色：低频红色，高频蓝色
        const hue = (freq - 0.5) / 1.5 * 0.6; // 0 = 红, 0.6 = 蓝
        const color = new THREE.Color().setHSL(hue, 1, 0.5);
        this.freqBar.material.color = color;

        // 更新耳朵颜色表示
        this.leftEar.material.color = color;
        this.rightEar.material.color = color;
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;

        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn primary" id="btn-play">
                <i class="fas fa-pause"></i> 暂停
            </button>
            <button class="control-btn" id="btn-reverse">
                <i class="fas fa-exchange-alt"></i> 反向
            </button>
            <div class="control-slider-group">
                <label>速度: <span id="speed-value">${this.params.ambulanceSpeed.toFixed(2)}</span></label>
                <input type="range" id="speed-slider" min="0.02" max="0.15" step="0.01" 
                       value="${this.params.ambulanceSpeed}" class="styled-slider">
            </div>
            <button class="control-btn" id="btn-static">
                <i class="fas fa-circle"></i> 静止对比
            </button>
            <button class="control-btn" id="btn-observer-side">
                <i class="fas fa-user"></i> 路边
            </button>
            <button class="control-btn" id="btn-observer-front">
                <i class="fas fa-arrow-right"></i> 前方
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 视角
            </button>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 播放/暂停
        document.getElementById('btn-play')?.addEventListener('click', () => {
            this.params.isMoving = !this.params.isMoving;
            const btn = document.getElementById('btn-play');
            btn.innerHTML = this.params.isMoving ? 
                '<i class="fas fa-pause"></i> 暂停' : 
                '<i class="fas fa-play"></i> 播放';
        });

        // 反向
        document.getElementById('btn-reverse')?.addEventListener('click', () => {
            this.params.direction *= -1;
        });

        // 速度调节
        document.getElementById('speed-slider')?.addEventListener('input', (e) => {
            this.params.ambulanceSpeed = parseFloat(e.target.value);
            document.getElementById('speed-value').textContent = 
                this.params.ambulanceSpeed.toFixed(2);
        });

        // 静止对比
        document.getElementById('btn-static')?.addEventListener('click', () => {
            this.params.showStaticComparison = !this.params.showStaticComparison;
            const btn = document.getElementById('btn-static');
            btn.classList.toggle('active', this.params.showStaticComparison);
            
            if (!this.params.showStaticComparison) {
                // 清除静态波纹
                this.staticWaveRings.forEach(wave => {
                    this.mainGroup.remove(wave);
                    wave.children[0].geometry.dispose();
                    wave.children[0].material.dispose();
                });
                this.staticWaveRings = [];
            }
        });

        // 观察者位置：路边
        document.getElementById('btn-observer-side')?.addEventListener('click', () => {
            this.params.observerPosition = 'side';
            gsap.to(this.observer.position, {
                x: 0, z: 8,
                duration: 0.5,
                ease: 'power2.out'
            });
        });

        // 观察者位置：前方
        document.getElementById('btn-observer-front')?.addEventListener('click', () => {
            this.params.observerPosition = 'front';
            gsap.to(this.observer.position, {
                x: 20, z: 0,
                duration: 0.5,
                ease: 'power2.out'
            });
        });

        // 重置
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.resetScene();
        });

        // 重置视角
        document.getElementById('btn-reset-view')?.addEventListener('click', () => {
            gsap.to(this.camera.position, {
                x: this.defaultCameraPos.x,
                y: this.defaultCameraPos.y,
                z: this.defaultCameraPos.z,
                duration: 1,
                ease: 'power2.out'
            });
        });
    }

    /**
     * 重置场景
     */
    resetScene() {
        this.ambulanceX = -15;
        this.ambulance.position.x = this.ambulanceX;
        this.params.direction = 1;
        this.params.isMoving = true;

        // 清除所有波纹
        this.waveRings.forEach(wave => {
            this.mainGroup.remove(wave);
            wave.children[0].geometry.dispose();
            wave.children[0].material.dispose();
        });
        this.waveRings = [];

        this.staticWaveRings.forEach(wave => {
            this.mainGroup.remove(wave);
            wave.children[0].geometry.dispose();
            wave.children[0].material.dispose();
        });
        this.staticWaveRings = [];

        // 重置UI
        const btn = document.getElementById('btn-play');
        if (btn) btn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            title.textContent = '🚑 多普勒效应';
            content.innerHTML = `
                <p><strong>生活中的多普勒效应</strong></p>
                <br>
                <p>当救护车从你身边经过时，你有没有注意到：</p>
                <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                    <li>• 靠近时 → 声音变尖（高频）</li>
                    <li>• 远离时 → 声音变低（低频）</li>
                </ul>
                <br>
                <p>这就是<span class="text-yellow-400">多普勒效应</span>！</p>
                <br>
                <p><strong>观察要点：</strong></p>
                <p>• 注意波纹在<span class="text-blue-400">前方被压缩</span></p>
                <p>• 注意波纹在<span class="text-red-400">后方被拉伸</span></p>
                <br>
                <p>💡 点击"静止对比"按钮，与静止声源对比！</p>
            `;
            panel.classList.add('visible');
        }
    }

    /**
     * 动画更新（场景管理器调用）
     */
    animate(time, delta) {
        this.animationPhase = time;

        // 更新救护车位置
        if (this.params.isMoving) {
            this.ambulanceX += this.params.ambulanceSpeed * this.params.direction;
            this.ambulance.position.x = this.ambulanceX;

            // 循环移动
            if (this.ambulanceX > 25) {
                this.ambulanceX = -25;
            } else if (this.ambulanceX < -25) {
                this.ambulanceX = 25;
            }
        }

        // 警灯闪烁
        const lightPhase = Math.floor(this.animationPhase * 4) % 2;
        this.redLight.visible = lightPhase === 0;
        this.blueLight.visible = lightPhase === 1;

        // 发射波纹
        if (this.animationPhase - this.lastWaveTime > this.params.waveFrequency) {
            this.lastWaveTime = this.animationPhase;
            
            // 主声源发射波
            if (this.waveRings.length < this.params.maxWaves) {
                this.emitWave(this.ambulance.position.x, false);
            }

            // 静止声源发射波（对比用）
            if (this.params.showStaticComparison && 
                this.staticWaveRings.length < this.params.maxWaves) {
                this.emitWave(-10, true); // 静止在x=-10位置
            }
        }

        // 更新波纹
        this.updateWaves(delta);

        // 更新频率指示器
        this.updateFrequencyIndicator();

        // 扬声器脉冲
        const pulseScale = 1 + 0.3 * Math.sin(this.animationPhase * 10);
        this.speaker.scale.setScalar(pulseScale);
    }

    /**
     * 处理点击
     */
    onMouseClick(raycaster) {
        const meshes = this.interactables.map(item => item.object);
        const intersects = raycaster.intersectObjects(meshes, false);

        if (intersects.length > 0) {
            const clickedMesh = intersects[0].object;
            const item = this.interactables.find(i => i.object === clickedMesh);

            if (item) {
                const panel = document.getElementById('info-panel');
                const title = document.getElementById('info-title');
                const content = document.getElementById('info-content');

                if (panel && title && content) {
                    title.textContent = item.info.title;
                    content.innerHTML = item.info.content;
                    panel.classList.add('visible');
                }
            }
        }
    }

    /**
     * 处理鼠标移动
     */
    onMouseMove(raycaster) {
        const meshes = this.interactables.map(item => item.object);
        const intersects = raycaster.intersectObjects(meshes, false);

        // 重置之前的高亮
        if (this.highlighted) {
            if (this.highlighted.material.emissive) {
                this.highlighted.material.emissive.setHex(0x000000);
            }
            this.highlighted = null;
        }

        if (intersects.length > 0) {
            this.highlighted = intersects[0].object;
            if (this.highlighted.material.emissive) {
                this.highlighted.material.emissive.setHex(0x333333);
            }
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    /**
     * 清理资源
     */
    dispose() {
        // 清除波纹
        this.waveRings.forEach(wave => {
            this.mainGroup.remove(wave);
            wave.children[0].geometry.dispose();
            wave.children[0].material.dispose();
        });
        this.waveRings = [];

        this.staticWaveRings.forEach(wave => {
            this.mainGroup.remove(wave);
            wave.children[0].geometry.dispose();
            wave.children[0].material.dispose();
        });
        this.staticWaveRings = [];

        // 清除UI
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'none';
            controlsDiv.innerHTML = '';
        }

        // 移除主组
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
            this.mainGroup.traverse(obj => {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material) {
                    if (Array.isArray(obj.material)) {
                        obj.material.forEach(m => m.dispose());
                    } else {
                        obj.material.dispose();
                    }
                }
            });
        }

        this.interactables = [];
    }
};
