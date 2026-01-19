/**
 * 复利效应场景 - Compound Interest Visualization
 * ============================================
 * "世界第八大奇迹" - 爱因斯坦（据传）
 * 
 * 核心概念：
 * - 复利 vs 单利
 * - 72法则：本金翻倍年数 ≈ 72 / 年化利率%
 * - 时间的力量：早投资10年，结果差10倍
 * 
 * 公式：A = P(1 + r)^t
 * ============================================
 */
window.CompoundInterestScene = class CompoundInterestScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 参数
        this.params = {
            principal: 10000,      // 本金
            rate: 10,              // 年化利率 %
            years: 30,             // 投资年限
            showComparison: true   // 显示对比
        };

        // 3D柱状图
        this.compoundBars = [];
        this.simpleBars = [];

        // 状态
        this.isAnimating = false;
        this.currentYear = 0;

        // 颜色
        this.colors = {
            background: 0x0a1628,
            compound: 0x00ff88,
            compoundGlow: 0x00ffaa,
            simple: 0x4a90d9,
            simpleGlow: 0x6ab0ff,
            grid: 0x1a2a3a,
            milestone: 0xffd700,
            text: 0xffffff
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 20, y: 15, z: 35 };
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
        this.camera.lookAt(0, 5, 0);

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

        // 生成柱状图
        this.generateBars();
    }

    /**
     * 设置光照
     */
    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.6);
        directional.position.set(15, 25, 15);
        this.scene.add(directional);

        // 复利颜色灯光
        const greenLight = new THREE.PointLight(0x00ff88, 0.5, 50);
        greenLight.position.set(-10, 20, 0);
        this.scene.add(greenLight);

        // 单利颜色灯光
        const blueLight = new THREE.PointLight(0x4a90d9, 0.3, 50);
        blueLight.position.set(10, 15, 0);
        this.scene.add(blueLight);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建地面和网格
        this.createGround();

        // 创建坐标轴
        this.createAxes();

        // 创建图例
        this.createLegend();
    }

    /**
     * 创建地面
     */
    createGround() {
        const grid = new THREE.GridHelper(60, 30, this.colors.grid, this.colors.grid);
        grid.position.y = 0;
        grid.material.opacity = 0.3;
        grid.material.transparent = true;
        this.mainGroup.add(grid);
    }

    /**
     * 创建坐标轴
     */
    createAxes() {
        // X轴（时间）
        const xAxisGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, 0.1, 0),
            new THREE.Vector3(35, 0.1, 0)
        ]);
        const xAxisMat = new THREE.LineBasicMaterial({ color: 0x666666 });
        this.mainGroup.add(new THREE.Line(xAxisGeom, xAxisMat));

        // Y轴（金额）
        const yAxisGeom = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, 0, 0),
            new THREE.Vector3(-1, 30, 0)
        ]);
        const yAxisMat = new THREE.LineBasicMaterial({ color: 0x666666 });
        this.mainGroup.add(new THREE.Line(yAxisGeom, yAxisMat));
    }

    /**
     * 创建图例
     */
    createLegend() {
        // 使用3D几何体作为图例
        const legendGroup = new THREE.Group();
        legendGroup.position.set(-10, 25, 0);

        // 复利图例
        const compoundBox = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: this.colors.compound })
        );
        compoundBox.position.set(0, 0, 0);
        legendGroup.add(compoundBox);

        // 单利图例
        const simpleBox = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: this.colors.simple })
        );
        simpleBox.position.set(0, -2, 0);
        legendGroup.add(simpleBox);

        this.mainGroup.add(legendGroup);
    }

    /**
     * 生成柱状图
     */
    generateBars() {
        this.clearBars();

        const { principal, rate, years } = this.params;
        const barWidth = 0.8;
        const gap = 0.3;

        // 计算最大值用于缩放
        const maxCompound = principal * Math.pow(1 + rate / 100, years);
        const scaleFactor = 25 / maxCompound;  // 最高柱子25单位

        for (let y = 0; y <= years; y++) {
            // 复利计算
            const compoundValue = principal * Math.pow(1 + rate / 100, y);
            
            // 单利计算
            const simpleValue = principal * (1 + (rate / 100) * y);

            // 创建复利柱子
            const compoundHeight = compoundValue * scaleFactor;
            this.createBar(
                y * (barWidth * 2 + gap) - 0.5,
                compoundHeight,
                this.colors.compound,
                this.colors.compoundGlow,
                true,
                y,
                compoundValue
            );

            // 创建单利柱子
            if (this.params.showComparison) {
                const simpleHeight = simpleValue * scaleFactor;
                this.createBar(
                    y * (barWidth * 2 + gap) + barWidth,
                    simpleHeight,
                    this.colors.simple,
                    this.colors.simpleGlow,
                    false,
                    y,
                    simpleValue
                );
            }
        }

        this.updateInfoDisplay();
    }

    /**
     * 创建单个柱子
     */
    createBar(x, height, color, glowColor, isCompound, year, value) {
        const geometry = new THREE.BoxGeometry(0.7, height, 0.7);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            emissive: glowColor,
            emissiveIntensity: 0.2
        });

        const bar = new THREE.Mesh(geometry, material);
        bar.position.set(x, height / 2, 0);

        bar.userData = {
            isCompound,
            year,
            value,
            hoverTitle: isCompound ? `复利 第${year}年` : `单利 第${year}年`,
            hoverDesc: `金额: ¥${Math.round(value).toLocaleString()}`,
            onClick: () => this.showYearDetail(year, value, isCompound)
        };

        this.mainGroup.add(bar);

        if (isCompound) {
            this.compoundBars.push(bar);
        } else {
            this.simpleBars.push(bar);
        }

        this.interactables.push(bar);

        // 标记翻倍点
        if (isCompound) {
            const prevValue = year > 0 
                ? this.params.principal * Math.pow(1 + this.params.rate / 100, year - 1)
                : this.params.principal;
            
            // 检查是否是翻倍点
            const doublings = Math.floor(Math.log2(value / this.params.principal));
            const prevDoublings = Math.floor(Math.log2(prevValue / this.params.principal));
            
            if (doublings > prevDoublings && doublings >= 1) {
                this.addMilestoneMarker(bar, `${Math.pow(2, doublings)}x`);
            }
        }
    }

    /**
     * 添加里程碑标记
     */
    addMilestoneMarker(bar, label) {
        const markerGeom = new THREE.SphereGeometry(0.3, 8, 8);
        const markerMat = new THREE.MeshStandardMaterial({
            color: this.colors.milestone,
            emissive: this.colors.milestone,
            emissiveIntensity: 0.5
        });
        const marker = new THREE.Mesh(markerGeom, markerMat);
        marker.position.y = bar.geometry.parameters.height + 0.5;
        bar.add(marker);
    }

    /**
     * 清除柱子
     */
    clearBars() {
        [...this.compoundBars, ...this.simpleBars].forEach(bar => {
            this.mainGroup.remove(bar);
        });
        this.compoundBars = [];
        this.simpleBars = [];
        this.interactables = [];
    }

    /**
     * 动画展示增长
     */
    animateGrowth() {
        if (this.isAnimating) return;
        this.isAnimating = true;

        // 先隐藏所有柱子
        [...this.compoundBars, ...this.simpleBars].forEach(bar => {
            bar.scale.y = 0.01;
        });

        // 逐个显示
        this.currentYear = 0;
        this.growNextYear();
    }

    /**
     * 展示下一年
     */
    growNextYear() {
        if (this.currentYear > this.params.years) {
            this.isAnimating = false;
            this.showGuide('✨ 复利的威力！看看绿色（复利）和蓝色（单利）的差距！');
            return;
        }

        const compoundBar = this.compoundBars[this.currentYear];
        const simpleBar = this.simpleBars[this.currentYear];

        if (compoundBar && typeof gsap !== 'undefined') {
            gsap.to(compoundBar.scale, {
                y: 1,
                duration: 0.1,
                ease: 'power2.out'
            });
        }

        if (simpleBar && typeof gsap !== 'undefined') {
            gsap.to(simpleBar.scale, {
                y: 1,
                duration: 0.1,
                ease: 'power2.out'
            });
        }

        this.currentYear++;
        setTimeout(() => this.growNextYear(), 80);
    }

    /**
     * 显示年份详情
     */
    showYearDetail(year, value, isCompound) {
        const type = isCompound ? '复利' : '单利';
        const { principal, rate } = this.params;
        
        const interest = value - principal;
        const multiplier = (value / principal).toFixed(2);

        this.showGuide(
            `📊 ${type}第${year}年: ¥${Math.round(value).toLocaleString()} ` +
            `(${multiplier}x本金，赚取¥${Math.round(interest).toLocaleString()})`
        );
    }

    /**
     * 更新信息显示
     */
    updateInfoDisplay() {
        let panel = document.getElementById('compound-info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'compound-info-panel';
            panel.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(10, 20, 40, 0.95);
                border: 1px solid #00ff88;
                border-radius: 8px;
                padding: 16px;
                color: #fff;
                font-size: 14px;
                z-index: 100;
                min-width: 220px;
            `;
            document.getElementById('scene-canvas-container')?.appendChild(panel);
        }

        const { principal, rate, years } = this.params;
        const finalCompound = principal * Math.pow(1 + rate / 100, years);
        const finalSimple = principal * (1 + (rate / 100) * years);
        const rule72 = Math.round(72 / rate);

        panel.innerHTML = `
            <div style="color: #00ff88; font-size: 16px; margin-bottom: 12px;">
                <i class="fas fa-chart-line"></i> 复利计算器
            </div>
            
            <div style="background: rgba(0,0,0,0.3); padding: 10px; border-radius: 6px; margin-bottom: 12px;">
                <div style="color: #888; font-size: 12px;">本金</div>
                <div style="font-size: 18px;">¥${principal.toLocaleString()}</div>
            </div>
            
            <div style="display: flex; gap: 10px; margin-bottom: 12px;">
                <div style="flex: 1; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px;">
                    <div style="color: #888; font-size: 11px;">年化利率</div>
                    <div style="color: #4ecdc4;">${rate}%</div>
                </div>
                <div style="flex: 1; background: rgba(0,0,0,0.3); padding: 8px; border-radius: 4px;">
                    <div style="color: #888; font-size: 11px;">投资年限</div>
                    <div style="color: #4ecdc4;">${years}年</div>
                </div>
            </div>
            
            <div style="border-top: 1px solid #333; padding-top: 12px; margin-bottom: 12px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #00ff88;">复利终值:</span>
                    <span style="color: #00ff88; font-size: 16px;">¥${Math.round(finalCompound).toLocaleString()}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span style="color: #4a90d9;">单利终值:</span>
                    <span style="color: #4a90d9;">¥${Math.round(finalSimple).toLocaleString()}</span>
                </div>
            </div>
            
            <div style="background: rgba(0,255,136,0.1); padding: 10px; border-radius: 6px;">
                <div style="color: #ffd700; font-size: 12px;">
                    <i class="fas fa-lightbulb"></i> 72法则
                </div>
                <div style="font-size: 13px; margin-top: 4px;">
                    ${rate}%年化 → 约 <b>${rule72}年</b> 翻倍
                </div>
            </div>
            
            <div style="margin-top: 12px; font-size: 18px; text-align: center; color: #ffd700;">
                复利多赚 <b>¥${Math.round(finalCompound - finalSimple).toLocaleString()}</b>
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
            <button class="control-btn" id="btn-animate">
                <i class="fas fa-play"></i> 动画演示
            </button>
            <button class="control-btn" id="btn-adjust">
                <i class="fas fa-sliders-h"></i> 调整参数
            </button>
            <button class="control-btn" id="btn-72rule">
                <i class="fas fa-calculator"></i> 72法则
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
        document.getElementById('btn-animate').onclick = () => this.animateGrowth();
        document.getElementById('btn-adjust').onclick = () => this.showAdjustPanel();
        document.getElementById('btn-72rule').onclick = () => this.show72Rule();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }

    /**
     * 显示参数调整面板
     */
    showAdjustPanel() {
        let panel = document.getElementById('adjust-panel');
        if (panel) {
            panel.remove();
            return;
        }

        panel = document.createElement('div');
        panel.id = 'adjust-panel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(10, 20, 40, 0.98);
            border: 1px solid #00ff88;
            border-radius: 12px;
            padding: 24px;
            z-index: 1000;
            min-width: 320px;
        `;

        panel.innerHTML = `
            <h3 style="color: #00ff88; margin-bottom: 20px;">
                <i class="fas fa-sliders-h"></i> 调整参数
            </h3>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    本金: <span id="principal-val">¥${this.params.principal.toLocaleString()}</span>
                </label>
                <input type="range" id="param-principal" min="1000" max="100000" step="1000" 
                    value="${this.params.principal}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    年化利率: <span id="rate-val">${this.params.rate}%</span>
                </label>
                <input type="range" id="param-rate" min="1" max="30" step="1"
                    value="${this.params.rate}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    投资年限: <span id="years-val">${this.params.years}年</span>
                </label>
                <input type="range" id="param-years" min="5" max="50" step="5"
                    value="${this.params.years}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa;">
                    <input type="checkbox" id="param-comparison" 
                        ${this.params.showComparison ? 'checked' : ''}>
                    显示单利对比
                </label>
            </div>
            
            <button id="adjust-apply" style="width: 100%; padding: 12px; background: #00ff88; 
                border: none; color: #000; border-radius: 6px; cursor: pointer; font-weight: bold;">
                <i class="fas fa-check"></i> 应用
            </button>
            <button id="adjust-close" style="width: 100%; padding: 10px; background: #333;
                border: none; color: #fff; border-radius: 6px; cursor: pointer; margin-top: 8px;">
                关闭
            </button>
        `;

        document.body.appendChild(panel);

        // 绑定事件
        document.getElementById('param-principal').oninput = (e) => {
            document.getElementById('principal-val').textContent = '¥' + parseInt(e.target.value).toLocaleString();
        };
        document.getElementById('param-rate').oninput = (e) => {
            document.getElementById('rate-val').textContent = e.target.value + '%';
        };
        document.getElementById('param-years').oninput = (e) => {
            document.getElementById('years-val').textContent = e.target.value + '年';
        };
        document.getElementById('adjust-apply').onclick = () => {
            this.params.principal = parseInt(document.getElementById('param-principal').value);
            this.params.rate = parseInt(document.getElementById('param-rate').value);
            this.params.years = parseInt(document.getElementById('param-years').value);
            this.params.showComparison = document.getElementById('param-comparison').checked;
            this.generateBars();
            panel.remove();
        };
        document.getElementById('adjust-close').onclick = () => panel.remove();
    }

    /**
     * 显示72法则说明
     */
    show72Rule() {
        const { rate } = this.params;
        const doublingYears = Math.round(72 / rate);

        this.showGuide(
            `📐 72法则：翻倍年数 ≈ 72 ÷ 利率 = 72 ÷ ${rate} ≈ ${doublingYears}年\n` +
            `即 ${rate}% 年化，约 ${doublingYears} 年本金翻倍！`
        );
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
        this.camera.lookAt(0, 5, 0);
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
        guide.innerHTML = message.replace(/\n/g, '<br>');
        guide.style.cssText = `
            position: absolute;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 255, 136, 0.15);
            border: 1px solid rgba(0, 255, 136, 0.3);
            padding: 12px 24px;
            border-radius: 8px;
            color: #00ff88;
            font-size: 14px;
            z-index: 100;
            opacity: 0;
            transition: opacity 0.3s;
            max-width: 500px;
            text-align: center;
        `;
        container.appendChild(guide);

        setTimeout(() => guide.style.opacity = '1', 100);
        setTimeout(() => {
            guide.style.opacity = '0';
            setTimeout(() => guide.remove(), 300);
        }, 5000);
    }

    /**
     * 初始引导
     */
    showInitialGuide() {
        setTimeout(() => {
            this.showGuide('💰 复利效应："世界第八大奇迹"');
        }, 1000);
        setTimeout(() => {
            this.showGuide('💡 绿色=复利，蓝色=单利。点击"动画演示"看增长过程！');
        }, 5000);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        // 柱子轻微浮动
        this.compoundBars.forEach((bar, i) => {
            if (bar.scale.y > 0.5) {
                bar.position.y = bar.geometry.parameters.height / 2 + Math.sin(time * 0.002 + i * 0.3) * 0.05;
            }
        });
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
        this.clearBars();
        
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
        }

        // 移除UI元素
        ['compound-info-panel', 'adjust-panel'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.remove();
        });
    }

    /**
     * 背景点击处理
     */
    onBackgroundClick() {
        const adjustPanel = document.getElementById('adjust-panel');
        if (adjustPanel) adjustPanel.remove();
    }
};
