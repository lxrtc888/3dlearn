/**
 * 击鼓传花场景 - 周期性数学可视化
 * ============================================
 * 核心知识点：
 * - 循环与周期的概念
 * - 余数（模运算）的应用
 * - 规律发现与归纳
 * ============================================
 * 题目：8个小朋友围成圈，花从1号开始传
 * 1. 传了42次，花在几号手里？ → 42 % 8 = 2，在3号手里（1+2=3）
 * 2. 传了69次，1号传过几次？ → Math.ceil(69/8) = 9次
 * ============================================
 */
window.DrumFlowerScene = class DrumFlowerScene {
    constructor(scene, camera, renderer) {
        this.scene = scene;
        this.camera = camera;
        this.renderer = renderer;
        
        this.mainGroup = null;
        this.interactables = [];
        this.highlighted = null;
        
        // 场景元素
        this.children = [];      // 8个小朋友
        this.flower = null;      // 花
        this.drum = null;        // 鼓
        this.drummer = null;     // 击鼓者
        
        // 游戏状态
        this.currentHolder = 1;  // 当前持花者（1-8）
        this.passCount = 0;      // 传递次数
        this.isAnimating = false;
        this.totalChildren = 8;
        
        this.isAutoPlaying = false;
        this.defaultCameraPos = { x: 0, y: 18, z: 20 };
    }

    init() {
        this.camera.position.set(0, 18, 20);
        this.camera.lookAt(0, 0, 0);
        
        this.scene.background = new THREE.Color(0x87CEEB); // 天蓝色背景
        this.scene.fog = new THREE.FogExp2(0x87CEEB, 0.008);
        
        this.setupLights();
        this.setupEnvironment();
        this.setupScene();
        this.setupUI();
    }

    setupLights() {
        // 温暖的阳光
        const ambient = new THREE.AmbientLight(0xfff5e6, 0.6);
        this.scene.add(ambient);
        
        const sunLight = new THREE.DirectionalLight(0xfffaf0, 0.8);
        sunLight.position.set(10, 20, 10);
        sunLight.castShadow = true;
        this.scene.add(sunLight);
        
        // 补光
        const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
        fillLight.position.set(-10, 10, -10);
        this.scene.add(fillLight);
    }

    setupEnvironment() {
        // 草地
        const grassGeo = new THREE.CircleGeometry(15, 64);
        const grassMat = new THREE.MeshStandardMaterial({ 
            color: 0x4CAF50,
            roughness: 0.8
        });
        const grass = new THREE.Mesh(grassGeo, grassMat);
        grass.rotation.x = -Math.PI / 2;
        grass.position.y = -0.1;
        this.scene.add(grass);
        
        // 草地边缘装饰
        const edgeGeo = new THREE.RingGeometry(14.5, 15.5, 64);
        const edgeMat = new THREE.MeshStandardMaterial({ color: 0x388E3C });
        const edge = new THREE.Mesh(edgeGeo, edgeMat);
        edge.rotation.x = -Math.PI / 2;
        edge.position.y = -0.05;
        this.scene.add(edge);
    }

    setupScene() {
        this.mainGroup = new THREE.Group();
        this.scene.add(this.mainGroup);
        
        // 创建8个小朋友围成圈
        this.createChildren();
        
        // 创建中间的鼓和击鼓者
        this.createDrum();
        
        // 创建花
        this.createFlower();
        
        // 创建数字标签
        this.createNumberLabels();
        
        // 创建信息面板
        this.createInfoDisplay();
    }

    createChildren() {
        const radius = 8; // 圆圈半径
        const colors = [
            0xFF6B6B, // 红
            0xFFE66D, // 黄
            0x4ECDC4, // 青
            0x45B7D1, // 蓝
            0x96CEB4, // 绿
            0xFECEA8, // 橙
            0xDDA0DD, // 粉紫
            0x98D8C8  // 薄荷
        ];
        
        for (let i = 0; i < this.totalChildren; i++) {
            const angle = (i / this.totalChildren) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const child = this.createChildFigure(colors[i], i + 1);
            child.position.set(x, 0, z);
            child.lookAt(0, 0, 0);
            
            child.userData = {
                number: i + 1,
                hoverTitle: `${i + 1}号小朋友`,
                hoverDesc: i === 0 ? '花从这里开始传' : `第${i + 1}个位置`,
                hoverIcon: 'fa-child',
                name: `${i + 1}号小朋友`,
                description: `
                    <p class="text-lg font-bold text-blue-400 mb-3">👦 ${i + 1}号小朋友</p>
                    <p class="text-gray-300 mb-3">坐在圆圈的第 ${i + 1} 个位置</p>
                    <div class="bg-gray-800 rounded p-3 mb-3">
                        <p class="text-sm text-white">传递规律：</p>
                        <p class="text-sm text-gray-400">花会在第 ${i + 1}, ${i + 1 + 8}, ${i + 1 + 16}... 次传到这里</p>
                    </div>
                `,
                onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
            };
            
            this.children.push(child);
            this.interactables.push(child);
            this.mainGroup.add(child);
        }
    }

    createChildFigure(color, number) {
        const group = new THREE.Group();
        
        // 身体 - 使用圆柱体+球体组合代替CapsuleGeometry
        const bodyGeo = new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16);
        const bodyMat = new THREE.MeshStandardMaterial({ color });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        body.position.y = 1.2;
        group.add(body);
        
        // 身体底部圆球
        const bodyBottomGeo = new THREE.SphereGeometry(0.5, 16, 8);
        const bodyBottom = new THREE.Mesh(bodyBottomGeo, bodyMat);
        bodyBottom.position.y = 0.6;
        group.add(bodyBottom);
        
        // 身体顶部圆球
        const bodyTop = new THREE.Mesh(bodyBottomGeo, bodyMat);
        bodyTop.position.y = 1.8;
        group.add(bodyTop);
        
        // 头
        const headGeo = new THREE.SphereGeometry(0.5, 16, 16);
        const headMat = new THREE.MeshStandardMaterial({ color: 0xFFE4C4 });
        const head = new THREE.Mesh(headGeo, headMat);
        head.position.y = 2.5;
        group.add(head);
        
        // 眼睛
        const eyeGeo = new THREE.SphereGeometry(0.08, 8, 8);
        const eyeMat = new THREE.MeshBasicMaterial({ color: 0x333333 });
        const leftEye = new THREE.Mesh(eyeGeo, eyeMat);
        leftEye.position.set(-0.18, 2.55, 0.4);
        group.add(leftEye);
        const rightEye = new THREE.Mesh(eyeGeo, eyeMat);
        rightEye.position.set(0.18, 2.55, 0.4);
        group.add(rightEye);
        
        // 腮红
        const blushGeo = new THREE.CircleGeometry(0.1, 16);
        const blushMat = new THREE.MeshBasicMaterial({ color: 0xFFB6C1, transparent: true, opacity: 0.6 });
        const leftBlush = new THREE.Mesh(blushGeo, blushMat);
        leftBlush.position.set(-0.35, 2.4, 0.42);
        group.add(leftBlush);
        const rightBlush = new THREE.Mesh(blushGeo, blushMat);
        rightBlush.position.set(0.35, 2.4, 0.42);
        group.add(rightBlush);
        
        // 笑脸 - 用小圆球代替
        const smileGeo = new THREE.SphereGeometry(0.06, 8, 8);
        const smileMat = new THREE.MeshBasicMaterial({ color: 0xFF6B6B });
        const smile = new THREE.Mesh(smileGeo, smileMat);
        smile.position.set(0, 2.32, 0.48);
        smile.scale.set(2.5, 1, 1);
        group.add(smile);
        
        // 头发
        const hairGeo = new THREE.SphereGeometry(0.52, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const hairMat = new THREE.MeshStandardMaterial({ color: 0x4a3728 });
        const hair = new THREE.Mesh(hairGeo, hairMat);
        hair.position.y = 2.55;
        group.add(hair);
        
        // 双手
        const handGeo = new THREE.SphereGeometry(0.18, 8, 8);
        const handMat = new THREE.MeshStandardMaterial({ color: 0xFFE4C4 });
        const leftHand = new THREE.Mesh(handGeo, handMat);
        leftHand.position.set(-0.75, 1.5, 0.4);
        leftHand.name = 'leftHand';
        group.add(leftHand);
        const rightHand = new THREE.Mesh(handGeo, handMat);
        rightHand.position.set(0.75, 1.5, 0.4);
        rightHand.name = 'rightHand';
        group.add(rightHand);
        
        // 双脚
        const footGeo = new THREE.SphereGeometry(0.2, 8, 8);
        const footMat = new THREE.MeshStandardMaterial({ color: 0x333333 });
        const leftFoot = new THREE.Mesh(footGeo, footMat);
        leftFoot.position.set(-0.25, 0.15, 0.1);
        group.add(leftFoot);
        const rightFoot = new THREE.Mesh(footGeo, footMat);
        rightFoot.position.set(0.25, 0.15, 0.1);
        group.add(rightFoot);
        
        return group;
    }

    createDrum() {
        const drumGroup = new THREE.Group();
        
        // 鼓身
        const drumBodyGeo = new THREE.CylinderGeometry(1.2, 1.2, 1.5, 32);
        const drumBodyMat = new THREE.MeshStandardMaterial({ color: 0xCD853F });
        const drumBody = new THREE.Mesh(drumBodyGeo, drumBodyMat);
        drumBody.position.y = 0.75;
        drumGroup.add(drumBody);
        
        // 鼓面
        const drumTopGeo = new THREE.CircleGeometry(1.2, 32);
        const drumTopMat = new THREE.MeshStandardMaterial({ color: 0xFFF8DC });
        const drumTop = new THREE.Mesh(drumTopGeo, drumTopMat);
        drumTop.position.y = 1.51;
        drumTop.rotation.x = -Math.PI / 2;
        drumGroup.add(drumTop);
        
        // 鼓边装饰
        const rimGeo = new THREE.TorusGeometry(1.2, 0.08, 8, 32);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.position.y = 1.5;
        rim.rotation.x = Math.PI / 2;
        drumGroup.add(rim);
        
        // 红色装饰带
        const bandGeo = new THREE.CylinderGeometry(1.25, 1.25, 0.3, 32);
        const bandMat = new THREE.MeshStandardMaterial({ color: 0xFF4444 });
        const band = new THREE.Mesh(bandGeo, bandMat);
        band.position.y = 0.75;
        drumGroup.add(band);
        
        drumGroup.position.set(0, 0, 0);
        
        drumGroup.userData = {
            hoverTitle: '大鼓',
            hoverDesc: '鼓声停止时，花在谁手里就表演',
            hoverIcon: 'fa-drum',
            name: '大鼓',
            description: `
                <p class="text-lg font-bold text-orange-400 mb-3">🥁 大鼓</p>
                <p class="text-gray-300 mb-3">击鼓传花的核心道具！</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-white">游戏规则：</p>
                    <p class="text-sm text-gray-400">• 鼓声响起，花开始传递</p>
                    <p class="text-sm text-gray-400">• 花从1号开始，按顺序传</p>
                    <p class="text-sm text-gray-400">• 鼓声停止，持花者表演</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(drumGroup);
        this.drum = drumGroup;
        this.mainGroup.add(drumGroup);
        
        // 创建击鼓者（背对圆圈）
        this.createDrummer();
    }

    createDrummer() {
        const drummer = this.createChildFigure(0x9C27B0, 0);
        drummer.position.set(0, 0, -3);
        drummer.rotation.y = Math.PI; // 背对大家
        
        // 鼓槌
        const stickGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const stickMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const stick = new THREE.Mesh(stickGeo, stickMat);
        stick.position.set(0.5, 1.8, -2.5);
        stick.rotation.z = Math.PI / 4;
        this.mainGroup.add(stick);
        
        this.drummer = drummer;
        this.mainGroup.add(drummer);
    }

    createFlower() {
        const flowerGroup = new THREE.Group();
        
        // 花心
        const centerGeo = new THREE.SphereGeometry(0.25, 16, 16);
        const centerMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFD700,
            emissive: 0xFFD700,
            emissiveIntensity: 0.3
        });
        const center = new THREE.Mesh(centerGeo, centerMat);
        flowerGroup.add(center);
        
        // 花瓣 - 使用扁平的椭球
        const petalMat = new THREE.MeshStandardMaterial({ 
            color: 0xFF69B4,
            emissive: 0xFF69B4,
            emissiveIntensity: 0.2
        });
        
        for (let i = 0; i < 6; i++) {
            const petalGeo = new THREE.SphereGeometry(0.28, 8, 8);
            const petal = new THREE.Mesh(petalGeo, petalMat);
            const angle = (i / 6) * Math.PI * 2;
            petal.position.set(Math.cos(angle) * 0.38, 0, Math.sin(angle) * 0.38);
            petal.scale.set(1, 0.35, 1);
            flowerGroup.add(petal);
        }
        
        flowerGroup.userData = {
            hoverTitle: '花',
            hoverDesc: '按顺序在小朋友之间传递',
            hoverIcon: 'fa-spa',
            name: '花',
            description: `
                <p class="text-lg font-bold text-pink-400 mb-3">🌸 花</p>
                <p class="text-gray-300 mb-3">从1号小朋友开始，按1→2→3→...→8→1的顺序传递</p>
                <div class="bg-gray-800 rounded p-3">
                    <p class="text-sm text-yellow-400">💡 规律：每传8次，花会回到同一个人手里！</p>
                </div>
            `,
            onClick: (t) => { this.highlightObject(t); this.showInfoPanel(t); }
        };
        this.interactables.push(flowerGroup);
        this.flower = flowerGroup;
        this.mainGroup.add(flowerGroup);
        
        // 初始位置：1号小朋友手中（放在赋值之后）
        this.updateFlowerPosition(1);
    }

    updateFlowerPosition(holderNumber) {
        if (!this.flower || !this.children[holderNumber - 1]) return;
        
        const holder = this.children[holderNumber - 1];
        const worldPos = new THREE.Vector3();
        holder.getWorldPosition(worldPos);
        
        // 花在小朋友胸前位置
        this.flower.position.set(worldPos.x * 0.85, 2, worldPos.z * 0.85);
        this.currentHolder = holderNumber;
    }

    createNumberLabels() {
        const radius = 10;
        
        for (let i = 0; i < this.totalChildren; i++) {
            const angle = (i / this.totalChildren) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // 创建数字标签
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
            const ctx = canvas.getContext('2d');
            
            // 圆形背景
            ctx.beginPath();
            ctx.arc(64, 64, 56, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.stroke();
            
            // 数字
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 64px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(String(i + 1), 64, 68);
            
            const texture = new THREE.CanvasTexture(canvas);
            const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture }));
            sprite.scale.set(1.5, 1.5, 1);
            sprite.position.set(x, 4, z);
            this.mainGroup.add(sprite);
        }
    }

    createInfoDisplay() {
        // 信息显示面板会在UI中动态更新
    }

    setupUI() {
        const controlsDiv = document.getElementById('scene-controls');
        controlsDiv.style.display = 'flex';
        controlsDiv.innerHTML = `
            <div class="flex items-center gap-2 mr-4">
                <span class="text-gray-300 text-sm">传递次数:</span>
                <input type="number" id="pass-count-input" value="0" min="0" max="999" 
                    class="w-20 px-2 py-1 bg-gray-700 text-white rounded border border-gray-600 text-center">
            </div>
            <button class="control-btn" id="btn-pass-once">
                <i class="fas fa-hand-point-right"></i> 传1次
            </button>
            <button class="control-btn" id="btn-pass-to">
                <i class="fas fa-forward"></i> 传到指定次数
            </button>
            <button class="control-btn" id="btn-solve-q1">
                <i class="fas fa-question-circle"></i> 题目1: 传42次
            </button>
            <button class="control-btn" id="btn-solve-q2">
                <i class="fas fa-question-circle"></i> 题目2: 传69次
            </button>
            <button class="control-btn" id="btn-reset">
                <i class="fas fa-redo"></i> 重置
            </button>
            <button class="control-btn" id="btn-reset-view">
                <i class="fas fa-video"></i> 重置视角
            </button>
        `;
        
        // 传1次
        document.getElementById('btn-pass-once').onclick = () => this.passFlower(1);
        
        // 传到指定次数
        document.getElementById('btn-pass-to').onclick = () => {
            const target = parseInt(document.getElementById('pass-count-input').value) || 0;
            const diff = target - this.passCount;
            if (diff > 0) {
                this.passFlower(diff);
            }
        };
        
        // 题目1
        document.getElementById('btn-solve-q1').onclick = () => this.solveQuestion1();
        
        // 题目2
        document.getElementById('btn-solve-q2').onclick = () => this.solveQuestion2();
        
        // 重置
        document.getElementById('btn-reset').onclick = () => this.resetGame();
        
        // 重置视角
        document.getElementById('btn-reset-view').onclick = () => this.resetView();
        
        // 更新显示
        this.updateDisplay();
    }

    passFlower(times) {
        if (this.isAnimating || times <= 0) return;
        this.isAnimating = true;
        
        let count = 0;
        const interval = setInterval(() => {
            this.passCount++;
            const nextHolder = (this.currentHolder % this.totalChildren) + 1;
            
            // 动画：花移动到下一个人
            this.animateFlowerPass(nextHolder);
            
            count++;
            this.updateDisplay();
            
            if (count >= times) {
                clearInterval(interval);
                setTimeout(() => {
                    this.isAnimating = false;
                }, 300);
            }
        }, 400);
    }

    animateFlowerPass(toHolder) {
        const holder = this.children[toHolder - 1];
        const worldPos = new THREE.Vector3();
        holder.getWorldPosition(worldPos);
        
        gsap.to(this.flower.position, {
            x: worldPos.x * 0.85,
            z: worldPos.z * 0.85,
            duration: 0.35,
            ease: 'power2.out'
        });
        
        // 花跳跃效果
        gsap.to(this.flower.position, {
            y: 3,
            duration: 0.15,
            yoyo: true,
            repeat: 1,
            ease: 'power2.out'
        });
        
        // 高亮当前持花者
        this.highlightChild(toHolder);
        
        this.currentHolder = toHolder;
    }

    highlightChild(number) {
        // 重置所有孩子
        this.children.forEach((child, i) => {
            child.scale.setScalar(1);
        });
        
        // 高亮当前持花者
        const current = this.children[number - 1];
        gsap.to(current.scale, {
            x: 1.15, y: 1.15, z: 1.15,
            duration: 0.2,
            yoyo: true,
            repeat: 1
        });
    }

    solveQuestion1() {
        // 题目1：传了42次，花在几号小朋友的手里？
        this.resetGame();
        this.showGuide('📝 题目1：传了42次，花在几号手里？');
        
        setTimeout(() => {
            // 快速演示
            this.passCount = 42;
            const position = (42 % this.totalChildren) + 1; // 42 % 8 = 2, 所以在 1+2=3 号
            // 更正：花从1号开始，传42次后位置 = (1 + 42 - 1) % 8 + 1 = 42 % 8 + 1 = 2 + 1 = 3
            // 实际上：传0次在1号，传1次在2号，...传7次在8号，传8次又在1号
            // 所以传42次：42 % 8 = 2，在 (1+2)=3号？不对
            // 正确计算：起始1号，传n次后位置 = (1-1+n) % 8 + 1 = n % 8 + 1
            // 传42次：42 % 8 = 2, 位置 = 2 + 1 = 3号
            const correctPosition = (42 % 8) + 1; // = 3
            
            this.updateFlowerPosition(correctPosition);
            this.updateDisplay();
            
            setTimeout(() => {
                this.showGuide(`✅ 答案：传42次后，花在 ${correctPosition} 号小朋友手里！`);
                this.showSolutionPanel(1, 42, correctPosition);
            }, 500);
        }, 1000);
    }

    solveQuestion2() {
        // 题目2：传了69次，1号小朋友传过几次花？
        this.resetGame();
        this.showGuide('📝 题目2：传了69次，1号传过几次花？');
        
        setTimeout(() => {
            // 1号传花的次数 = 花经过1号的次数
            // 花在1号的次数：第0次(开始), 第8次, 第16次, 第24次...
            // 传69次，1号传出花的次数 = Math.floor(69/8) + 1 = 8 + 1 = 9次
            // 不对，要看花经过1号多少次
            // 开始在1号(第0次传)，每过8次回到1号
            // 传69次后：0, 8, 16, 24, 32, 40, 48, 56, 64 这些时刻花在1号
            // 所以1号拿到花 Math.floor(69/8) + 1 = 9次，传出去也是9次（如果最后不在1号）
            // 69 % 8 = 5，最后花在6号，不在1号
            // 所以1号传过 Math.floor(69/8) + 1 = 9次
            const timesPass = Math.floor(69 / 8) + 1; // = 9
            
            this.passCount = 69;
            const finalPosition = (69 % 8) + 1; // = 6
            this.updateFlowerPosition(finalPosition);
            this.updateDisplay();
            
            setTimeout(() => {
                this.showGuide(`✅ 答案：传69次，1号小朋友传过 ${timesPass} 次花！`);
                this.showSolutionPanel(2, 69, timesPass);
            }, 500);
        }, 1000);
    }

    showSolutionPanel(questionNum, passTotal, answer) {
        const panel = document.getElementById('info-panel');
        let content = '';
        
        if (questionNum === 1) {
            content = `
                <p class="text-lg font-bold text-green-400 mb-3">✅ 题目1解答</p>
                <p class="text-gray-300 mb-3">传了 <b>${passTotal}</b> 次，花在几号手里？</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white mb-2">🧮 解题思路：</p>
                    <p class="text-sm text-gray-400">1. 共有8个小朋友，花每传8次回到原点</p>
                    <p class="text-sm text-gray-400">2. ${passTotal} ÷ 8 = ${Math.floor(passTotal/8)} ... <b>${passTotal % 8}</b></p>
                    <p class="text-sm text-gray-400">3. 余数是 ${passTotal % 8}，说明从1号往后数 ${passTotal % 8} 个</p>
                    <p class="text-sm text-yellow-400 mt-2">4. 1 + ${passTotal % 8} = <b>${answer}</b> 号</p>
                </div>
                <p class="text-lg text-center text-green-400 font-bold">答案：${answer} 号小朋友</p>
            `;
        } else {
            content = `
                <p class="text-lg font-bold text-green-400 mb-3">✅ 题目2解答</p>
                <p class="text-gray-300 mb-3">传了 <b>${passTotal}</b> 次，1号传过几次花？</p>
                <div class="bg-gray-800 rounded p-3 mb-3">
                    <p class="text-sm text-white mb-2">🧮 解题思路：</p>
                    <p class="text-sm text-gray-400">1. 花开始就在1号手里（第1次传）</p>
                    <p class="text-sm text-gray-400">2. 每传8次，花回到1号（又传1次）</p>
                    <p class="text-sm text-gray-400">3. ${passTotal} ÷ 8 = ${Math.floor(passTotal/8)} ... ${passTotal % 8}</p>
                    <p class="text-sm text-yellow-400 mt-2">4. 1号传花次数 = ${Math.floor(passTotal/8)} + 1 = <b>${answer}</b> 次</p>
                </div>
                <p class="text-lg text-center text-green-400 font-bold">答案：${answer} 次</p>
            `;
        }
        
        document.getElementById('info-title').innerHTML = `<i class="fas fa-lightbulb mr-2 text-yellow-400"></i>解答`;
        document.getElementById('info-content').innerHTML = content;
        panel.classList.add('visible');
    }

    updateDisplay() {
        // 更新输入框
        const input = document.getElementById('pass-count-input');
        if (input) input.value = this.passCount;
        
        // 更新引导信息
        const position = this.currentHolder;
        if (this.passCount > 0) {
            this.showGuide(`🌸 已传 ${this.passCount} 次，花现在在 ${position} 号小朋友手里`);
        }
    }

    resetGame() {
        this.passCount = 0;
        this.currentHolder = 1;
        this.updateFlowerPosition(1);
        this.updateDisplay();
        this.showGuide('🔄 已重置，花回到1号小朋友手里');
        
        // 重置所有孩子大小
        this.children.forEach(child => {
            child.scale.setScalar(1);
        });
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

    startAutoPlay() {
        this.isAutoPlaying = true;
        setTimeout(() => {
            this.showGuide('🥁 击鼓传花：8个小朋友围成圈，花从1号开始传！');
        }, 500);
        
        // 自动演示几次传花
        setTimeout(() => {
            this.passFlower(3);
        }, 2000);
    }

    showGuide(message) {
        const container = document.getElementById('scene-canvas-container');
        const old = container.querySelector('.scene-guide-message');
        if (old) old.remove();
        
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

    highlightObject(target) {
        this.highlighted = target;
        gsap.to(target.scale, { x: 1.15, y: 1.15, z: 1.15, duration: 0.15, yoyo: true, repeat: 1 });
    }

    showInfoPanel(target) {
        const panel = document.getElementById('info-panel');
        document.getElementById('info-title').innerHTML = `<i class="fas fa-child mr-2"></i>${target.userData.name}`;
        document.getElementById('info-content').innerHTML = target.userData.description;
        panel.classList.add('visible');
    }

    animate(time, delta) {
        // 花轻微旋转
        if (this.flower) {
            this.flower.rotation.y = time * 0.5;
        }
        
        // 鼓槌击打动画（可选）
    }

    getInteractables() {
        return this.interactables;
    }

    dispose() {
        if (this.mainGroup) this.scene.remove(this.mainGroup);
    }

    onBackgroundClick() {
        const panel = document.getElementById('info-panel');
        if (panel) panel.classList.remove('visible');
    }

    createLabels(manager) {
        manager.createLabel('击鼓者', new THREE.Vector3(0, 4, -3), 'user');
    }
};
