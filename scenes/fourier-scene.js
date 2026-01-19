/**
 * 傅里叶变换场景 - Fourier Transform Visualization
 * ============================================
 * "任何周期函数都可以分解为一系列正弦波的叠加"
 * 
 * 核心概念：
 * 1. 傅里叶级数：周期函数 = Σ(aₙcos(nωt) + bₙsin(nωt))
 * 2. 本轮合成：旋转的圆叠加，圆心在前一个圆的圆周上
 * 3. 频谱分析：将信号从时域转换到频域
 * 
 * 可视化内容：
 * - 多个同心旋转圆（本轮/epicycles）
 * - 圆周运动叠加绘制目标波形
 * - 实时频谱图显示各频率分量
 * - 方波、锯齿波、三角波等经典波形
 * ============================================
 */
window.FourierScene = class FourierScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.epicycleGroup = null;       // 本轮组
        this.circles = [];               // 所有的圆
        this.waveGroup = null;           // 波形组
        this.wavePoints = [];            // 波形点
        this.waveLine = null;            // 波形线
        this.connectLine = null;         // 连接线（笔尖到波形）
        this.spectrumGroup = null;       // 频谱组
        this.spectrumBars = [];          // 频谱柱
        this.penTip = null;              // 笔尖
        this.penTrail = null;            // 笔尖轨迹

        // 参数
        this.params = {
            waveType: 'square',          // 波形类型：square, sawtooth, triangle
            harmonics: 5,                // 谐波数量
            maxHarmonics: 30,            // 最大谐波数
            speed: 1,                    // 动画速度
            time: 0,                     // 当前时间
            waveWidth: 12,               // 波形显示宽度
            circleScale: 2,              // 圆的缩放
            showSpectrum: true,          // 显示频谱
            showCircles: true,           // 显示圆
            showFormula: false           // 显示公式
        };

        // 颜色主题 - 音乐可视化风格
        this.colors = {
            background: 0x0a0a1a,
            circle: 0x4a90d9,            // 圆 - 蓝色
            circleGlow: 0x00d4ff,        // 圆发光
            wave: 0x00ff88,              // 波形 - 绿色
            pen: 0xffd700,               // 笔尖 - 金色
            connect: 0xff6b9d,           // 连接线 - 粉色
            spectrum: [                   // 频谱渐变
                0xff6b6b, 0xffa500, 0xffd700, 
                0x00ff88, 0x00d4ff, 0xa855f7
            ],
            grid: 0x1a1a3a
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 8, z: 20 };
        
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

        // 背景 - 深色电音风格
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
    }

    /**
     * 设置光照
     */
    setupLights() {
        // 环境光
        const ambient = new THREE.AmbientLight(0xffffff, 0.3);
        this.scene.add(ambient);

        // 主光源
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.5);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);

        // 点光源 - 笔尖发光效果
        this.penLight = new THREE.PointLight(0xffd700, 1, 10);
        this.penLight.position.set(-5, 0, 0);
        this.scene.add(this.penLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建网格背景
        this.createGrid();

        // 创建本轮组
        this.createEpicycles();

        // 创建波形显示区
        this.createWaveDisplay();

        // 创建频谱图
        this.createSpectrum();

        // 创建连接线
        this.createConnectLine();

        // 创建笔尖
        this.createPenTip();

        // 创建公式显示
        this.createFormulaDisplay();

        // 创建星空背景粒子
        this.createStarfield();
    }

    /**
     * 创建网格背景
     */
    createGrid() {
        const gridGroup = new THREE.Group();

        // 水平线
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: this.colors.grid, 
            transparent: true, 
            opacity: 0.3 
        });

        for (let i = -10; i <= 10; i += 2) {
            const points = [
                new THREE.Vector3(-20, i, -0.1),
                new THREE.Vector3(20, i, -0.1)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            gridGroup.add(line);
        }

        // 垂直线
        for (let i = -20; i <= 20; i += 2) {
            const points = [
                new THREE.Vector3(i, -10, -0.1),
                new THREE.Vector3(i, 10, -0.1)
            ];
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geometry, lineMaterial);
            gridGroup.add(line);
        }

        this.mainGroup.add(gridGroup);
    }

    /**
     * 创建本轮（旋转圆）
     */
    createEpicycles() {
        this.epicycleGroup = new THREE.Group();
        this.epicycleGroup.position.set(-8, 0, 0);
        this.mainGroup.add(this.epicycleGroup);

        this.updateEpicycles();
    }

    /**
     * 更新本轮配置
     */
    updateEpicycles() {
        // 清除旧的圆
        while (this.epicycleGroup.children.length > 0) {
            const child = this.epicycleGroup.children[0];
            this.epicycleGroup.remove(child);
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(m => m.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
        this.circles = [];

        // 获取傅里叶系数
        const coefficients = this.getFourierCoefficients();

        // 创建每个谐波的圆
        coefficients.forEach((coef, index) => {
            const circleObj = this.createSingleCircle(coef, index);
            this.circles.push(circleObj);
            this.epicycleGroup.add(circleObj.group);
        });
    }

    /**
     * 创建单个圆
     */
    createSingleCircle(coef, index) {
        const group = new THREE.Group();

        // 圆环
        const ringGeometry = new THREE.RingGeometry(
            coef.amplitude * this.params.circleScale - 0.02,
            coef.amplitude * this.params.circleScale + 0.02,
            64
        );
        
        // 渐变颜色
        const colorIndex = index % this.colors.spectrum.length;
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.spectrum[colorIndex],
            transparent: true,
            opacity: 0.6,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        group.add(ring);

        // 圆心点
        const centerGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const centerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffffff 
        });
        const center = new THREE.Mesh(centerGeometry, centerMaterial);
        group.add(center);

        // 半径线（指向当前位置）
        const radiusGeometry = new THREE.BufferGeometry();
        const radiusMaterial = new THREE.LineBasicMaterial({
            color: this.colors.spectrum[colorIndex],
            transparent: true,
            opacity: 0.8
        });
        const radiusLine = new THREE.Line(radiusGeometry, radiusMaterial);
        group.add(radiusLine);

        // 端点圆球
        const endGeometry = new THREE.SphereGeometry(0.1, 16, 16);
        const endMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.spectrum[colorIndex]
        });
        const endPoint = new THREE.Mesh(endGeometry, endMaterial);
        group.add(endPoint);

        return {
            group,
            ring,
            radiusLine,
            endPoint,
            frequency: coef.frequency,
            amplitude: coef.amplitude,
            phase: coef.phase
        };
    }

    /**
     * 获取傅里叶系数
     */
    getFourierCoefficients() {
        const coefficients = [];
        const n = this.params.harmonics;

        switch (this.params.waveType) {
            case 'square':
                // 方波：只有奇次谐波，振幅 4/(nπ)
                for (let k = 0; k < n; k++) {
                    const harmonic = 2 * k + 1;
                    coefficients.push({
                        frequency: harmonic,
                        amplitude: 4 / (harmonic * Math.PI),
                        phase: 0
                    });
                }
                break;

            case 'sawtooth':
                // 锯齿波：所有谐波，振幅 2/(nπ) * (-1)^(n+1)
                for (let k = 1; k <= n; k++) {
                    coefficients.push({
                        frequency: k,
                        amplitude: 2 / (k * Math.PI),
                        phase: k % 2 === 0 ? Math.PI : 0
                    });
                }
                break;

            case 'triangle':
                // 三角波：只有奇次谐波，振幅 8/(n²π²) * (-1)^((n-1)/2)
                for (let k = 0; k < n; k++) {
                    const harmonic = 2 * k + 1;
                    const sign = k % 2 === 0 ? 1 : -1;
                    coefficients.push({
                        frequency: harmonic,
                        amplitude: 8 / (harmonic * harmonic * Math.PI * Math.PI) * sign,
                        phase: 0
                    });
                }
                break;

            default:
                // 默认正弦波
                coefficients.push({
                    frequency: 1,
                    amplitude: 1,
                    phase: 0
                });
        }

        // 按振幅降序排列
        coefficients.sort((a, b) => Math.abs(b.amplitude) - Math.abs(a.amplitude));

        return coefficients;
    }

    /**
     * 创建波形显示区
     */
    createWaveDisplay() {
        this.waveGroup = new THREE.Group();
        this.waveGroup.position.set(2, 0, 0);
        this.mainGroup.add(this.waveGroup);

        // 创建波形线
        const waveGeometry = new THREE.BufferGeometry();
        const waveMaterial = new THREE.LineBasicMaterial({
            color: this.colors.wave,
            linewidth: 2
        });
        this.waveLine = new THREE.Line(waveGeometry, waveMaterial);
        this.waveGroup.add(this.waveLine);

        // 创建发光波形（双层效果）
        const glowMaterial = new THREE.LineBasicMaterial({
            color: this.colors.wave,
            transparent: true,
            opacity: 0.3,
            linewidth: 4
        });
        this.waveGlow = new THREE.Line(waveGeometry.clone(), glowMaterial);
        this.waveGlow.scale.set(1.02, 1.02, 1);
        this.waveGroup.add(this.waveGlow);

        // 理想波形（虚线）
        this.createIdealWave();
    }

    /**
     * 创建理想波形参考线
     */
    createIdealWave() {
        const points = [];
        const segments = 200;
        
        for (let i = 0; i <= segments; i++) {
            const x = (i / segments) * this.params.waveWidth;
            const t = (i / segments) * Math.PI * 4;
            let y = 0;

            switch (this.params.waveType) {
                case 'square':
                    y = Math.sin(t) >= 0 ? 1 : -1;
                    break;
                case 'sawtooth':
                    y = 2 * ((t / (2 * Math.PI)) % 1) - 1;
                    break;
                case 'triangle':
                    y = 2 * Math.abs(2 * ((t / (2 * Math.PI)) % 1) - 1) - 1;
                    break;
                default:
                    y = Math.sin(t);
            }

            points.push(new THREE.Vector3(x, y * this.params.circleScale, -0.05));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        // 移除旧的理想波形
        if (this.idealWave) {
            this.waveGroup.remove(this.idealWave);
            this.idealWave.geometry.dispose();
        }

        const material = new THREE.LineDashedMaterial({
            color: 0x666688,
            transparent: true,
            opacity: 0.4,
            dashSize: 0.2,
            gapSize: 0.1
        });

        this.idealWave = new THREE.Line(geometry, material);
        this.idealWave.computeLineDistances();
        this.waveGroup.add(this.idealWave);
    }

    /**
     * 创建频谱图
     */
    createSpectrum() {
        this.spectrumGroup = new THREE.Group();
        this.spectrumGroup.position.set(2, -6, 0);
        this.mainGroup.add(this.spectrumGroup);

        // 频谱轴
        const axisGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(this.params.waveWidth, 0, 0)
        ]);
        const axisMaterial = new THREE.LineBasicMaterial({ color: 0x444466 });
        const axis = new THREE.Line(axisGeometry, axisMaterial);
        this.spectrumGroup.add(axis);

        // 标签
        this.createSpectrumLabel();

        this.updateSpectrum();
    }

    /**
     * 创建频谱标签
     */
    createSpectrumLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#00ff88';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('频率分量 (Frequency Spectrum)', 128, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(this.params.waveWidth / 2, -1.5, 0);
        sprite.scale.set(6, 1.5, 1);
        this.spectrumGroup.add(sprite);
    }

    /**
     * 更新频谱图
     */
    updateSpectrum() {
        // 清除旧的频谱柱
        this.spectrumBars.forEach(bar => {
            this.spectrumGroup.remove(bar);
            bar.geometry.dispose();
            bar.material.dispose();
        });
        this.spectrumBars = [];

        if (!this.params.showSpectrum) return;

        const coefficients = this.getFourierCoefficients();
        const barWidth = 0.3;
        const spacing = this.params.waveWidth / (this.params.harmonics + 1);

        coefficients.forEach((coef, index) => {
            const height = Math.abs(coef.amplitude) * 2;
            const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
            
            const colorIndex = index % this.colors.spectrum.length;
            const material = new THREE.MeshBasicMaterial({
                color: this.colors.spectrum[colorIndex],
                transparent: true,
                opacity: 0.8
            });

            const bar = new THREE.Mesh(geometry, material);
            bar.position.set(
                spacing * (index + 1),
                height / 2,
                0
            );

            this.spectrumBars.push(bar);
            this.spectrumGroup.add(bar);

            // 添加频率标签
            const labelCanvas = document.createElement('canvas');
            labelCanvas.width = 64;
            labelCanvas.height = 32;
            const ctx = labelCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${coef.frequency}f`, 32, 24);

            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            const labelMaterial = new THREE.SpriteMaterial({ 
                map: labelTexture,
                transparent: true
            });
            const label = new THREE.Sprite(labelMaterial);
            label.position.set(spacing * (index + 1), -0.5, 0);
            label.scale.set(0.8, 0.4, 1);
            this.spectrumGroup.add(label);
        });
    }

    /**
     * 创建连接线
     */
    createConnectLine() {
        const geometry = new THREE.BufferGeometry();
        const material = new THREE.LineDashedMaterial({
            color: this.colors.connect,
            transparent: true,
            opacity: 0.6,
            dashSize: 0.2,
            gapSize: 0.1
        });
        this.connectLine = new THREE.Line(geometry, material);
        this.mainGroup.add(this.connectLine);
    }

    /**
     * 创建笔尖
     */
    createPenTip() {
        // 发光球体
        const geometry = new THREE.SphereGeometry(0.2, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: this.colors.pen,
            transparent: true,
            opacity: 0.9
        });
        this.penTip = new THREE.Mesh(geometry, material);
        this.mainGroup.add(this.penTip);

        // 光晕效果
        const glowGeometry = new THREE.SphereGeometry(0.4, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: this.colors.pen,
            transparent: true,
            opacity: 0.3
        });
        this.penGlow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.penTip.add(this.penGlow);
    }

    /**
     * 创建公式显示
     */
    createFormulaDisplay() {
        this.formulaGroup = new THREE.Group();
        this.formulaGroup.position.set(0, 7, 0);
        this.formulaGroup.visible = false;
        this.mainGroup.add(this.formulaGroup);

        // 主公式
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = 'rgba(10, 10, 30, 0.8)';
        ctx.fillRect(0, 0, 512, 128);
        
        ctx.strokeStyle = '#00d4ff';
        ctx.lineWidth = 2;
        ctx.strokeRect(2, 2, 508, 124);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('f(t) = Σ [aₙcos(nωt) + bₙsin(nωt)]', 256, 50);
        
        ctx.fillStyle = '#00ff88';
        ctx.font = '18px Arial';
        ctx.fillText('傅里叶级数：任何周期函数都可分解为正弦波叠加', 256, 90);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(10, 2.5, 1);
        this.formulaGroup.add(sprite);
    }

    /**
     * 创建星空背景
     */
    createStarfield() {
        const starsGeometry = new THREE.BufferGeometry();
        const starPositions = [];
        
        for (let i = 0; i < 500; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = -20 - Math.random() * 30;
            starPositions.push(x, y, z);
        }

        starsGeometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(starPositions, 3)
        );

        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });

        this.starfield = new THREE.Points(starsGeometry, starsMaterial);
        this.scene.add(this.starfield);
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
                <button class="control-btn" id="btn-square">
                    <i class="fas fa-square"></i> 方波
                </button>
                <button class="control-btn" id="btn-sawtooth">
                    <i class="fas fa-chart-line"></i> 锯齿波
                </button>
                <button class="control-btn" id="btn-triangle">
                    <i class="fas fa-caret-up"></i> 三角波
                </button>
                <button class="control-btn" id="btn-add-harmonic">
                    <i class="fas fa-plus"></i> 增加谐波
                </button>
                <button class="control-btn" id="btn-sub-harmonic">
                    <i class="fas fa-minus"></i> 减少谐波
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
        }

        const panel = document.getElementById('control-panel');
        if (!panel) return;

        panel.innerHTML = `
            <div class="control-section">
                <h4><i class="fas fa-wave-square"></i> 波形类型</h4>
                <div class="wave-type-buttons">
                    <button id="btn-square" class="wave-btn active" title="方波">
                        <i class="fas fa-square"></i> 方波
                    </button>
                    <button id="btn-sawtooth" class="wave-btn" title="锯齿波">
                        <i class="fas fa-chart-line"></i> 锯齿波
                    </button>
                    <button id="btn-triangle" class="wave-btn" title="三角波">
                        <i class="fas fa-caret-up"></i> 三角波
                    </button>
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-sliders-h"></i> 谐波数量: <span id="harmonics-value">${this.params.harmonics}</span></h4>
                <input type="range" id="harmonics-slider" 
                       min="1" max="${this.params.maxHarmonics}" 
                       value="${this.params.harmonics}" 
                       class="styled-slider">
                <div class="slider-labels">
                    <span>1</span>
                    <span>简单</span>
                    <span>→</span>
                    <span>精确</span>
                    <span>${this.params.maxHarmonics}</span>
                </div>
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-tachometer-alt"></i> 动画速度</h4>
                <input type="range" id="speed-slider" 
                       min="0.1" max="3" step="0.1"
                       value="${this.params.speed}" 
                       class="styled-slider">
            </div>
            
            <div class="control-section">
                <h4><i class="fas fa-toggle-on"></i> 显示选项</h4>
                <div class="toggle-options">
                    <label class="toggle-label">
                        <input type="checkbox" id="toggle-circles" checked>
                        <span>显示本轮</span>
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" id="toggle-spectrum" checked>
                        <span>显示频谱</span>
                    </label>
                    <label class="toggle-label">
                        <input type="checkbox" id="toggle-formula">
                        <span>显示公式</span>
                    </label>
                </div>
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
                .wave-type-buttons {
                    display: flex;
                    gap: 8px;
                    flex-wrap: wrap;
                }
                .wave-btn {
                    flex: 1;
                    min-width: 80px;
                    padding: 10px 12px;
                    border: 2px solid #4a90d9;
                    background: rgba(74, 144, 217, 0.1);
                    color: #4a90d9;
                    border-radius: 8px;
                    cursor: pointer;
                    transition: all 0.3s;
                    font-size: 12px;
                }
                .wave-btn:hover {
                    background: rgba(74, 144, 217, 0.3);
                    transform: translateY(-2px);
                }
                .wave-btn.active {
                    background: #4a90d9;
                    color: #ffffff;
                    box-shadow: 0 0 15px rgba(74, 144, 217, 0.5);
                }
                .styled-slider {
                    width: 100%;
                    height: 8px;
                    border-radius: 4px;
                    background: linear-gradient(to right, #4a90d9, #00ff88);
                    outline: none;
                    -webkit-appearance: none;
                }
                .styled-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: #ffd700;
                    cursor: pointer;
                    box-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
                }
                .slider-labels {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    color: #888;
                    margin-top: 5px;
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
                    accent-color: #00ff88;
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
                    background: linear-gradient(135deg, #4a90d9, #00d4ff);
                }
            </style>
        `;

        this.bindUIEvents();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        // 波形类型按钮（底部和侧边面板共用）
        const waveButtons = ['square', 'sawtooth', 'triangle'];
        waveButtons.forEach(type => {
            const btn = document.getElementById(`btn-${type}`);
            if (btn) {
                btn.addEventListener('click', () => {
                    this.setWaveType(type);
                    // 更新按钮状态
                    document.querySelectorAll('.wave-btn').forEach(b => b.classList.remove('active'));
                });
            }
        });

        // 增加/减少谐波按钮
        const addHarmonicBtn = document.getElementById('btn-add-harmonic');
        if (addHarmonicBtn) {
            addHarmonicBtn.addEventListener('click', () => {
                if (this.params.harmonics < this.params.maxHarmonics) {
                    this.params.harmonics++;
                    this.updateEpicycles();
                    this.updateSpectrum();
                    this.createIdealWave();
                    this.wavePoints = [];
                    this.showToast(`谐波数量: ${this.params.harmonics}`);
                }
            });
        }

        const subHarmonicBtn = document.getElementById('btn-sub-harmonic');
        if (subHarmonicBtn) {
            subHarmonicBtn.addEventListener('click', () => {
                if (this.params.harmonics > 1) {
                    this.params.harmonics--;
                    this.updateEpicycles();
                    this.updateSpectrum();
                    this.createIdealWave();
                    this.wavePoints = [];
                    this.showToast(`谐波数量: ${this.params.harmonics}`);
                }
            });
        }

        // 重置视角
        const resetViewBtn = document.getElementById('btn-reset-view');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                this.resetCamera();
            });
        }

        // 谐波数量滑块
        const harmonicsSlider = document.getElementById('harmonics-slider');
        if (harmonicsSlider) {
            harmonicsSlider.addEventListener('input', (e) => {
                this.params.harmonics = parseInt(e.target.value);
                document.getElementById('harmonics-value').textContent = this.params.harmonics;
                this.updateEpicycles();
                this.updateSpectrum();
                this.createIdealWave();
                this.wavePoints = [];
            });
        }

        // 速度滑块
        const speedSlider = document.getElementById('speed-slider');
        if (speedSlider) {
            speedSlider.addEventListener('input', (e) => {
                this.params.speed = parseFloat(e.target.value);
            });
        }

        // 显示选项
        const toggleCircles = document.getElementById('toggle-circles');
        if (toggleCircles) {
            toggleCircles.addEventListener('change', (e) => {
                this.params.showCircles = e.target.checked;
                this.epicycleGroup.visible = e.target.checked;
            });
        }

        const toggleSpectrum = document.getElementById('toggle-spectrum');
        if (toggleSpectrum) {
            toggleSpectrum.addEventListener('change', (e) => {
                this.params.showSpectrum = e.target.checked;
                this.spectrumGroup.visible = e.target.checked;
            });
        }

        const toggleFormula = document.getElementById('toggle-formula');
        if (toggleFormula) {
            toggleFormula.addEventListener('change', (e) => {
                this.params.showFormula = e.target.checked;
                this.formulaGroup.visible = e.target.checked;
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
                this.reset();
            });
        }
    }

    /**
     * 设置波形类型
     */
    setWaveType(type) {
        this.params.waveType = type;
        this.wavePoints = [];
        this.updateEpicycles();
        this.updateSpectrum();
        this.createIdealWave();

        // 显示波形说明
        const waveNames = {
            'square': '方波 - 只包含奇次谐波',
            'sawtooth': '锯齿波 - 包含所有谐波',
            'triangle': '三角波 - 奇次谐波，振幅快速衰减'
        };
        this.showToast(waveNames[type]);
    }

    /**
     * 重置场景
     */
    reset() {
        this.params.time = 0;
        this.wavePoints = [];
        this.isAutoPlaying = true;
        
        const playBtn = document.getElementById('btn-play');
        if (playBtn) {
            playBtn.innerHTML = '<i class="fas fa-pause"></i> 暂停';
        }

        this.showToast('已重置');
    }

    /**
     * 显示提示
     */
    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'fourier-toast';
        toast.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
        toast.style.cssText = `
            position: fixed;
            top: 80px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 212, 255, 0.9);
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 14px;
            z-index: 1000;
            animation: fadeInOut 2s ease-in-out;
        `;
        document.body.appendChild(toast);

        setTimeout(() => toast.remove(), 2000);
    }

    /**
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        if (panel) {
            panel.innerHTML = `
                <div style="padding: 15px;">
                    <h3 style="color: #00ff88; margin-bottom: 10px;">
                        <i class="fas fa-wave-square"></i> 傅里叶变换
                    </h3>
                    <p style="color: #aaa; font-size: 13px; line-height: 1.6;">
                        <strong style="color: #ffd700;">核心思想：</strong><br>
                        任何复杂的周期波形，都可以分解为<br>
                        一系列简单正弦波的叠加！
                    </p>
                    <div style="margin: 15px 0; padding: 10px; background: rgba(0,255,136,0.1); border-radius: 8px;">
                        <p style="color: #00ff88; font-size: 12px;">
                            🔄 旋转的圆叫做"本轮"(Epicycle)<br>
                            📊 左边：本轮叠加 → 合成波形<br>
                            📈 下方：频谱图 → 各频率分量
                        </p>
                    </div>
                    <p style="color: #888; font-size: 12px;">
                        💡 调整谐波数量，观察波形如何逼近理想形状
                    </p>
                </div>
            `;
        }
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        if (!this.isAutoPlaying) {
            // 即使暂停也要保持显示
            this.updateDisplay();
            return;
        }

        // 更新时间
        this.params.time += delta * this.params.speed * 0.001;

        // 更新本轮动画
        this.updateEpicycleAnimation();

        // 更新波形
        this.updateWaveform();

        // 更新连接线
        this.updateConnectLine();

        // 更新频谱动画
        this.updateSpectrumAnimation();

        // 星空微动
        if (this.starfield) {
            this.starfield.rotation.z += 0.0001;
        }
    }

    /**
     * 更新本轮动画
     */
    updateEpicycleAnimation() {
        if (!this.circles.length) return;

        let currentX = 0;
        let currentY = 0;

        this.circles.forEach((circleObj, index) => {
            const { group, radiusLine, endPoint, frequency, amplitude, phase } = circleObj;
            
            // 圆心位置（基于前一个圆的端点）
            group.position.set(currentX, currentY, 0);

            // 计算当前角度
            const angle = frequency * this.params.time + phase;

            // 端点位置
            const endX = Math.cos(angle) * amplitude * this.params.circleScale;
            const endY = Math.sin(angle) * amplitude * this.params.circleScale;

            // 更新半径线
            const linePositions = new Float32Array([
                0, 0, 0,
                endX, endY, 0.1
            ]);
            radiusLine.geometry.setAttribute(
                'position',
                new THREE.BufferAttribute(linePositions, 3)
            );
            radiusLine.geometry.attributes.position.needsUpdate = true;

            // 更新端点
            endPoint.position.set(endX, endY, 0.1);

            // 累加位置
            currentX += endX;
            currentY += endY;
        });

        // 更新笔尖位置
        const penX = this.epicycleGroup.position.x + currentX;
        const penY = currentY;
        
        this.penTip.position.set(penX, penY, 0.2);
        this.penLight.position.set(penX, penY, 1);

        // 笔尖脉动效果
        const pulse = 1 + Math.sin(this.params.time * 5) * 0.2;
        this.penGlow.scale.set(pulse, pulse, pulse);
    }

    /**
     * 更新波形
     */
    updateWaveform() {
        const penY = this.penTip.position.y;

        // 添加新点
        this.wavePoints.unshift(new THREE.Vector3(0, penY, 0));

        // 限制点数
        const maxPoints = 500;
        if (this.wavePoints.length > maxPoints) {
            this.wavePoints = this.wavePoints.slice(0, maxPoints);
        }

        // 更新点位置（向右滚动）
        const positions = [];
        this.wavePoints.forEach((point, i) => {
            const x = i * (this.params.waveWidth / maxPoints * 2);
            positions.push(x, point.y, 0);
        });

        // 更新波形线
        this.waveLine.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        this.waveLine.geometry.attributes.position.needsUpdate = true;

        // 更新发光层
        this.waveGlow.geometry.setAttribute(
            'position',
            new THREE.Float32BufferAttribute(positions, 3)
        );
        this.waveGlow.geometry.attributes.position.needsUpdate = true;
    }

    /**
     * 更新连接线
     */
    updateConnectLine() {
        const penX = this.penTip.position.x;
        const penY = this.penTip.position.y;
        const waveStartX = this.waveGroup.position.x;

        const linePositions = new Float32Array([
            penX, penY, 0.1,
            waveStartX, penY, 0.1
        ]);
        
        this.connectLine.geometry.setAttribute(
            'position',
            new THREE.BufferAttribute(linePositions, 3)
        );
        this.connectLine.geometry.attributes.position.needsUpdate = true;
        this.connectLine.computeLineDistances();
    }

    /**
     * 更新频谱动画
     */
    updateSpectrumAnimation() {
        if (!this.params.showSpectrum) return;

        this.spectrumBars.forEach((bar, index) => {
            // 频谱柱微动
            const wave = 1 + Math.sin(this.params.time * 3 + index) * 0.1;
            bar.scale.y = wave;
        });
    }

    /**
     * 更新显示（暂停时）
     */
    updateDisplay() {
        // 保持当前状态显示
    }

    /**
     * 鼠标移动处理
     */
    onMouseMove(event) {
        // 可扩展：鼠标悬停高亮效果
    }

    /**
     * 点击处理
     */
    onClick(event) {
        // 可扩展：点击交互
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
        // 清理主组
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

        // 清理星空
        if (this.starfield) {
            this.starfield.geometry.dispose();
            this.starfield.material.dispose();
            this.scene.remove(this.starfield);
        }

        // 清理灯光
        if (this.penLight) {
            this.scene.remove(this.penLight);
        }

        // 清理toast样式
        const style = document.querySelector('style[data-fourier]');
        if (style) style.remove();

        // 添加动画样式
        if (!document.querySelector('#fourier-animations')) {
            const animStyle = document.createElement('style');
            animStyle.id = 'fourier-animations';
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
