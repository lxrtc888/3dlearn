/**
 * 物理学习闭环模板场景
 * 串并联电路与欧姆定律（U=IR）
 */
window.CircuitOhmScene = class CircuitOhmScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.sceneId = 'circuit-ohm';
        this.mainGroup = null;
        this.interactables = [];
        this.blackboardEl = null;
        this.quizEl = null;
        this.summaryEl = null;
        this.currentStep = 0;

        this.state = {
            mode: 'series', // series | parallel
            resistance1: 6,
            resistance2: 6,
            voltage: 12
        };

        this.components = {
            battery: null,
            resistor1: null,
            resistor2: null,
            bulb1: null,
            bulb2: null
        };

        this.flowCurves = [];
        this.flowParticles = [];
        this.directionArrows = [];
        this.flowTick = 0;
        this.demoState = null;
        this.lastCalc = null;

        this.defaultCameraPos = { x: 0, y: 2.5, z: 18 };
        this.lightBulbs = [];
    }

    init() {
        this.scene.background = new THREE.Color(0x0b1020);
        this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z);
        this.camera.lookAt(0, 0, 0);

        this.setupLights();
        this.setupScene();
        this.setupUI();

        if (window.LearningEngine) {
            window.LearningEngine.createSession(this.sceneId);
            window.LearningEngine.completeStep(this.sceneId, 'read');
            window.LearningEngine.logEvent(this.sceneId, 'scene_enter', {});
        }
        this.showGuide('⚡ 先切换串/并联，再调节电阻，观察电流与亮度变化');
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        const directional = new THREE.DirectionalLight(0xa5b4fc, 0.7);
        directional.position.set(6, 10, 8);
        this.scene.add(ambient, directional);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
        grid.rotation.x = Math.PI / 2;
        grid.position.z = -0.25;
        this.mainGroup.add(grid);
        this.renderCircuit();
    }

    renderCircuit() {
        while (this.mainGroup.children.length > 1) {
            const obj = this.mainGroup.children[this.mainGroup.children.length - 1];
            this.mainGroup.remove(obj);
        }
        this.flowCurves = [];
        this.flowParticles = [];
        this.directionArrows = [];
        this.lightBulbs = [];
        this.components = { battery: null, resistor1: null, resistor2: null, bulb1: null, bulb2: null };

        const board = new THREE.Mesh(
            new THREE.BoxGeometry(12, 6, 0.4),
            new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.2, roughness: 0.8 })
        );
        board.position.z = -0.25;
        this.mainGroup.add(board);

        const battery = new THREE.Mesh(
            new THREE.BoxGeometry(1.5, 3.2, 1),
            new THREE.MeshStandardMaterial({ color: 0x475569 })
        );
        battery.position.set(-4.6, 0, 0.5);
        battery.userData = {
            hoverTitle: '电源',
            hoverDesc: `电压: ${this.state.voltage}V`,
            hoverIcon: 'fa-bolt',
            name: '电源',
            description: `<p>电源电压：<b>${this.state.voltage} V</b></p><p>在本场景中保持恒定。</p>`
        };
        this.mainGroup.add(battery);
        this.components.battery = battery;
        this.interactables = [battery];

        const r1 = this.createResistor(0xeab308, this.state.resistance1, 'R1');
        const r2 = this.createResistor(0xf97316, this.state.resistance2, 'R2');
        const bulb1 = this.createBulb('L1');
        const bulb2 = this.createBulb('L2');

        if (this.state.mode === 'series') {
            r1.position.set(-1.6, 1.1, 0.5);
            r2.position.set(1.8, 1.1, 0.5);
            bulb1.position.set(-1.6, -1.2, 0.5);
            bulb2.position.set(1.8, -1.2, 0.5);
        } else {
            r1.position.set(-0.4, 1.4, 0.5);
            r2.position.set(-0.4, -1.4, 0.5);
            bulb1.position.set(2.8, 1.4, 0.5);
            bulb2.position.set(2.8, -1.4, 0.5);
        }

        this.mainGroup.add(r1, r2, bulb1, bulb2);
        this.components.resistor1 = r1;
        this.components.resistor2 = r2;
        this.components.bulb1 = bulb1;
        this.components.bulb2 = bulb2;
        this.lightBulbs.push(bulb1, bulb2);

        this.buildWireTopology();
        this.updateCalculatedValues();
    }

    buildWireTopology() {
        const p = {
            batteryPos: new THREE.Vector3(-4.6, 1.2, 0.8),
            batteryNeg: new THREE.Vector3(-4.6, -1.2, 0.8),
            nodeA: new THREE.Vector3(-2.8, 1.8, 0.8),
            nodeB: new THREE.Vector3(4.2, 1.8, 0.8),
            nodeC: new THREE.Vector3(4.2, -1.8, 0.8),
            nodeD: new THREE.Vector3(-2.8, -1.8, 0.8)
        };

        // 电源端子可视化
        this.addJunction(p.batteryPos, 0x22c55e, '+');
        this.addJunction(p.batteryNeg, 0xef4444, '-');

        if (this.state.mode === 'series') {
            const path = [
                p.batteryPos,
                new THREE.Vector3(-2.4, 1.8, 0.8),
                this.components.resistor1.position.clone().add(new THREE.Vector3(0, 0.7, 0.3)),
                this.components.resistor2.position.clone().add(new THREE.Vector3(0, 0.7, 0.3)),
                p.nodeB,
                new THREE.Vector3(4.2, -0.8, 0.8),
                this.components.bulb2.position.clone(),
                this.components.bulb1.position.clone(),
                p.nodeD,
                p.batteryNeg
            ];
            this.addWire(path, 0x60a5fa, 1.0);
            this.addDirectionArrow(path, 0x38bdf8);
        } else {
            // 并联主干
            const leftBus = [p.batteryPos, p.nodeA, p.nodeD, p.batteryNeg];
            const rightBus = [p.nodeB, p.nodeC];
            this.addWire(leftBus, 0x64748b, 0.7);
            this.addWire(rightBus, 0x64748b, 0.7);

            // 上支路
            const topBranch = [
                p.nodeA,
                this.components.resistor1.position.clone().add(new THREE.Vector3(0, 0, 0.3)),
                this.components.bulb1.position.clone(),
                p.nodeB
            ];
            // 下支路
            const bottomBranch = [
                p.nodeD,
                this.components.resistor2.position.clone().add(new THREE.Vector3(0, 0, 0.3)),
                this.components.bulb2.position.clone(),
                p.nodeC
            ];
            this.addWire(topBranch, 0x22d3ee, 0.9);
            this.addWire(bottomBranch, 0xf59e0b, 0.9);
            this.addDirectionArrow(topBranch, 0x22d3ee);
            this.addDirectionArrow(bottomBranch, 0xf59e0b);
        }
    }

    addJunction(position, color, label) {
        const node = new THREE.Mesh(
            new THREE.SphereGeometry(0.12, 12, 12),
            new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.35 })
        );
        node.position.copy(position);
        this.mainGroup.add(node);

        const sprite = this.createTextSprite(label, color);
        sprite.position.copy(position.clone().add(new THREE.Vector3(0, 0.35, 0)));
        this.mainGroup.add(sprite);
    }

    createTextSprite(text, color = 0xffffff) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.font = 'bold 36px Arial';
            ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(text, 64, 32);
        }
        const tex = new THREE.CanvasTexture(canvas);
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
        sprite.scale.set(0.8, 0.4, 1);
        return sprite;
    }

    addWire(points, color, intensity = 1) {
        const curve = new THREE.CatmullRomCurve3(points);
        const geometry = new THREE.TubeGeometry(curve, 80, 0.06, 8, false);
        const material = new THREE.MeshStandardMaterial({
            color,
            emissive: color,
            emissiveIntensity: 0.2 * intensity,
            metalness: 0.3,
            roughness: 0.4
        });
        const tube = new THREE.Mesh(geometry, material);
        this.mainGroup.add(tube);

        this.flowCurves.push({ curve, intensity });
        this.createFlowParticles(curve, color, intensity);
    }

    createFlowParticles(curve, color, intensity) {
        const particles = [];
        const count = 10;
        for (let i = 0; i < count; i += 1) {
            const p = new THREE.Mesh(
                new THREE.SphereGeometry(0.045, 10, 10),
                new THREE.MeshStandardMaterial({
                    color,
                    emissive: color,
                    emissiveIntensity: 0.8 * intensity
                })
            );
            p.userData = {
                offset: i / count,
                speed: 0.08 * intensity
            };
            this.mainGroup.add(p);
            particles.push(p);
        }
        this.flowParticles.push({ curve, particles });
    }

    addDirectionArrow(points, color) {
        if (points.length < 2) return;
        const mid = Math.floor(points.length / 2);
        const from = points[Math.max(0, mid - 1)];
        const to = points[mid];
        const dir = to.clone().sub(from).normalize();
        const arrow = new THREE.ArrowHelper(dir, from.clone(), 0.9, color, 0.2, 0.12);
        this.mainGroup.add(arrow);
        this.directionArrows.push(arrow);
    }

    createResistor(color, resistance, name) {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1.6, 0.5, 0.5),
            new THREE.MeshStandardMaterial({ color })
        );
        mesh.userData = {
            hoverTitle: `${name} 电阻`,
            hoverDesc: `${resistance}Ω`,
            hoverIcon: 'fa-sliders-h',
            name: `${name} 电阻`,
            description: `<p>${name} = <b>${resistance} Ω</b></p><p>调节电阻观察电流变化。</p>`
        };
        this.interactables.push(mesh);
        return mesh;
    }

    createBulb(name) {
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.45, 24, 24),
            new THREE.MeshStandardMaterial({ color: 0x9ca3af, emissive: 0x000000, emissiveIntensity: 0 })
        );
        mesh.userData = {
            hoverTitle: `${name} 灯泡`,
            hoverDesc: '亮度与功率相关',
            hoverIcon: 'fa-lightbulb',
            name: `${name} 灯泡`,
            description: `<p>${name} 亮度由电流与功率决定。</p>`
        };
        this.interactables.push(mesh);
        return mesh;
    }

    getEquivalentResistance() {
        const { resistance1: r1, resistance2: r2, mode } = this.state;
        if (mode === 'series') return r1 + r2;
        return 1 / (1 / r1 + 1 / r2);
    }

    calculateCircuitMetrics() {
        const { resistance1: r1, resistance2: r2, voltage: u, mode } = this.state;
        const req = this.getEquivalentResistance();

        if (mode === 'series') {
            const i = u / req;
            return {
                req,
                totalCurrent: i,
                branchCurrent1: i,
                branchCurrent2: i,
                power1: i * i * r1,
                power2: i * i * r2,
                voltage1: i * r1,
                voltage2: i * r2
            };
        }

        const i1 = u / r1;
        const i2 = u / r2;
        return {
            req,
            totalCurrent: i1 + i2,
            branchCurrent1: i1,
            branchCurrent2: i2,
            power1: u * i1,
            power2: u * i2,
            voltage1: u,
            voltage2: u
        };
    }

    updateCalculatedValues() {
        const metrics = this.calculateCircuitMetrics();
        this.lastCalc = metrics;
        const brightness1 = Math.min(Math.max(metrics.power1 / 12, 0.08), 1);
        const brightness2 = Math.min(Math.max(metrics.power2 / 12, 0.08), 1);

        if (this.lightBulbs[0]) {
            this.lightBulbs[0].material.emissive = new THREE.Color(0xfacc15);
            this.lightBulbs[0].material.emissiveIntensity = brightness1;
        }
        if (this.lightBulbs[1]) {
            this.lightBulbs[1].material.emissive = new THREE.Color(0xfacc15);
            this.lightBulbs[1].material.emissiveIntensity = brightness2;
        }

        const panel = document.getElementById('qf-physics-stats');
        if (panel) {
            panel.innerHTML = `
                <span>模式: <b>${this.state.mode === 'series' ? '串联' : '并联'}</b></span>
                <span>Req: <b>${metrics.req.toFixed(2)} Ω</b></span>
                <span>I总: <b>${metrics.totalCurrent.toFixed(2)} A</b></span>
                <span>I1/I2: <b>${metrics.branchCurrent1.toFixed(2)} / ${metrics.branchCurrent2.toFixed(2)} A</b></span>
                <span>V1/V2: <b>${metrics.voltage1.toFixed(2)} / ${metrics.voltage2.toFixed(2)} V</b></span>
                <span>方向: <b>+ 极 → 负载 → - 极</b></span>
            `;
        }
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; max-width:100%;">
                <button class="control-btn" id="co-mode-series"><i class="fas fa-link"></i> 串联</button>
                <button class="control-btn" id="co-mode-parallel"><i class="fas fa-code-branch"></i> 并联</button>
                <label class="control-btn" style="display:flex; gap:6px; align-items:center;">R1
                    <input id="co-r1" type="range" min="1" max="20" step="1" value="${this.state.resistance1}">
                </label>
                <label class="control-btn" style="display:flex; gap:6px; align-items:center;">R2
                    <input id="co-r2" type="range" min="1" max="20" step="1" value="${this.state.resistance2}">
                </label>
                <button class="control-btn" id="co-guide"><i class="fas fa-chalkboard"></i> 步骤讲解</button>
                <button class="control-btn" id="co-demo-flow"><i class="fas fa-wave-square"></i> 电流演示</button>
                <button class="control-btn" id="co-quiz"><i class="fas fa-list-check"></i> 开始练习</button>
                <button class="control-btn" id="co-summary"><i class="fas fa-chart-line"></i> 学习总结</button>
                <button class="control-btn" id="co-reset"><i class="fas fa-redo"></i> 重置</button>
                <button class="control-btn" id="co-view"><i class="fas fa-video"></i> 重置视角</button>
            </div>
            <div id="qf-physics-stats" style="display:flex; gap:12px; color:#cbd5e1; margin-top:8px; flex-wrap:wrap;"></div>
        `;

        document.getElementById('co-mode-series').onclick = () => this.switchMode('series');
        document.getElementById('co-mode-parallel').onclick = () => this.switchMode('parallel');
        document.getElementById('co-r1').oninput = (e) => this.updateResistance('resistance1', Number(e.target.value));
        document.getElementById('co-r2').oninput = (e) => this.updateResistance('resistance2', Number(e.target.value));
        document.getElementById('co-guide').onclick = () => this.showStepGuide();
        document.getElementById('co-demo-flow').onclick = () => this.runCurrentDirectionDemo();
        document.getElementById('co-quiz').onclick = () => this.showQuizPanel();
        document.getElementById('co-summary').onclick = () => this.showSummaryCard();
        document.getElementById('co-reset').onclick = () => this.reset();
        document.getElementById('co-view').onclick = () => this.resetView();

        this.updateCalculatedValues();
    }

    switchMode(mode) {
        this.state.mode = mode;
        this.renderCircuit();
        window.LearningEngine?.recordExplore(this.sceneId, `mode-${mode}`);
        window.LearningEngine?.completeStep(this.sceneId, mode === 'series' ? 'observe-series' : 'observe-parallel');
    }

    updateResistance(key, value) {
        this.state[key] = value;
        this.renderCircuit();
        window.LearningEngine?.recordExplore(this.sceneId, key);
        window.LearningEngine?.completeStep(this.sceneId, 'ohm-verify');
    }

    showStepGuide() {
        if (this.blackboardEl) this.blackboardEl.remove();
        const parent = document.getElementById('view-scene');
        const steps = window.LearningPathConfig?.[this.sceneId]?.steps || [];
        const current = steps[this.currentStep] || steps[0];
        this.blackboardEl = document.createElement('div');
        this.blackboardEl.className = 'scene-intro-modal visible';
        this.blackboardEl.innerHTML = `
            <div class="intro-content" style="max-width:720px; width:min(92%,720px);">
                <div class="blackboard-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="margin:0; color:#e2e8f0;"><i class="fas fa-chalkboard-teacher"></i> 电路分步讲解</h3>
                    <button id="co-close-guide" class="qf-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
                    ${steps.map((s, i) => `<span class="qf-step-pill" style="background:${i === this.currentStep ? '#2563eb' : '#1e293b'};">${i + 1}. ${s.title}</span>`).join('')}
                </div>
                <div class="qf-panel-body">
                    <p style="margin:0;">${this.getStepText(this.currentStep)}</p>
                    <p style="margin:10px 0 0;"><strong>当前目标：</strong>${current?.objective || ''}</p>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; margin-top:12px;">
                    <button class="control-btn" id="co-prev-step" ${this.currentStep === 0 ? 'disabled' : ''}>上一步</button>
                    <button class="control-btn" id="co-run-step">演示本步</button>
                    <button class="control-btn" id="co-next-step" ${this.currentStep >= steps.length - 1 ? 'disabled' : ''}>下一步</button>
                </div>
            </div>
        `;
        parent.appendChild(this.blackboardEl);
        window.LearningEngine?.logEvent(this.sceneId, 'guide_open', { stepIndex: this.currentStep });

        document.getElementById('co-close-guide').onclick = () => this.blackboardEl?.remove();
        document.getElementById('co-prev-step').onclick = () => {
            this.currentStep = Math.max(0, this.currentStep - 1);
            this.showStepGuide();
        };
        document.getElementById('co-next-step').onclick = () => {
            const currentId = (window.LearningPathConfig?.[this.sceneId]?.steps || [])[this.currentStep]?.id;
            if (currentId && !window.LearningEngine?.hasCompletedStep(this.sceneId, currentId)) {
                this.showGuide('🧩 请先点击“演示本步”完成当前步骤。');
                return;
            }
            const max = (window.LearningPathConfig?.[this.sceneId]?.steps?.length || 1) - 1;
            this.currentStep = Math.min(max, this.currentStep + 1);
            this.showStepGuide();
        };
        document.getElementById('co-run-step').onclick = () => this.executeStepAction(this.currentStep);
    }

    getStepText(stepIndex) {
        const map = [
            '读题：区分串联和并联的连接方式，明确已知电压和电阻。',
            '串联实验：切换串联，观察总电阻增大、电流减小。',
            '并联实验：切换并联，观察等效电阻减小、电流增大。',
            '欧姆验证：调节 R1/R2，验证 U = I·R 的对应变化。',
            '练习巩固：完成 3 道题，判断连接方式和计算电流。',
            '总结提升：查看掌握度和薄弱点，回练关键步骤。'
        ];
        return map[stepIndex] || map[0];
    }

    executeStepAction(action) {
        const stepIndex = Number(action);
        const stepIds = ['read', 'observe-series', 'observe-parallel', 'ohm-verify', 'practice', 'summary'];
        const targetId = stepIds[stepIndex];
        if (targetId && !window.LearningEngine?.canAccessStep(this.sceneId, targetId)) {
            this.showGuide('⛳ 请按步骤完成前置学习内容');
            return;
        }
        if (targetId) {
            window.LearningEngine?.completeStep(this.sceneId, targetId);
        }

        // 演示动作更具体，确保“步骤可演示”
        if (targetId === 'observe-series') {
            this.switchMode('series');
            this.showGuide('🧪 演示：串联中总电阻增大，电流减小，灯泡相对更暗。');
        } else if (targetId === 'observe-parallel') {
            this.switchMode('parallel');
            this.showGuide('🧪 演示：并联中等效电阻减小，总电流增大，支路电流分配。');
        } else if (targetId === 'ohm-verify') {
            this.startOhmLawDemo();
            this.showGuide('🧪 演示：自动调节 R1，观察 I 与 R 反向变化，验证 U=IR。');
            return;
        }
        this.showGuide(`✅ 已完成：${targetId || '当前步骤'}`);
    }

    startOhmLawDemo() {
        this.demoState = {
            type: 'ohm',
            t: 0,
            baseR1: this.state.resistance1,
            lastR1: this.state.resistance1
        };
    }

    runCurrentDirectionDemo() {
        this.showGuide('➡️ 电流方向演示：沿箭头从电源正极流向负极（约定方向）。');
        window.LearningEngine?.logEvent(this.sceneId, 'current_direction_demo', {});
    }

    showQuizPanel() {
        if (!window.LearningEngine?.canStartQuiz(this.sceneId)) {
            this.showGuide('📌 请先完成串联、并联和欧姆验证步骤后再做练习。');
            return;
        }
        if (this.quizEl) this.quizEl.remove();
        const quizList = window.QuizBank?.[this.sceneId] || [];
        const parent = document.getElementById('view-scene');
        this.quizEl = document.createElement('div');
        this.quizEl.className = 'scene-intro-modal visible';
        this.quizEl.innerHTML = `
            <div class="intro-content" style="max-width:760px; width:min(94%,760px);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="margin:0; color:#e2e8f0;"><i class="fas fa-list-check"></i> 电路练习</h3>
                    <button id="co-close-quiz" class="qf-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div style="max-height:50vh; overflow:auto; color:#cbd5e1;">
                    ${quizList.map((q, idx) => `
                        <div style="margin-bottom:12px; padding:10px; border:1px solid #334155; border-radius:10px;">
                            <p style="margin:0 0 8px;"><b>${idx + 1}. [${q.level}]</b> ${q.question}</p>
                            ${q.options.map(opt => `
                                <label style="display:block; margin:4px 0;">
                                    <input type="radio" name="${q.id}" value="${opt.value}"> ${opt.label}
                                </label>
                            `).join('')}
                        </div>
                    `).join('')}
                </div>
                <div style="display:flex; gap:8px; margin-top:12px;">
                    <button class="control-btn" id="co-submit-quiz">提交练习</button>
                </div>
                <div id="co-quiz-feedback" style="margin-top:10px; color:#cbd5e1;"></div>
            </div>
        `;
        parent.appendChild(this.quizEl);
        window.LearningEngine?.logEvent(this.sceneId, 'quiz_open', {});

        document.getElementById('co-close-quiz').onclick = () => this.quizEl?.remove();
        document.getElementById('co-submit-quiz').onclick = () => this.submitQuiz();
    }

    submitQuiz() {
        const quizList = window.QuizBank?.[this.sceneId] || [];
        const feedbackBox = document.getElementById('co-quiz-feedback');
        let html = '';
        let answeredCount = 0;
        quizList.forEach((q) => {
            const selected = document.querySelector(`input[name="${q.id}"]:checked`);
            if (!selected) return;
            answeredCount += 1;
            const result = window.LearningEngine?.submitAnswer(this.sceneId, q, selected.value);
            html += result?.isCorrect ? `<p>✅ ${q.id}: 回答正确</p>` : `<p>❌ ${q.id}: ${q.feedbackTemplate}</p>`;
        });

        if (answeredCount < quizList.length) {
            feedbackBox.innerHTML = `请先完成全部 ${quizList.length} 题再提交。`;
            return;
        }
        window.LearningEngine?.completeStep(this.sceneId, 'practice');
        window.LearningEngine?.logEvent(this.sceneId, 'quiz_submit_all', { answeredCount, total: quizList.length });
        feedbackBox.innerHTML = html;
    }

    showSummaryCard() {
        if (this.summaryEl) this.summaryEl.remove();
        const summary = window.LearningEngine?.getSummary(this.sceneId) || { score: 0, level: '未开始', weakPoints: [], suggestion: '先完成步骤和练习。' };
        window.LearningEngine?.completeStep(this.sceneId, 'summary');
        const weakMap = {
            'series-parallel': '串并联辨识',
            'ohm-calc': '欧姆定律计算',
            'equivalent-r': '等效电阻概念',
            generic: '基础概念'
        };
        const weakText = summary.weakPoints.length
            ? summary.weakPoints.map(tag => weakMap[tag] || tag).join('、')
            : '暂无明显薄弱点';

        const parent = document.getElementById('view-scene');
        this.summaryEl = document.createElement('div');
        this.summaryEl.className = 'scene-intro-modal visible';
        this.summaryEl.innerHTML = `
            <div class="intro-content" style="max-width:640px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h3 style="margin:0; color:#e2e8f0;"><i class="fas fa-award"></i> 学习总结</h3>
                    <button id="co-close-summary" class="qf-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div style="margin-top:10px; color:#cbd5e1;">
                    <p>掌握度：<b style="color:#60a5fa;">${summary.score}</b> / 100（${summary.level}）</p>
                    <p>薄弱点：${weakText}</p>
                    <p>建议：${summary.suggestion}</p>
                </div>
            </div>
        `;
        parent.appendChild(this.summaryEl);
        window.LearningEngine?.logEvent(this.sceneId, 'summary_open', { score: summary.score });
        document.getElementById('co-close-summary').onclick = () => this.summaryEl?.remove();
    }

    showGuide(message) {
        const container = document.getElementById('scene-canvas-container');
        const old = container.querySelector('.scene-guide-message');
        if (old) old.remove();
        const guide = document.createElement('div');
        guide.className = 'scene-guide-message';
        guide.innerHTML = message;
        container.appendChild(guide);
        setTimeout(() => guide.classList.add('visible'), 80);
        setTimeout(() => {
            guide.classList.remove('visible');
            setTimeout(() => guide.remove(), 280);
        }, 3000);
    }

    reset() {
        this.state = { mode: 'series', resistance1: 6, resistance2: 6, voltage: 12 };
        const r1 = document.getElementById('co-r1');
        const r2 = document.getElementById('co-r2');
        if (r1) r1.value = this.state.resistance1;
        if (r2) r2.value = this.state.resistance2;
        this.renderCircuit();
        window.LearningEngine?.resetSession(this.sceneId);
        window.LearningEngine?.createSession(this.sceneId);
        window.LearningEngine?.completeStep(this.sceneId, 'read');
        this.showGuide('🔄 电路参数与学习进度已重置');
    }

    resetView() {
        gsap.to(this.camera.position, {
            x: this.defaultCameraPos.x,
            y: this.defaultCameraPos.y,
            z: this.defaultCameraPos.z,
            duration: 0.8,
            ease: 'power2.out'
        });
        this.camera.lookAt(0, 0, 0);
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').innerHTML = `<i class="fas fa-bolt mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time) {
        // 电流粒子沿线路流动，体现方向和强弱
        this.flowTick += 0.016;
        const baseCurrent = Math.max(this.lastCalc?.totalCurrent || 0.1, 0.1);
        this.flowParticles.forEach(({ curve, particles }) => {
            particles.forEach((particle) => {
                const speed = particle.userData.speed * Math.min(baseCurrent / 2, 2);
                const t = (this.flowTick * speed + particle.userData.offset) % 1;
                const pos = curve.getPointAt(t);
                particle.position.copy(pos);
            });
        });

        // 欧姆演示：自动扫动电阻
        if (this.demoState?.type === 'ohm') {
            this.demoState.t += 0.02;
            const nextR = 3 + (Math.sin(this.demoState.t) + 1) * 7; // 3~17
            const rounded = Math.round(nextR);
            if (rounded !== this.demoState.lastR1) {
                this.state.resistance1 = rounded;
                this.demoState.lastR1 = rounded;
                const r1Input = document.getElementById('co-r1');
                if (r1Input) r1Input.value = String(this.state.resistance1);
                this.renderCircuit();
            }

            if (this.demoState.t > Math.PI * 2) {
                this.demoState = null;
                this.showGuide('✅ 欧姆演示结束：R 增大时，I 减小。');
            }
        }

        this.lightBulbs.forEach((bulb, idx) => {
            const pulse = 0.85 + Math.sin(time * (2 + idx)) * 0.08;
            bulb.scale.set(pulse, pulse, pulse);
        });
    }

    getInteractables() {
        return this.interactables;
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
    }

    createLabels(manager) {
        manager.createLabel(this.state.mode === 'series' ? '串联模式' : '并联模式', new THREE.Vector3(0, 3.1, 0.8), 'bolt');
    }

    dispose() {
        this.blackboardEl?.remove();
        this.quizEl?.remove();
        this.summaryEl?.remove();
        const controlsDiv = document.getElementById('scene-controls');
        if (controlsDiv) {
            controlsDiv.style.display = 'none';
            controlsDiv.innerHTML = '';
        }
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        this.interactables = [];
        this.flowCurves = [];
        this.flowParticles = [];
        this.directionArrows = [];
    }
};
