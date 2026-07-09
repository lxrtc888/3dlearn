/**
 * 二次函数学习闭环模板场景
 * - 深色主场景（与现有风格融合）
 * - 局部黑板式步骤讲解（题目规范）
 * - 练习判分 + 反馈 + 总结卡
 */
window.QuadraticFunctionScene = class QuadraticFunctionScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.sceneId = 'quadratic-function';
        this.mainGroup = null;
        this.interactables = [];
        this.parabolaLine = null;
        this.vertexMesh = null;
        this.blackboardEl = null;
        this.quizEl = null;
        this.summaryEl = null;
        this.currentStep = 0;

        this.params = { a: 1, b: 0, c: 0 };
        this.defaultCameraPos = { x: 0, y: 0, z: 20 };
    }

    init() {
        this.scene.background = new THREE.Color(0x0b1020);
        this.camera.position.set(this.defaultCameraPos.x, this.defaultCameraPos.y, this.defaultCameraPos.z);
        this.camera.lookAt(0, 0, 0);

        this.setupLights();
        this.setupScene();
        this.setupUI();
        this.setupDragControl();

        if (window.LearningEngine) {
            window.LearningEngine.createSession(this.sceneId);
            window.LearningEngine.completeStep(this.sceneId, 'read');
            window.LearningEngine.logEvent(this.sceneId, 'scene_enter', {});
        }

        this.showGuide('📈 通过调节 a、b、c 自主探索二次函数图像变化');
    }

    setupLights() {
        const ambient = new THREE.AmbientLight(0xffffff, 0.7);
        const directional = new THREE.DirectionalLight(0x9ec5ff, 0.65);
        directional.position.set(6, 9, 8);
        this.scene.add(ambient, directional);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        const grid = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
        grid.rotation.x = Math.PI / 2;
        grid.position.z = -0.2;
        this.mainGroup.add(grid);

        const xAxis = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-12, 0, 0), new THREE.Vector3(12, 0, 0)]),
            new THREE.LineBasicMaterial({ color: 0x64748b })
        );
        const yAxis = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -10, 0), new THREE.Vector3(0, 10, 0)]),
            new THREE.LineBasicMaterial({ color: 0x64748b })
        );
        this.mainGroup.add(xAxis, yAxis);

        this.drawParabola();
        this.createVertexMarker();
    }

    createVertexMarker() {
        if (this.vertexMesh) {
            this.mainGroup.remove(this.vertexMesh);
        }
        const x0 = -this.params.b / (2 * this.params.a || 1e-6);
        const y0 = this.params.a * x0 * x0 + this.params.b * x0 + this.params.c;

        this.vertexMesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.22, 20, 20),
            new THREE.MeshStandardMaterial({ color: 0xf59e0b, emissive: 0x7c2d12, emissiveIntensity: 0.5 })
        );
        this.vertexMesh.position.set(x0, y0, 0.2);
        this.vertexMesh.userData = {
            hoverTitle: '顶点',
            hoverDesc: `(${x0.toFixed(2)}, ${y0.toFixed(2)})`,
            hoverIcon: 'fa-dot-circle',
            name: '抛物线顶点',
            description: `
                <p>顶点坐标：<b>(${x0.toFixed(2)}, ${y0.toFixed(2)})</b></p>
                <p>对称轴：<b>x = ${x0.toFixed(2)}</b></p>
                <p>提示：观察 a、b 变化时顶点如何移动。</p>
            `
        };
        this.mainGroup.add(this.vertexMesh);
        this.interactables = [this.vertexMesh];
    }

    drawParabola() {
        if (this.parabolaLine) {
            this.mainGroup.remove(this.parabolaLine);
            this.parabolaLine.geometry.dispose();
            this.parabolaLine.material.dispose();
        }

        const pts = [];
        for (let x = -10; x <= 10; x += 0.1) {
            const y = this.params.a * x * x + this.params.b * x + this.params.c;
            pts.push(new THREE.Vector3(x, y, 0));
        }

        this.parabolaLine = new THREE.Line(
            new THREE.BufferGeometry().setFromPoints(pts),
            new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 })
        );
        this.mainGroup.add(this.parabolaLine);
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; max-width:100%;">
                <label class="control-btn" style="display:flex; gap:6px; align-items:center;">a
                    <input id="qf-a" type="range" min="-3" max="3" step="0.1" value="${this.params.a}">
                </label>
                <label class="control-btn" style="display:flex; gap:6px; align-items:center;">b
                    <input id="qf-b" type="range" min="-8" max="8" step="0.1" value="${this.params.b}">
                </label>
                <label class="control-btn" style="display:flex; gap:6px; align-items:center;">c
                    <input id="qf-c" type="range" min="-8" max="8" step="0.1" value="${this.params.c}">
                </label>
                <button class="control-btn" id="qf-guide"><i class="fas fa-chalkboard"></i> 步骤讲解</button>
                <button class="control-btn" id="qf-quiz"><i class="fas fa-list-check"></i> 开始练习</button>
                <button class="control-btn" id="qf-summary"><i class="fas fa-chart-line"></i> 学习总结</button>
                <button class="control-btn" id="qf-reset"><i class="fas fa-redo"></i> 重置参数</button>
                <button class="control-btn" id="qf-view"><i class="fas fa-video"></i> 重置视角</button>
            </div>
        `;

        const onAdjust = (key, value) => {
            this.params[key] = Number(value);
            this.drawParabola();
            this.createVertexMarker();
            if (window.LearningEngine) {
                window.LearningEngine.recordExplore(this.sceneId, `adjust-${key}`);
                const stepMap = { a: 'observe-a', b: 'observe-b', c: 'observe-c' };
                window.LearningEngine.completeStep(this.sceneId, stepMap[key]);
            }
        };

        document.getElementById('qf-a').oninput = (e) => onAdjust('a', e.target.value);
        document.getElementById('qf-b').oninput = (e) => onAdjust('b', e.target.value);
        document.getElementById('qf-c').oninput = (e) => onAdjust('c', e.target.value);
        document.getElementById('qf-guide').onclick = () => this.showStepGuide();
        document.getElementById('qf-quiz').onclick = () => this.showQuizPanel();
        document.getElementById('qf-summary').onclick = () => this.showSummaryCard();
        document.getElementById('qf-reset').onclick = () => this.reset();
        document.getElementById('qf-view').onclick = () => this.resetView();
    }

    setupDragControl() {
        // 当前模板以参数滑块交互为主，预留拖拽接口
    }

    showStepGuide() {
        if (this.blackboardEl) this.blackboardEl.remove();
        const parent = document.getElementById('view-scene');
        this.blackboardEl = document.createElement('div');
        this.blackboardEl.className = 'scene-intro-modal visible';
        this.blackboardEl.innerHTML = this.getBlackboardContent();
        parent.appendChild(this.blackboardEl);
        this.bindBlackboardEvents();
        window.LearningEngine?.logEvent(this.sceneId, 'guide_open', { stepIndex: this.currentStep });
    }

    getBlackboardContent() {
        const steps = window.LearningPathConfig?.[this.sceneId]?.steps || [];
        const current = steps[this.currentStep] || steps[0];
        return `
            <div class="intro-content" style="max-width:720px; width:min(92%,720px);">
                <div class="blackboard-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <h3 style="margin:0; color:#e2e8f0;"><i class="fas fa-chalkboard-teacher"></i> 二次函数分步讲解</h3>
                    <button id="qf-close-guide" class="qf-close-btn">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:12px;">
                    ${steps.map((s, i) => `<span class="qf-step-pill" style="background:${i === this.currentStep ? '#2563eb' : '#1e293b'};">${i + 1}. ${s.title}</span>`).join('')}
                </div>
                <div class="qf-panel-body">
                    ${this.getDetailedStepContent(this.currentStep)}
                    <p style="margin:10px 0 0;"><strong>当前目标：</strong>${current?.objective || ''}</p>
                </div>
                <div style="display:flex; justify-content:space-between; gap:8px; margin-top:12px;">
                    <button class="control-btn" id="qf-prev-step" ${this.currentStep === 0 ? 'disabled' : ''}>上一步</button>
                    <button class="control-btn" id="qf-run-step">演示本步</button>
                    <button class="control-btn" id="qf-next-step" ${this.currentStep >= steps.length - 1 ? 'disabled' : ''}>下一步</button>
                </div>
            </div>
        `;
    }

    getDetailedStepContent(stepIndex) {
        const map = [
            '读题：观察函数 y = ax² + bx + c，明确 a、b、c 的角色分工。',
            '探索 a：固定 b、c，调节 a，观察开口方向和“胖瘦”变化。',
            '探索 b：固定 a、c，调节 b，重点关注顶点和对称轴变化。',
            '探索 c：固定 a、b，调节 c，观察整条曲线如何整体上下平移。',
            '练习：完成 3 道题，区分“符号判断”与“参数作用”错误。',
            '总结：查看掌握度，针对薄弱点回到对应步骤强化。'
        ];
        return `<p style="margin:0;">${map[stepIndex] || map[0]}</p>`;
    }

    bindBlackboardEvents() {
        document.getElementById('qf-close-guide').onclick = () => this.blackboardEl?.remove();
        document.getElementById('qf-prev-step').onclick = () => {
            this.currentStep = Math.max(0, this.currentStep - 1);
            this.showStepGuide();
        };
        document.getElementById('qf-next-step').onclick = () => {
            const currentId = (window.LearningPathConfig?.[this.sceneId]?.steps || [])[this.currentStep]?.id;
            if (currentId && !window.LearningEngine?.hasCompletedStep(this.sceneId, currentId)) {
                this.showGuide('🧩 请先点击“演示本步”完成当前步骤，再进入下一步。');
                return;
            }
            const max = (window.LearningPathConfig?.[this.sceneId]?.steps?.length || 1) - 1;
            this.currentStep = Math.min(max, this.currentStep + 1);
            this.showStepGuide();
        };
        document.getElementById('qf-run-step').onclick = () => this.executeStepAction(this.currentStep);
    }

    executeStepAction(action) {
        const stepIndex = Number(action);
        const stepIds = ['read', 'observe-a', 'observe-b', 'observe-c', 'practice', 'summary'];
        const targetId = stepIds[stepIndex];
        if (targetId && !window.LearningEngine?.canAccessStep(this.sceneId, targetId)) {
            this.showGuide('⛳ 请按步骤学习，先完成前面的引导步骤。');
            return;
        }
        if (window.LearningEngine && stepIds[stepIndex]) {
            window.LearningEngine.completeStep(this.sceneId, stepIds[stepIndex]);
        }
        this.showGuide(`✅ 已完成：${stepIds[stepIndex] || '当前步骤'}`);
    }

    showQuizPanel() {
        if (!window.LearningEngine?.canStartQuiz(this.sceneId)) {
            this.showGuide('📌 请先完成 a、b、c 三个探索步骤后再开始练习。');
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
                    <h3 style="margin:0; color:#e2e8f0;"><i class="fas fa-list-check"></i> 场景练习</h3>
                    <button id="qf-close-quiz" class="qf-close-btn"><i class="fas fa-times"></i></button>
                </div>
                <div id="qf-quiz-body" style="max-height:50vh; overflow:auto; color:#cbd5e1;">
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
                    <button class="control-btn" id="qf-submit-quiz">提交练习</button>
                    <button class="control-btn" id="qf-ai-feedback">AI点评</button>
                </div>
                <div id="qf-quiz-feedback" style="margin-top:10px; color:#cbd5e1;"></div>
            </div>
        `;
        parent.appendChild(this.quizEl);
        window.LearningEngine?.logEvent(this.sceneId, 'quiz_open', {});

        document.getElementById('qf-close-quiz').onclick = () => this.quizEl?.remove();
        document.getElementById('qf-submit-quiz').onclick = () => this.submitQuiz();
        document.getElementById('qf-ai-feedback').onclick = () => this.askAIFeedback();
    }

    submitQuiz() {
        const quizList = window.QuizBank?.[this.sceneId] || [];
        const feedbackBox = document.getElementById('qf-quiz-feedback');
        let html = '';
        let answeredCount = 0;
        quizList.forEach((q) => {
            const selected = document.querySelector(`input[name="${q.id}"]:checked`);
            if (!selected) return;
            answeredCount += 1;
            const result = window.LearningEngine?.submitAnswer(this.sceneId, q, selected.value);
            const ok = !!result?.isCorrect;
            if (!ok) {
                html += `<p>❌ ${q.id}: ${q.feedbackTemplate}</p>`;
            } else {
                html += `<p>✅ ${q.id}: 回答正确</p>`;
            }
        });

        if (answeredCount < quizList.length) {
            feedbackBox.innerHTML = `请先完成全部 ${quizList.length} 题再提交。`;
            return;
        }

        if (window.LearningEngine) {
            window.LearningEngine.completeStep(this.sceneId, 'practice');
            window.LearningEngine.logEvent(this.sceneId, 'quiz_submit_all', {
                answeredCount,
                total: quizList.length
            });
        }
        feedbackBox.innerHTML = answeredCount === 0 ? '请先作答后提交。' : html;
    }

    async askAIFeedback() {
        const feedbackBox = document.getElementById('qf-quiz-feedback');
        if (!feedbackBox) return;
        const summary = window.LearningEngine?.getSummary(this.sceneId);
        if (!window.AIService || !summary) return;

        feedbackBox.innerHTML += '<p>🤖 AI正在生成点评...</p>';
        const prompt = `你是数学老师。学生完成了二次函数练习，得分${summary.score}，薄弱点：${summary.weakPoints.join('、') || '暂无'}。请用120字内给出改进建议。`;
        const result = await window.AIService.chat(prompt);
        if (result?.success) {
            feedbackBox.innerHTML += `<p>🎓 ${result.message}</p>`;
        }
    }

    showSummaryCard() {
        if (this.summaryEl) this.summaryEl.remove();
        const summary = window.LearningEngine?.getSummary(this.sceneId) || { score: 0, level: '未开始', weakPoints: [], suggestion: '先完成步骤和练习。' };
        if (window.LearningEngine) {
            window.LearningEngine.completeStep(this.sceneId, 'summary');
        }

        const weakMap = {
            'a-sign': 'a 的符号与开口方向',
            'parabola-axis': '抛物线与坐标轴关系',
            'axis-misunderstanding': '对称轴公式理解',
            'formula-connection': '图像与公式联动',
            'param-role': '参数角色分工',
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
                    <button id="qf-close-summary" class="qf-close-btn"><i class="fas fa-times"></i></button>
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
        document.getElementById('qf-close-summary').onclick = () => this.summaryEl?.remove();
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
        this.params = { a: 1, b: 0, c: 0 };
        const a = document.getElementById('qf-a');
        const b = document.getElementById('qf-b');
        const c = document.getElementById('qf-c');
        if (a) a.value = this.params.a;
        if (b) b.value = this.params.b;
        if (c) c.value = this.params.c;
        this.drawParabola();
        this.createVertexMarker();
        window.LearningEngine?.resetSession(this.sceneId);
        window.LearningEngine?.createSession(this.sceneId);
        window.LearningEngine?.completeStep(this.sceneId, 'read');
        this.showGuide('🔄 参数与学习进度已重置');
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
        document.getElementById('info-title').innerHTML = `<i class="fas fa-dot-circle mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time) {
        if (this.vertexMesh) {
            const s = 1 + Math.sin(time * 2.2) * 0.06;
            this.vertexMesh.scale.set(s, s, s);
        }
    }

    getInteractables() {
        return this.interactables;
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
    }

    createLabels(manager) {
        if (!this.vertexMesh) return;
        manager.createLabel('顶点', this.vertexMesh.position.clone(), 'map-pin');
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
        if (this.parabolaLine) {
            this.parabolaLine.geometry.dispose();
            this.parabolaLine.material.dispose();
        }
        if (this.mainGroup) this.scene.remove(this.mainGroup);
        this.interactables = [];
    }
};
