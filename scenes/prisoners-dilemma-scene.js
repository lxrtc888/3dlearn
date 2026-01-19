/**
 * 囚徒困境场景 - Prisoner's Dilemma Visualization
 * ============================================
 * 核心原理：
 * - 两个囚徒被分开审讯，各自选择"合作"或"背叛"
 * - 收益矩阵：双方合作(3,3)，双方背叛(1,1)，一方背叛(5,0)
 * - 纳什均衡：理性选择导致双方背叛（非最优）
 * - 多轮博弈中"以牙还牙"策略最成功
 * ============================================
 */
window.PrisonersDilemmaScene = class PrisonersDilemmaScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;

        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;

        // 场景元素
        this.prisonerA = null;          // 囚徒A
        this.prisonerB = null;          // 囚徒B
        this.roomA = null;              // 审讯室A
        this.roomB = null;              // 审讯室B
        this.matrixDisplay = null;      // 收益矩阵
        this.scoreDisplay = null;       // 得分显示

        // 游戏状态
        this.state = {
            choiceA: null,               // A的选择 'cooperate' | 'betray'
            choiceB: null,               // B的选择
            scoreA: 0,                   // A的累计得分
            scoreB: 0,                   // B的累计得分
            round: 0,                    // 当前轮次
            history: [],                 // 历史记录
            strategyB: 'random'          // B的策略
        };

        // 收益矩阵
        this.payoffs = {
            'cooperate_cooperate': [3, 3],
            'cooperate_betray': [0, 5],
            'betray_cooperate': [5, 0],
            'betray_betray': [1, 1]
        };

        // 策略列表
        this.strategies = {
            'random': '随机',
            'always_cooperate': '总是合作',
            'always_betray': '总是背叛',
            'tit_for_tat': '以牙还牙',
            'grudger': '记仇者'
        };

        // 默认相机位置
        this.defaultCameraPos = { x: 0, y: 15, z: 25 };
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
        this.scene.background = new THREE.Color(0x1a1a1a);
        this.scene.fog = new THREE.FogExp2(0x1a1a1a, 0.02);

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
        const ambient = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambient);

        // 主方向光
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.6);
        mainLight.position.set(10, 20, 10);
        this.scene.add(mainLight);

        // 审讯室灯光
        const spotA = new THREE.SpotLight(0xffffcc, 0.8, 20, Math.PI / 4);
        spotA.position.set(-6, 8, 0);
        spotA.target.position.set(-6, 0, 0);
        this.scene.add(spotA);

        const spotB = new THREE.SpotLight(0xffffcc, 0.8, 20, Math.PI / 4);
        spotB.position.set(6, 8, 0);
        spotB.target.position.set(6, 0, 0);
        this.scene.add(spotB);
    }

    /**
     * 创建场景
     */
    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);

        // 创建地面
        this.createFloor();

        // 创建审讯室
        this.createRooms();

        // 创建囚徒
        this.createPrisoners();

        // 创建收益矩阵显示
        this.createMatrix();

        // 创建得分板
        this.createScoreboard();

        // 创建选择气泡
        this.createChoiceBubbles();
    }

    /**
     * 创建地面
     */
    createFloor() {
        const floorGeo = new THREE.PlaneGeometry(30, 20);
        const floorMat = new THREE.MeshStandardMaterial({
            color: 0x2a2a2a,
            roughness: 0.9
        });
        const floor = new THREE.Mesh(floorGeo, floorMat);
        floor.rotation.x = -Math.PI / 2;
        floor.position.y = -0.01;
        this.mainGroup.add(floor);
    }

    /**
     * 创建审讯室
     */
    createRooms() {
        const roomMat = new THREE.MeshStandardMaterial({
            color: 0x333344,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });

        // 审讯室A
        this.roomA = new THREE.Group();
        const wallsA = this.createRoomWalls(roomMat);
        this.roomA.add(wallsA);
        this.roomA.position.set(-6, 0, 0);
        this.mainGroup.add(this.roomA);

        // 审讯室B
        this.roomB = new THREE.Group();
        const wallsB = this.createRoomWalls(roomMat);
        this.roomB.add(wallsB);
        this.roomB.position.set(6, 0, 0);
        this.mainGroup.add(this.roomB);

        // 中间隔墙
        const dividerGeo = new THREE.BoxGeometry(0.3, 5, 6);
        const dividerMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const divider = new THREE.Mesh(dividerGeo, dividerMat);
        divider.position.set(0, 2.5, 0);
        this.mainGroup.add(divider);
    }

    /**
     * 创建房间墙壁
     */
    createRoomWalls(material) {
        const group = new THREE.Group();

        // 后墙
        const backWall = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 5),
            material
        );
        backWall.position.set(0, 2.5, -3);
        group.add(backWall);

        // 左墙
        const leftWall = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 5),
            material
        );
        leftWall.rotation.y = Math.PI / 2;
        leftWall.position.set(-3, 2.5, 0);
        group.add(leftWall);

        // 右墙
        const rightWall = new THREE.Mesh(
            new THREE.PlaneGeometry(6, 5),
            material
        );
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.position.set(3, 2.5, 0);
        group.add(rightWall);

        return group;
    }

    /**
     * 创建囚徒
     */
    createPrisoners() {
        // 囚徒A
        this.prisonerA = this.createPrisoner(0x4488ff, 'A');
        this.prisonerA.position.set(-6, 0, 0);
        this.mainGroup.add(this.prisonerA);

        // 囚徒B
        this.prisonerB = this.createPrisoner(0xff8844, 'B');
        this.prisonerB.position.set(6, 0, 0);
        this.mainGroup.add(this.prisonerB);
    }

    /**
     * 创建单个囚徒模型
     */
    createPrisoner(color, name) {
        const group = new THREE.Group();

        // 身体
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.6, 1.8, 16);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: 0x666666, // 囚服颜色
            roughness: 0.8
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 0.9;
        group.add(body);

        // 头
        const headGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({
            color: 0xffcc99,
            roughness: 0.7
        });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.2;
        group.add(head);

        // 名字标识球
        const nameBallGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const nameBallMat = new THREE.MeshBasicMaterial({ color: color });
        const nameBall = new THREE.Mesh(nameBallGeo, nameBallMat);
        nameBall.position.y = 3;
        group.add(nameBall);
        group.userData.nameBall = nameBall;

        // 椅子
        const chairGeo = new THREE.BoxGeometry(0.8, 0.5, 0.8);
        const chairMat = new THREE.MeshStandardMaterial({ color: 0x553311 });
        const chair = new THREE.Mesh(chairGeo, chairMat);
        chair.position.y = 0.25;
        group.add(chair);

        group.userData.name = name;
        group.userData.color = color;

        return group;
    }

    /**
     * 创建选择气泡
     */
    createChoiceBubbles() {
        // 囚徒A的选择气泡
        this.bubbleA = this.createBubble();
        this.bubbleA.position.set(-6, 4.5, 0);
        this.bubbleA.visible = false;
        this.mainGroup.add(this.bubbleA);

        // 囚徒B的选择气泡
        this.bubbleB = this.createBubble();
        this.bubbleB.position.set(6, 4.5, 0);
        this.bubbleB.visible = false;
        this.mainGroup.add(this.bubbleB);
    }

    /**
     * 创建气泡
     */
    createBubble() {
        const group = new THREE.Group();

        // 气泡背景
        const bubbleGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const bubbleMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.9
        });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        group.add(bubble);
        group.userData.bubble = bubble;

        // 选择图标（用颜色区分）
        const iconGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const iconMat = new THREE.MeshBasicMaterial({ color: 0x888888 });
        const icon = new THREE.Mesh(iconGeo, iconMat);
        group.add(icon);
        group.userData.icon = icon;

        return group;
    }

    /**
     * 创建收益矩阵
     */
    createMatrix() {
        this.matrixGroup = new THREE.Group();
        this.matrixGroup.position.set(0, 8, -5);
        this.mainGroup.add(this.matrixGroup);

        // 矩阵背景
        const bgGeo = new THREE.PlaneGeometry(10, 6);
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x222233,
            transparent: true,
            opacity: 0.9
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.matrixGroup.add(bg);

        // 网格线
        const lineMat = new THREE.LineBasicMaterial({ color: 0x666688 });
        
        // 水平线
        [-1.5, 0, 1.5].forEach(y => {
            const points = [
                new THREE.Vector3(-4, y, 0.01),
                new THREE.Vector3(4, y, 0.01)
            ];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geo, lineMat);
            this.matrixGroup.add(line);
        });

        // 垂直线
        [-2, 0, 2].forEach(x => {
            const points = [
                new THREE.Vector3(x, -2.5, 0.01),
                new THREE.Vector3(x, 2.5, 0.01)
            ];
            const geo = new THREE.BufferGeometry().setFromPoints(points);
            const line = new THREE.Line(geo, lineMat);
            this.matrixGroup.add(line);
        });

        // 收益数字用球体表示（颜色深浅代表数值大小）
        this.matrixCells = [];
        const positions = [
            { x: -1, y: 0.75, payoff: [3, 3], label: '合作-合作' },
            { x: 1, y: 0.75, payoff: [0, 5], label: '合作-背叛' },
            { x: -1, y: -0.75, payoff: [5, 0], label: '背叛-合作' },
            { x: 1, y: -0.75, payoff: [1, 1], label: '背叛-背叛' }
        ];

        positions.forEach((pos, i) => {
            const cellGroup = new THREE.Group();
            
            // A的收益
            const scoreAGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const scoreAMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.6, 1, 0.2 + pos.payoff[0] * 0.15)
            });
            const scoreA = new THREE.Mesh(scoreAGeo, scoreAMat);
            scoreA.position.set(-0.4, 0, 0.1);
            cellGroup.add(scoreA);

            // B的收益
            const scoreBGeo = new THREE.SphereGeometry(0.3, 16, 16);
            const scoreBMat = new THREE.MeshBasicMaterial({
                color: new THREE.Color().setHSL(0.1, 1, 0.2 + pos.payoff[1] * 0.15)
            });
            const scoreB = new THREE.Mesh(scoreBGeo, scoreBMat);
            scoreB.position.set(0.4, 0, 0.1);
            cellGroup.add(scoreB);

            cellGroup.position.set(pos.x, pos.y, 0);
            cellGroup.userData = { payoff: pos.payoff, label: pos.label };
            this.matrixCells.push(cellGroup);
            this.matrixGroup.add(cellGroup);
        });
    }

    /**
     * 创建得分板
     */
    createScoreboard() {
        this.scoreGroup = new THREE.Group();
        this.scoreGroup.position.set(0, 12, 0);
        this.mainGroup.add(this.scoreGroup);

        // 背景
        const bgGeo = new THREE.PlaneGeometry(8, 2);
        const bgMat = new THREE.MeshBasicMaterial({
            color: 0x000000,
            transparent: true,
            opacity: 0.7
        });
        const bg = new THREE.Mesh(bgGeo, bgMat);
        this.scoreGroup.add(bg);

        // 得分指示器（用条形表示）
        const barGeoA = new THREE.BoxGeometry(0.5, 0.1, 0.1);
        const barMatA = new THREE.MeshBasicMaterial({ color: 0x4488ff });
        this.scoreBarA = new THREE.Mesh(barGeoA, barMatA);
        this.scoreBarA.position.set(-2, 0.3, 0.1);
        this.scoreGroup.add(this.scoreBarA);

        const barGeoB = new THREE.BoxGeometry(0.5, 0.1, 0.1);
        const barMatB = new THREE.MeshBasicMaterial({ color: 0xff8844 });
        this.scoreBarB = new THREE.Mesh(barGeoB, barMatB);
        this.scoreBarB.position.set(-2, -0.3, 0.1);
        this.scoreGroup.add(this.scoreBarB);
    }

    /**
     * 更新得分显示
     */
    updateScoreDisplay() {
        // 更新得分条长度
        const maxScore = Math.max(this.state.scoreA, this.state.scoreB, 1);
        this.scoreBarA.scale.x = (this.state.scoreA / maxScore) * 10 || 0.1;
        this.scoreBarB.scale.x = (this.state.scoreB / maxScore) * 10 || 0.1;
    }

    /**
     * 玩家A选择合作
     */
    playerCooperate() {
        this.state.choiceA = 'cooperate';
        this.showChoice('A', 'cooperate');
        this.checkRoundComplete();
    }

    /**
     * 玩家A选择背叛
     */
    playerBetray() {
        this.state.choiceA = 'betray';
        this.showChoice('A', 'betray');
        this.checkRoundComplete();
    }

    /**
     * 显示选择
     */
    showChoice(player, choice) {
        const bubble = player === 'A' ? this.bubbleA : this.bubbleB;
        const icon = bubble.userData.icon;
        
        bubble.visible = true;
        
        if (choice === 'cooperate') {
            icon.material.color.setHex(0x00ff00); // 绿色=合作
            bubble.userData.bubble.material.color.setHex(0xccffcc);
        } else {
            icon.material.color.setHex(0xff0000); // 红色=背叛
            bubble.userData.bubble.material.color.setHex(0xffcccc);
        }

        // 动画
        gsap.from(bubble.scale, {
            x: 0, y: 0, z: 0,
            duration: 0.3,
            ease: 'back.out(1.7)'
        });
    }

    /**
     * B根据策略做出选择
     */
    getBChoice() {
        switch (this.state.strategyB) {
            case 'always_cooperate':
                return 'cooperate';
            case 'always_betray':
                return 'betray';
            case 'tit_for_tat':
                // 以牙还牙：第一轮合作，之后模仿对方上一轮的选择
                if (this.state.history.length === 0) return 'cooperate';
                return this.state.history[this.state.history.length - 1].choiceA;
            case 'grudger':
                // 记仇者：一旦对方背叛过，永远背叛
                if (this.state.history.some(h => h.choiceA === 'betray')) {
                    return 'betray';
                }
                return 'cooperate';
            case 'random':
            default:
                return Math.random() > 0.5 ? 'cooperate' : 'betray';
        }
    }

    /**
     * 检查回合是否完成
     */
    checkRoundComplete() {
        if (!this.state.choiceA) return;

        // B做出选择
        setTimeout(() => {
            this.state.choiceB = this.getBChoice();
            this.showChoice('B', this.state.choiceB);

            // 计算得分
            setTimeout(() => {
                this.calculateScore();
            }, 500);
        }, 500);
    }

    /**
     * 计算得分
     */
    calculateScore() {
        const key = `${this.state.choiceA}_${this.state.choiceB}`;
        const payoff = this.payoffs[key];

        this.state.scoreA += payoff[0];
        this.state.scoreB += payoff[1];
        this.state.round++;

        // 记录历史
        this.state.history.push({
            round: this.state.round,
            choiceA: this.state.choiceA,
            choiceB: this.state.choiceB,
            payoffA: payoff[0],
            payoffB: payoff[1]
        });

        // 更新显示
        this.updateScoreDisplay();

        // 高亮矩阵对应格子
        this.highlightMatrixCell(key);

        // 显示结果
        this.showRoundResult(payoff);

        // 重置选择
        this.state.choiceA = null;
        this.state.choiceB = null;

        // 隐藏气泡
        setTimeout(() => {
            this.bubbleA.visible = false;
            this.bubbleB.visible = false;
        }, 2000);
    }

    /**
     * 高亮矩阵格子
     */
    highlightMatrixCell(key) {
        const index = {
            'cooperate_cooperate': 0,
            'cooperate_betray': 1,
            'betray_cooperate': 2,
            'betray_betray': 3
        }[key];

        this.matrixCells.forEach((cell, i) => {
            if (i === index) {
                gsap.to(cell.scale, {
                    x: 1.5, y: 1.5, z: 1.5,
                    duration: 0.3,
                    yoyo: true,
                    repeat: 1
                });
            }
        });
    }

    /**
     * 显示回合结果
     */
    showRoundResult(payoff) {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            const choiceAText = this.state.history[this.state.history.length - 1].choiceA === 'cooperate' ? '合作 🤝' : '背叛 🗡️';
            const choiceBText = this.state.history[this.state.history.length - 1].choiceB === 'cooperate' ? '合作 🤝' : '背叛 🗡️';

            title.textContent = `第 ${this.state.round} 轮结果`;
            content.innerHTML = `
                <p><strong>选择：</strong></p>
                <p>• 囚徒A：<span class="text-blue-400">${choiceAText}</span></p>
                <p>• 囚徒B：<span class="text-orange-400">${choiceBText}</span></p>
                <br>
                <p><strong>本轮收益：</strong></p>
                <p>• A获得 <span class="text-yellow-400">${payoff[0]}</span> 分</p>
                <p>• B获得 <span class="text-yellow-400">${payoff[1]}</span> 分</p>
                <br>
                <p><strong>累计得分：</strong></p>
                <p>• A：<span class="text-blue-400">${this.state.scoreA}</span> 分</p>
                <p>• B：<span class="text-orange-400">${this.state.scoreB}</span> 分</p>
                <br>
                <p>💡 B当前策略：<span class="text-cyan-400">${this.strategies[this.state.strategyB]}</span></p>
            `;
            panel.classList.add('visible');
        }
    }

    /**
     * 自动进行多轮
     */
    autoPlay(rounds = 10) {
        let i = 0;
        const playRound = () => {
            if (i >= rounds) return;
            
            // 随机为A选择
            if (Math.random() > 0.5) {
                this.playerCooperate();
            } else {
                this.playerBetray();
            }
            
            i++;
            setTimeout(playRound, 2500);
        };
        playRound();
    }

    /**
     * 重置游戏
     */
    resetGame() {
        this.state = {
            choiceA: null,
            choiceB: null,
            scoreA: 0,
            scoreB: 0,
            round: 0,
            history: [],
            strategyB: this.state.strategyB
        };

        this.bubbleA.visible = false;
        this.bubbleB.visible = false;
        this.updateScoreDisplay();
    }

    /**
     * 设置UI
     */
    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        if (!controlsDiv) return;

        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <button class="control-btn" id="btn-cooperate" style="background: #22c55e;">
                <i class="fas fa-handshake"></i> 合作
            </button>
            <button class="control-btn" id="btn-betray" style="background: #ef4444;">
                <i class="fas fa-user-slash"></i> 背叛
            </button>
            <div class="control-select-group">
                <label>B策略:</label>
                <select id="strategy-select" class="styled-select">
                    <option value="random">随机</option>
                    <option value="always_cooperate">总是合作</option>
                    <option value="always_betray">总是背叛</option>
                    <option value="tit_for_tat">以牙还牙</option>
                    <option value="grudger">记仇者</option>
                </select>
            </div>
            <button class="control-btn" id="btn-auto">
                <i class="fas fa-play"></i> 自动10轮
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
        // 合作
        document.getElementById('btn-cooperate')?.addEventListener('click', () => {
            if (!this.state.choiceA) this.playerCooperate();
        });

        // 背叛
        document.getElementById('btn-betray')?.addEventListener('click', () => {
            if (!this.state.choiceA) this.playerBetray();
        });

        // 策略选择
        document.getElementById('strategy-select')?.addEventListener('change', (e) => {
            this.state.strategyB = e.target.value;
        });

        // 自动
        document.getElementById('btn-auto')?.addEventListener('click', () => {
            this.autoPlay(10);
        });

        // 重置
        document.getElementById('btn-reset')?.addEventListener('click', () => {
            this.resetGame();
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
     * 显示初始引导
     */
    showInitialGuide() {
        const panel = document.getElementById('info-panel');
        const title = document.getElementById('info-title');
        const content = document.getElementById('info-content');

        if (panel && title && content) {
            title.textContent = '🎭 囚徒困境';
            content.innerHTML = `
                <p><strong>博弈论经典思想实验</strong></p>
                <br>
                <p>两个囚徒被分开审讯，每人可以选择：</p>
                <ul style="margin-left: 1rem; margin-top: 0.5rem;">
                    <li>• 🤝 <span class="text-green-400">合作</span>（保持沉默）</li>
                    <li>• 🗡️ <span class="text-red-400">背叛</span>（揭发对方）</li>
                </ul>
                <br>
                <p><strong>收益矩阵：</strong></p>
                <p>• 双方合作：各得 <span class="text-yellow-400">3</span> 分</p>
                <p>• 双方背叛：各得 <span class="text-yellow-400">1</span> 分</p>
                <p>• 一方背叛：背叛者 <span class="text-yellow-400">5</span> 分，合作者 <span class="text-yellow-400">0</span> 分</p>
                <br>
                <p>💡 <strong>纳什均衡：</strong></p>
                <p>"理性"选择是背叛，但双方都背叛反而更差！</p>
            `;
            panel.classList.add('visible');
        }
    }

    /**
     * 动画更新（场景管理器调用）
     */
    animate(time, delta) {
        // 囚徒轻微晃动
        if (this.prisonerA) {
            this.prisonerA.rotation.y = Math.sin(time) * 0.1;
        }
        if (this.prisonerB) {
            this.prisonerB.rotation.y = -Math.sin(time) * 0.1;
        }

        // 气泡浮动
        if (this.bubbleA?.visible) {
            this.bubbleA.position.y = 4.5 + Math.sin(time * 2) * 0.1;
        }
        if (this.bubbleB?.visible) {
            this.bubbleB.position.y = 4.5 + Math.sin(time * 2 + Math.PI) * 0.1;
        }
    }

    /**
     * 处理点击
     */
    onMouseClick(raycaster) {
        // 可以点击囚徒查看信息
    }

    /**
     * 处理鼠标移动
     */
    onMouseMove(raycaster) {
        document.body.style.cursor = 'default';
    }

    /**
     * 清理资源
     */
    dispose() {
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
