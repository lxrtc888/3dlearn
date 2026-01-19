/**
 * 羊群效应场景 - Herd Behavior / Conformity Experiment
 * ============================================
 * "为什么大多数人只是在跟随，不是在思考？"
 * 
 * 核心概念：
 * - 信息级联（Information Cascade）
 * - 从众心理（Conformity）
 * - Solomon Asch 从众实验（1951年）
 * 
 * 少数知情者 → 多数盲从 → 可能集体错误
 * ============================================
 */
window.HerdBehaviorScene = class HerdBehaviorScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 参数
        this.params = {
            totalPeople: 30,           // 总人数
            informedRatio: 0.15,       // 知情者比例
            conformityStrength: 0.7,   // 从众倾向强度
            decisionDelay: 300         // 决策延迟(ms)
        };

        // 状态
        this.people = [];
        this.peopleMeshes = [];
        this.isSimulating = false;
        this.currentStep = 0;

        // 正确方向（左=0，右=1）
        this.correctDirection = 0;  // 左边是正确的

        // 颜色
        this.colors = {
            background: 0x1a1a2e,
            ground: 0x2a2a4a,
            person: 0x4a90d9,
            informed: 0x00ff88,
            correct: 0x00ff88,
            wrong: 0xff6b6b,
            undecided: 0xaaaaaa,
            arrow: 0xffd700
        };

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

        // 背景
        this.scene.background = new THREE.Color(this.colors.background);
        this.scene.fog = new THREE.FogExp2(this.colors.background, 0.015);

        // 光照
        this.setupLights();

        // 创建场景
        this.setupScene();

        // 设置UI
        this.setupUI();

        // 初始引导
        this.showInitialGuide();

        // 初始化人群
        this.initPeople();
    }

    /**
     * 设置光照
     */
    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambient);

        const directional = new THREE.DirectionalLight(0xffffff, 0.6);
        directional.position.set(10, 20, 10);
        directional.castShadow = true;
        this.scene.add(directional);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建地面
        this.createGround();

        // 创建十字路口
        this.createCrossroad();

        // 创建方向指示
        this.createDirectionSigns();
    }

    /**
     * 创建地面
     */
    createGround() {
        const groundGeom = new THREE.PlaneGeometry(60, 60);
        const groundMat = new THREE.MeshStandardMaterial({
            color: this.colors.ground,
            roughness: 0.8
        });
        const ground = new THREE.Mesh(groundGeom, groundMat);
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -0.5;
        this.mainGroup.add(ground);

        // 网格
        const grid = new THREE.GridHelper(60, 30, 0x3a3a5a, 0x2a2a4a);
        grid.position.y = -0.4;
        this.mainGroup.add(grid);
    }

    /**
     * 创建十字路口
     */
    createCrossroad() {
        // 中心圆形区域
        const circleGeom = new THREE.CircleGeometry(8, 32);
        const circleMat = new THREE.MeshStandardMaterial({
            color: 0x3a3a5a,
            roughness: 0.6
        });
        const circle = new THREE.Mesh(circleGeom, circleMat);
        circle.rotation.x = -Math.PI / 2;
        circle.position.y = -0.3;
        this.mainGroup.add(circle);

        // 道路
        const roadGeom = new THREE.PlaneGeometry(6, 30);
        const roadMat = new THREE.MeshStandardMaterial({
            color: 0x333355,
            roughness: 0.7
        });

        // 左右道路
        const roadH = new THREE.Mesh(roadGeom, roadMat);
        roadH.rotation.x = -Math.PI / 2;
        roadH.rotation.z = Math.PI / 2;
        roadH.position.y = -0.35;
        this.mainGroup.add(roadH);
    }

    /**
     * 创建方向指示牌
     */
    createDirectionSigns() {
        // 左边（正确）
        this.createSign(-20, '← 正确出口', this.colors.correct);
        
        // 右边（错误）
        this.createSign(20, '错误方向 →', this.colors.wrong);

        // 问号标识在中央
        this.createQuestionMark();
    }

    /**
     * 创建指示牌
     */
    createSign(x, text, color) {
        // 牌子
        const signGeom = new THREE.BoxGeometry(8, 3, 0.3);
        const signMat = new THREE.MeshStandardMaterial({
            color: color,
            emissive: color,
            emissiveIntensity: 0.3
        });
        const sign = new THREE.Mesh(signGeom, signMat);
        sign.position.set(x, 5, 0);
        this.mainGroup.add(sign);

        // 柱子
        const poleGeom = new THREE.CylinderGeometry(0.2, 0.2, 5);
        const poleMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
        const pole = new THREE.Mesh(poleGeom, poleMat);
        pole.position.set(x, 2.5, 0);
        this.mainGroup.add(pole);
    }

    /**
     * 创建问号标记
     */
    createQuestionMark() {
        // 使用简单的3D对象表示"选择点"
        const geometry = new THREE.TorusGeometry(2, 0.3, 8, 24);
        const material = new THREE.MeshStandardMaterial({
            color: 0xffd700,
            emissive: 0xffd700,
            emissiveIntensity: 0.5
        });
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.5;
        this.mainGroup.add(ring);
        this.decisionRing = ring;
    }

    /**
     * 初始化人群
     */
    initPeople() {
        this.clearPeople();

        const { totalPeople, informedRatio } = this.params;
        const informedCount = Math.floor(totalPeople * informedRatio);

        for (let i = 0; i < totalPeople; i++) {
            const isInformed = i < informedCount;
            const person = {
                id: i,
                isInformed: isInformed,
                decision: null,  // null=未决定, 0=左, 1=右
                x: (Math.random() - 0.5) * 20,
                z: 15 + Math.random() * 5,  // 从后方开始
                hasDecided: false
            };

            this.people.push(person);
            this.createPersonMesh(person);
        }

        this.updateInfoDisplay();
    }

    /**
     * 创建人物模型
     */
    createPersonMesh(person) {
        const group = new THREE.Group();

        // 身体
        const bodyGeom = new THREE.CapsuleGeometry(0.4, 1, 4, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: person.isInformed ? this.colors.informed : this.colors.person
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 1;
        group.add(body);

        // 头
        const headGeom = new THREE.SphereGeometry(0.35, 8, 8);
        const headMat = new THREE.MeshStandardMaterial({
            color: person.isInformed ? this.colors.informed : this.colors.person
        });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 2;
        group.add(head);

        // 决策指示器（箭头，初始隐藏）
        const arrowGeom = new THREE.ConeGeometry(0.3, 0.6, 4);
        const arrowMat = new THREE.MeshStandardMaterial({
            color: this.colors.arrow,
            emissive: this.colors.arrow,
            emissiveIntensity: 0.5
        });
        const arrow = new THREE.Mesh(arrowGeom, arrowMat);
        arrow.rotation.z = Math.PI / 2;  // 指向右
        arrow.position.y = 2.8;
        arrow.visible = false;
        group.add(arrow);

        group.position.set(person.x, 0, person.z);
        group.userData = { 
            person, 
            body, 
            arrow,
            hoverTitle: person.isInformed ? '知情者' : '普通人',
            hoverDesc: person.isInformed ? '知道正确方向' : '需要观察他人决策'
        };

        this.mainGroup.add(group);
        this.peopleMeshes.push(group);
        this.interactables.push(group);
    }

    /**
     * 清除人群
     */
    clearPeople() {
        this.peopleMeshes.forEach(mesh => this.mainGroup.remove(mesh));
        this.people = [];
        this.peopleMeshes = [];
        this.interactables = [];
        this.currentStep = 0;
        this.isSimulating = false;
    }

    /**
     * 开始模拟
     */
    startSimulation() {
        if (this.isSimulating) return;
        this.isSimulating = true;

        // 重置所有人
        this.people.forEach(p => {
            p.decision = null;
            p.hasDecided = false;
        });

        this.peopleMeshes.forEach(mesh => {
            mesh.userData.arrow.visible = false;
            mesh.userData.body.material.color.setHex(
                mesh.userData.person.isInformed ? this.colors.informed : this.colors.person
            );
        });

        this.currentStep = 0;
        this.simulateStep();
    }

    /**
     * 模拟单步
     */
    simulateStep() {
        if (!this.isSimulating) return;

        const undecided = this.people.filter(p => !p.hasDecided);
        if (undecided.length === 0) {
            this.finishSimulation();
            return;
        }

        // 随机选择一个未决定的人
        const person = undecided[Math.floor(Math.random() * undecided.length)];
        const mesh = this.peopleMeshes[person.id];

        // 决策过程
        let decision;
        if (person.isInformed) {
            // 知情者知道正确答案
            decision = this.correctDirection;
        } else {
            // 普通人看周围已决策的人
            const decided = this.people.filter(p => p.hasDecided);
            if (decided.length === 0) {
                // 没人做决定，随机
                decision = Math.random() < 0.5 ? 0 : 1;
            } else {
                // 看多数人选什么
                const leftCount = decided.filter(p => p.decision === 0).length;
                const rightCount = decided.filter(p => p.decision === 1).length;

                const majorityDirection = leftCount >= rightCount ? 0 : 1;
                
                // 根据从众强度决定是否跟随
                if (Math.random() < this.params.conformityStrength) {
                    decision = majorityDirection;
                } else {
                    decision = Math.random() < 0.5 ? 0 : 1;
                }
            }
        }

        // 应用决策
        person.decision = decision;
        person.hasDecided = true;

        // 更新视觉
        this.updatePersonVisual(mesh, decision);
        this.movePersonToDecision(mesh, decision);

        this.currentStep++;
        this.updateInfoDisplay();

        // 继续下一步
        setTimeout(() => this.simulateStep(), this.params.decisionDelay);
    }

    /**
     * 更新人物视觉
     */
    updatePersonVisual(mesh, decision) {
        const arrow = mesh.userData.arrow;
        const body = mesh.userData.body;
        const isCorrect = decision === this.correctDirection;

        // 显示箭头
        arrow.visible = true;
        arrow.rotation.z = decision === 0 ? -Math.PI / 2 : Math.PI / 2;
        arrow.material.color.setHex(isCorrect ? this.colors.correct : this.colors.wrong);

        // 改变身体颜色
        body.material.color.setHex(isCorrect ? this.colors.correct : this.colors.wrong);

        // 动画
        if (typeof gsap !== 'undefined') {
            gsap.to(mesh.scale, {
                x: 1.2, y: 1.2, z: 1.2,
                duration: 0.15,
                yoyo: true,
                repeat: 1
            });
        }
    }

    /**
     * 移动人物到决策区域
     */
    movePersonToDecision(mesh, decision) {
        const targetX = decision === 0 ? -12 : 12;
        const targetZ = -5 + Math.random() * 5;

        if (typeof gsap !== 'undefined') {
            gsap.to(mesh.position, {
                x: targetX + (Math.random() - 0.5) * 4,
                z: targetZ,
                duration: 0.5,
                ease: 'power2.out'
            });
        } else {
            mesh.position.x = targetX;
            mesh.position.z = targetZ;
        }
    }

    /**
     * 完成模拟
     */
    finishSimulation() {
        this.isSimulating = false;

        const correctCount = this.people.filter(p => p.decision === this.correctDirection).length;
        const wrongCount = this.people.filter(p => p.decision !== this.correctDirection).length;
        const correctRatio = (correctCount / this.people.length * 100).toFixed(0);

        let message;
        if (correctRatio >= 80) {
            message = `✅ ${correctRatio}%的人做出了正确选择！知情者成功引导！`;
        } else if (correctRatio >= 50) {
            message = `⚠️ ${correctRatio}%正确 - 从众心理导致部分人选错`;
        } else {
            message = `❌ 只有${correctRatio}%正确！错误信息级联导致集体错误！`;
        }

        this.showGuide(message);
        this.updateInfoDisplay();
    }

    /**
     * 更新信息显示
     */
    updateInfoDisplay() {
        let panel = document.getElementById('herd-info-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'herd-info-panel';
            panel.style.cssText = `
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(10, 10, 30, 0.95);
                border: 1px solid #4a90d9;
                border-radius: 8px;
                padding: 16px;
                color: #fff;
                font-size: 14px;
                z-index: 100;
                min-width: 180px;
            `;
            document.getElementById('scene-canvas-container')?.appendChild(panel);
        }

        const decided = this.people.filter(p => p.hasDecided);
        const correctCount = decided.filter(p => p.decision === this.correctDirection).length;
        const wrongCount = decided.filter(p => p.decision !== this.correctDirection).length;
        const informedCount = this.people.filter(p => p.isInformed).length;

        panel.innerHTML = `
            <div style="color: #4a90d9; font-size: 16px; margin-bottom: 12px;">
                <i class="fas fa-users"></i> 羊群效应模拟
            </div>
            <div style="margin-bottom: 8px;">
                <span style="color: #888;">总人数:</span> 
                <span style="color: #fff;">${this.people.length}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <span style="color: #00ff88;">知情者:</span> 
                <span style="color: #00ff88;">${informedCount}</span>
            </div>
            <div style="margin-bottom: 8px;">
                <span style="color: #888;">已决策:</span> 
                <span style="color: #fff;">${decided.length}</span>
            </div>
            <hr style="border-color: #333; margin: 10px 0;">
            <div style="display: flex; justify-content: space-between;">
                <div>
                    <div style="color: #00ff88;">← 正确</div>
                    <div style="font-size: 20px; color: #00ff88;">${correctCount}</div>
                </div>
                <div>
                    <div style="color: #ff6b6b;">错误 →</div>
                    <div style="font-size: 20px; color: #ff6b6b;">${wrongCount}</div>
                </div>
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
            <button class="control-btn" id="btn-start">
                <i class="fas fa-play"></i> 开始模拟
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-adjust">
                <i class="fas fa-sliders-h"></i> 调整参数
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
        document.getElementById('btn-start').onclick = () => {
            if (!this.isSimulating) {
                this.startSimulation();
            }
        };
        document.getElementById('btn-reset').onclick = () => {
            this.initPeople();
            this.showGuide('🔄 已重置人群，点击"开始模拟"');
        };
        document.getElementById('btn-adjust').onclick = () => this.showAdjustPanel();
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
            background: rgba(10, 10, 30, 0.95);
            border: 1px solid #4a90d9;
            border-radius: 12px;
            padding: 24px;
            z-index: 1000;
            min-width: 300px;
        `;

        panel.innerHTML = `
            <h3 style="color: #4a90d9; margin-bottom: 20px;">
                <i class="fas fa-sliders-h"></i> 调整参数
            </h3>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    知情者比例: <span id="informed-val">${(this.params.informedRatio * 100).toFixed(0)}%</span>
                </label>
                <input type="range" id="param-informed" min="0" max="50" step="5" 
                    value="${this.params.informedRatio * 100}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    从众倾向: <span id="conform-val">${(this.params.conformityStrength * 100).toFixed(0)}%</span>
                </label>
                <input type="range" id="param-conform" min="0" max="100" step="10"
                    value="${this.params.conformityStrength * 100}" style="width: 100%;">
            </div>
            
            <div style="margin-bottom: 16px;">
                <label style="color: #aaa; display: block; margin-bottom: 6px;">
                    总人数: <span id="total-val">${this.params.totalPeople}</span>
                </label>
                <input type="range" id="param-total" min="10" max="50" step="5"
                    value="${this.params.totalPeople}" style="width: 100%;">
            </div>
            
            <button id="adjust-apply" style="width: 100%; padding: 10px; background: #4a90d9; 
                border: none; color: #fff; border-radius: 6px; cursor: pointer; margin-top: 10px;">
                <i class="fas fa-check"></i> 应用并重置
            </button>
            <button id="adjust-close" style="width: 100%; padding: 10px; background: #333;
                border: none; color: #fff; border-radius: 6px; cursor: pointer; margin-top: 8px;">
                关闭
            </button>
        `;

        document.body.appendChild(panel);

        // 绑定事件
        document.getElementById('param-informed').oninput = (e) => {
            document.getElementById('informed-val').textContent = e.target.value + '%';
        };
        document.getElementById('param-conform').oninput = (e) => {
            document.getElementById('conform-val').textContent = e.target.value + '%';
        };
        document.getElementById('param-total').oninput = (e) => {
            document.getElementById('total-val').textContent = e.target.value;
        };
        document.getElementById('adjust-apply').onclick = () => {
            this.params.informedRatio = document.getElementById('param-informed').value / 100;
            this.params.conformityStrength = document.getElementById('param-conform').value / 100;
            this.params.totalPeople = parseInt(document.getElementById('param-total').value);
            this.initPeople();
            panel.remove();
            this.showGuide('✨ 参数已更新，点击"开始模拟"');
        };
        document.getElementById('adjust-close').onclick = () => panel.remove();
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
            max-width: 400px;
            text-align: center;
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
            this.showGuide('🐑 羊群效应：少数知情者 vs 多数盲从');
        }, 1000);
        setTimeout(() => {
            this.showGuide('💡 绿色是知情者（知道正确答案），蓝色是普通人（会观察他人）');
        }, 5000);
    }

    /**
     * 动画更新
     */
    animate(time, delta) {
        // 决策环旋转
        if (this.decisionRing) {
            this.decisionRing.rotation.z += 0.01;
        }

        // 人物轻微晃动
        this.peopleMeshes.forEach((mesh, i) => {
            if (!mesh.userData.person.hasDecided) {
                const t = time * 0.002 + i;
                mesh.position.y = Math.sin(t) * 0.1;
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
        this.clearPeople();
        
        if (this.mainGroup) {
            this.scene.remove(this.mainGroup);
        }

        // 移除UI元素
        ['herd-info-panel', 'adjust-panel'].forEach(id => {
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
