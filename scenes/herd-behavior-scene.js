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
        const personColor = person.isInformed ? this.colors.informed : this.colors.person;

        // 身体 - 使用圆柱体代替CapsuleGeometry（r128版本不支持Capsule）
        const bodyGeom = new THREE.CylinderGeometry(0.35, 0.4, 1.2, 8);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: personColor,
            emissive: personColor,
            emissiveIntensity: person.isInformed ? 0.3 : 0.1
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.position.y = 0.8;
        group.add(body);

        // 头
        const headGeom = new THREE.SphereGeometry(0.35, 12, 12);
        const headMat = new THREE.MeshStandardMaterial({
            color: personColor,
            emissive: personColor,
            emissiveIntensity: person.isInformed ? 0.3 : 0.1
        });
        const head = new THREE.Mesh(headGeom, headMat);
        head.position.y = 1.7;
        group.add(head);
        
        // 知情者头顶光环
        if (person.isInformed) {
            const haloGeom = new THREE.TorusGeometry(0.45, 0.06, 8, 16);
            const haloMat = new THREE.MeshStandardMaterial({
                color: 0xffd700,
                emissive: 0xffd700,
                emissiveIntensity: 0.8
            });
            const halo = new THREE.Mesh(haloGeom, haloMat);
            halo.rotation.x = Math.PI / 2;
            halo.position.y = 2.2;
            group.add(halo);
        }

        // 决策指示器（箭头，初始隐藏）
        const arrowGeom = new THREE.ConeGeometry(0.3, 0.6, 6);
        const arrowMat = new THREE.MeshStandardMaterial({
            color: this.colors.arrow,
            emissive: this.colors.arrow,
            emissiveIntensity: 0.5
        });
        const arrow = new THREE.Mesh(arrowGeom, arrowMat);
        arrow.rotation.z = Math.PI / 2;  // 指向右
        arrow.position.y = 2.5;
        arrow.visible = false;
        group.add(arrow);

        group.position.set(person.x, 0, person.z);
        group.userData = { 
            person, 
            body,
            head,
            arrow,
            hoverTitle: person.isInformed ? '🌟 知情者' : '👤 普通人',
            hoverDesc: person.isInformed ? '知道正确方向（左边）' : '会观察他人决策后跟随'
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
            const personColor = mesh.userData.person.isInformed ? this.colors.informed : this.colors.person;
            mesh.userData.arrow.visible = false;
            mesh.userData.body.material.color.setHex(personColor);
            mesh.userData.body.material.emissive.setHex(personColor);
            if (mesh.userData.head) {
                mesh.userData.head.material.color.setHex(personColor);
                mesh.userData.head.material.emissive.setHex(personColor);
            }
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
        const head = mesh.userData.head;
        const isCorrect = decision === this.correctDirection;
        const resultColor = isCorrect ? this.colors.correct : this.colors.wrong;

        // 显示箭头
        arrow.visible = true;
        arrow.rotation.z = decision === 0 ? -Math.PI / 2 : Math.PI / 2;
        arrow.material.color.setHex(resultColor);
        arrow.material.emissive.setHex(resultColor);

        // 改变身体和头部颜色
        body.material.color.setHex(resultColor);
        body.material.emissive.setHex(resultColor);
        body.material.emissiveIntensity = 0.3;
        
        if (head) {
            head.material.color.setHex(resultColor);
            head.material.emissive.setHex(resultColor);
            head.material.emissiveIntensity = 0.3;
        }

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
                background: rgba(10, 15, 30, 0.95);
                border: 1px solid rgba(74, 144, 217, 0.4);
                border-radius: 12px;
                padding: 18px;
                color: #fff;
                font-size: 14px;
                z-index: 100;
                min-width: 200px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
            `;
            document.getElementById('scene-canvas-container')?.appendChild(panel);
        }

        const decided = this.people.filter(p => p.hasDecided);
        const correctCount = decided.filter(p => p.decision === this.correctDirection).length;
        const wrongCount = decided.filter(p => p.decision !== this.correctDirection).length;
        const informedCount = this.people.filter(p => p.isInformed).length;
        const correctRatio = decided.length > 0 ? (correctCount / decided.length * 100).toFixed(0) : '--';

        panel.innerHTML = `
            <div style="color: #4a90d9; font-size: 16px; margin-bottom: 14px; font-weight: bold;">
                <i class="fas fa-chart-pie"></i> 实时数据
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px;">
                <div style="background: rgba(255,255,255,0.05); padding: 10px; border-radius: 8px; text-align: center;">
                    <div style="color: #888; font-size: 12px;">总人数</div>
                    <div style="font-size: 22px; color: #fff;">${this.people.length}</div>
                </div>
                <div style="background: rgba(0,255,136,0.1); padding: 10px; border-radius: 8px; text-align: center;">
                    <div style="color: #00ff88; font-size: 12px;">知情者</div>
                    <div style="font-size: 22px; color: #00ff88;">${informedCount}</div>
                </div>
            </div>
            
            <div style="background: rgba(255,215,0,0.1); padding: 10px; border-radius: 8px; text-align: center; margin-bottom: 14px;">
                <div style="color: #ffd700; font-size: 12px;">从众倾向</div>
                <div style="font-size: 18px; color: #ffd700;">${(this.params.conformityStrength * 100).toFixed(0)}%</div>
            </div>
            
            <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 14px;">
                <div style="color: #888; font-size: 12px; margin-bottom: 8px;">决策结果 (${decided.length}/${this.people.length})</div>
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="text-align: center;">
                        <div style="color: #00ff88; font-size: 12px;">← 正确</div>
                        <div style="font-size: 26px; color: #00ff88; font-weight: bold;">${correctCount}</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #aaa; font-size: 11px;">正确率</div>
                        <div style="font-size: 18px; color: ${parseInt(correctRatio) >= 70 ? '#00ff88' : parseInt(correctRatio) >= 50 ? '#ffd700' : '#ff6b6b'}; font-weight: bold;">${correctRatio}%</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="color: #ff6b6b; font-size: 12px;">错误 →</div>
                        <div style="font-size: 26px; color: #ff6b6b; font-weight: bold;">${wrongCount}</div>
                    </div>
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
            <button class="control-btn active" id="btn-start">
                <i class="fas fa-play"></i> 开始模拟
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-more-informed">
                <i class="fas fa-user-plus"></i> 增加知情者
            </button>
            <button class="control-btn" id="btn-less-informed">
                <i class="fas fa-user-minus"></i> 减少知情者
            </button>
            <button class="control-btn" id="btn-less-conform">
                <i class="fas fa-brain"></i> 降低从众
            </button>
            <button class="control-btn" id="btn-more-conform">
                <i class="fas fa-users"></i> 增加从众
            </button>
            <button class="control-btn" id="btn-guide">
                <i class="fas fa-question-circle"></i> 原理说明
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;

        this.bindUIEvents();
        
        // 创建教学引导面板
        this.createTeachingPanel();
    }

    /**
     * 绑定UI事件
     */
    bindUIEvents() {
        document.getElementById('btn-start').onclick = () => {
            if (!this.isSimulating) {
                this.startSimulation();
                this.showGuide('🚀 模拟开始！观察绿色知情者如何影响蓝色普通人的决策...');
            }
        };
        document.getElementById('btn-reset').onclick = () => {
            this.initPeople();
            this.showGuide('🔄 已重置人群，点击"开始模拟"观察从众效应');
        };
        document.getElementById('btn-more-informed').onclick = () => {
            this.params.informedRatio = Math.min(0.5, this.params.informedRatio + 0.1);
            this.initPeople();
            this.showGuide(`✅ 知情者比例增加到 ${(this.params.informedRatio * 100).toFixed(0)}%`);
        };
        document.getElementById('btn-less-informed').onclick = () => {
            this.params.informedRatio = Math.max(0.05, this.params.informedRatio - 0.1);
            this.initPeople();
            this.showGuide(`⚠️ 知情者比例降低到 ${(this.params.informedRatio * 100).toFixed(0)}%`);
        };
        document.getElementById('btn-less-conform').onclick = () => {
            this.params.conformityStrength = Math.max(0.1, this.params.conformityStrength - 0.15);
            this.initPeople();
            this.showGuide(`✅ 从众倾向降低到 ${(this.params.conformityStrength * 100).toFixed(0)}%，人们更独立思考`);
        };
        document.getElementById('btn-more-conform').onclick = () => {
            this.params.conformityStrength = Math.min(1.0, this.params.conformityStrength + 0.15);
            this.initPeople();
            this.showGuide(`⚠️ 从众倾向增加到 ${(this.params.conformityStrength * 100).toFixed(0)}%，人们更容易跟风`);
        };
        document.getElementById('btn-guide').onclick = () => this.toggleTeachingPanel();
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
    }
    
    /**
     * 创建教学引导面板
     */
    createTeachingPanel() {
        let panel = document.getElementById('herd-teaching-panel');
        if (panel) return;
        
        panel = document.createElement('div');
        panel.id = 'herd-teaching-panel';
        panel.style.cssText = `
            position: absolute;
            left: 20px;
            top: 80px;
            width: 320px;
            background: rgba(10, 15, 30, 0.95);
            border: 1px solid rgba(74, 144, 217, 0.4);
            border-radius: 12px;
            padding: 20px;
            color: #fff;
            font-size: 14px;
            z-index: 100;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <div style="color: #4a90d9; font-size: 18px; font-weight: bold;">
                    <i class="fas fa-users"></i> 羊群效应
                </div>
                <button id="close-teaching" style="background: none; border: none; color: #888; cursor: pointer; font-size: 16px;">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div style="background: rgba(74, 144, 217, 0.1); border-radius: 8px; padding: 12px; margin-bottom: 16px;">
                <div style="color: #ffd700; font-size: 13px; margin-bottom: 8px;">
                    <i class="fas fa-lightbulb"></i> 核心问题
                </div>
                <div style="color: #e0e0e0; line-height: 1.6;">
                    为什么大多数人不是在"思考"，而是在"跟随"？
                </div>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="color: #00ff88; font-size: 13px; margin-bottom: 8px;">
                    <i class="fas fa-user-check"></i> 场景说明
                </div>
                <ul style="color: #aaa; line-height: 1.8; padding-left: 18px; margin: 0;">
                    <li><span style="color: #00ff88;">绿色小人</span> = 知情者（知道正确出口）</li>
                    <li><span style="color: #4a90d9;">蓝色小人</span> = 普通人（会观察他人决策）</li>
                    <li><span style="color: #00ff88;">左边</span> = 正确出口</li>
                    <li><span style="color: #ff6b6b;">右边</span> = 错误方向</li>
                </ul>
            </div>
            
            <div style="margin-bottom: 16px;">
                <div style="color: #ff6b6b; font-size: 13px; margin-bottom: 8px;">
                    <i class="fas fa-exclamation-triangle"></i> 关键洞察
                </div>
                <div style="color: #aaa; line-height: 1.6;">
                    当知情者太少或从众倾向太强时，<span style="color: #ff6b6b;">错误信息会像多米诺骨牌一样传播</span>，导致大多数人选择错误方向！
                </div>
            </div>
            
            <div style="background: rgba(255, 215, 0, 0.1); border-radius: 8px; padding: 12px;">
                <div style="color: #ffd700; font-size: 13px; margin-bottom: 6px;">
                    <i class="fas fa-flask"></i> 试一试
                </div>
                <ol style="color: #ccc; line-height: 1.8; padding-left: 18px; margin: 0; font-size: 13px;">
                    <li>点击 <b>"开始模拟"</b> 观察决策过程</li>
                    <li>点击 <b>"增加知情者"</b> 看正确率如何提升</li>
                    <li>点击 <b>"降低从众"</b> 看独立思考的影响</li>
                </ol>
            </div>
        `;
        
        document.getElementById('scene-canvas-container')?.appendChild(panel);
        
        // 关闭按钮
        document.getElementById('close-teaching').onclick = () => {
            panel.style.display = 'none';
        };
    }
    
    /**
     * 切换教学面板显示
     */
    toggleTeachingPanel() {
        const panel = document.getElementById('herd-teaching-panel');
        if (panel) {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        }
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
            this.showGuide('👀 观察：绿色知情者知道"左边是正确出口"，蓝色普通人会跟随多数');
        }, 800);
        setTimeout(() => {
            this.showGuide('👆 点击"开始模拟"按钮，观察从众心理如何影响群体决策！');
        }, 4500);
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
        ['herd-info-panel', 'herd-teaching-panel'].forEach(id => {
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
